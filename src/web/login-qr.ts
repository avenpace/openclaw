import { randomUUID } from "node:crypto";
import { DisconnectReason } from "@whiskeysockets/baileys";
import { loadConfig } from "../config/config.js";
import { danger, info, success } from "../globals.js";
import { logInfo } from "../logger.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import { resolveWhatsAppAccount } from "./accounts.js";
import { renderQrPngBase64 } from "./qr-image.js";
import {
  createWaSocket,
  formatError,
  getStatusCode,
  logoutWeb,
  readWebSelfId,
  waitForWaConnection,
  webAuthExists,
} from "./session.js";

type WaSocket = Awaited<ReturnType<typeof createWaSocket>>;

type PairingMode = "qr" | "code";

type ActiveLogin = {
  accountId: string;
  authDir: string;
  isLegacyAuthDir: boolean;
  id: string;
  sock: WaSocket;
  startedAt: number;
  pairingMode: PairingMode; // Track which pairing method user chose
  qr?: string;
  qrDataUrl?: string;
  connected: boolean;
  error?: string;
  errorStatus?: number;
  waitPromise: Promise<void>;
  restartAttempted: boolean;
  verbose: boolean;
  encryptionKey?: Buffer;
  // Code pairing fields
  pairingCode?: string;
  phoneNumber?: string;
  codeRetryCount: number;
  codeGeneratedAt?: number; // Timestamp when current code was generated
  runtime?: RuntimeEnv;
  codeRetryInProgress?: boolean; // Prevents waitForWebLogin from returning error during retry
  // Socket tracking to prevent race conditions during retry
  currentSocketId: number; // Incremented on each new socket to track which is current
};

const ACTIVE_LOGIN_TTL_MS = 3 * 60_000;
const activeLogins = new Map<string, ActiveLogin>();

function closeSocket(sock: WaSocket) {
  try {
    sock.ws?.close();
  } catch {
    // ignore
  }
}

async function resetActiveLogin(accountId: string, reason?: string) {
  const login = activeLogins.get(accountId);
  if (login) {
    closeSocket(login.sock);
    activeLogins.delete(accountId);
  }
  if (reason) {
    logInfo(reason);
  }
}

function isLoginFresh(login: ActiveLogin) {
  return Date.now() - login.startedAt < ACTIVE_LOGIN_TTL_MS;
}

function attachLoginWaiter(accountId: string, login: ActiveLogin) {
  login.waitPromise = waitForWaConnection(login.sock)
    .then(() => {
      const current = activeLogins.get(accountId);
      if (current?.id === login.id) {
        current.connected = true;
      }
    })
    .catch((err) => {
      const current = activeLogins.get(accountId);
      if (current?.id !== login.id) {
        return;
      }
      // Don't set error if code pairing retry is in progress
      if (current.codeRetryInProgress) {
        console.log(`[CodePairing] Ignoring error during retry: ${formatError(err)}`);
        return;
      }
      current.error = formatError(err);
      current.errorStatus = getStatusCode(err);
    });
}

async function restartLoginSocket(login: ActiveLogin, runtime: RuntimeEnv) {
  if (login.restartAttempted) {
    return false;
  }
  login.restartAttempted = true;
  runtime.log(
    info("WhatsApp asked for a restart after pairing (code 515); retrying connection once…"),
  );
  closeSocket(login.sock);
  try {
    const sock = await createWaSocket(false, login.verbose, {
      authDir: login.authDir,
      encryptionKey: login.encryptionKey,
    });
    login.sock = sock;
    login.connected = false;
    login.error = undefined;
    login.errorStatus = undefined;
    attachLoginWaiter(login.accountId, login);
    return true;
  } catch (err) {
    login.error = formatError(err);
    login.errorStatus = getStatusCode(err);
    return false;
  }
}

const MAX_CODE_RETRIES = 5;

/**
 * Auto-retry pairing code when connection fails (like WhatsApp Web does).
 * This handles the 428 "Precondition Required" error by requesting a fresh code.
 */
async function retryPairingCode(login: ActiveLogin): Promise<string | null> {
  if (!login.phoneNumber) {
    return null;
  }
  if (login.codeRetryCount >= MAX_CODE_RETRIES) {
    login.runtime?.log(
      danger(`[CodePairing] Max retries (${MAX_CODE_RETRIES}) reached, giving up`),
    );
    return null;
  }

  login.codeRetryCount++;

  // CRITICAL: Increment socket ID FIRST to invalidate any pending handlers on the old socket
  // This prevents race conditions where the old socket generates a code during retry
  login.currentSocketId++;
  const thisSocketId = login.currentSocketId;
  console.log(
    `[CodePairing] Retry: Incremented socketId to ${thisSocketId}, old handlers will be ignored`,
  );

  // Add delay before retry to avoid WhatsApp rate limiting
  const retryDelay = login.codeRetryCount * 2000; // 2s, 4s, 6s, etc.
  console.log(`[CodePairing] Waiting ${retryDelay / 1000}s before retry to avoid rate limiting...`);
  await new Promise((r) => setTimeout(r, retryDelay));

  login.runtime?.log(
    info(`[CodePairing] Retrying pairing code (attempt ${login.codeRetryCount})...`),
  );

  // Close existing socket
  closeSocket(login.sock);

  // Clear auth directory to remove stale/invalidated session data
  // This is necessary because WhatsApp invalidates the session when code expires
  try {
    const { rm, mkdir } = await import("node:fs/promises");
    await rm(login.authDir, { recursive: true, force: true });
    await mkdir(login.authDir, { recursive: true });
    console.log(`[CodePairing] Cleared auth dir for fresh retry`);
  } catch (err) {
    console.log(`[CodePairing] Could not clear auth dir:`, err);
  }

  // Create a new socket - NO QR waiting for code pairing
  let newSock: WaSocket;

  try {
    newSock = await createWaSocket(false, login.verbose, {
      authDir: login.authDir,
      encryptionKey: login.encryptionKey,
      codePairing: true, // Use valid browser config for code pairing
      // NO onQr - request code immediately
    });
    console.log(`[CodePairing] New socket created for retry`);
  } catch (err) {
    login.runtime?.log(danger(`[CodePairing] Failed to create new socket: ${formatError(err)}`));
    return null;
  }

  const phoneDigits = login.phoneNumber.slice(1);

  // Wait for "connecting" state, then 500ms, then request code
  try {
    const newCode = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), 30_000);

      const handler = async (update: { connection?: string; qr?: string }) => {
        // Check if this socket is still the current one (prevents race conditions)
        if (login.currentSocketId !== thisSocketId) {
          console.log(
            `[CodePairing:Retry] Socket ${thisSocketId} superseded by ${login.currentSocketId}, ignoring event`,
          );
          newSock.ev.off("connection.update", handler);
          clearTimeout(timeout);
          return;
        }

        console.log(
          `[CodePairing:Retry] connection.update: connection=${update.connection}, qr=${!!update.qr}`,
        );

        // Wait for QR (session established), then request code
        if (update.qr) {
          clearTimeout(timeout);

          console.log(`[CodePairing:Retry] QR received, requesting code...`);

          try {
            const code = await newSock.requestPairingCode(phoneDigits);
            console.log(`[CodePairing:Retry] Got code: ${code}`);
            resolve(code);
          } catch (err) {
            console.log(`[CodePairing:Retry] Failed:`, err);
            newSock.ev.off("connection.update", handler);
            reject(err);
          }
          return;
        }

        if (update.connection === "connecting") {
          console.log(`[CodePairing:Retry] Connecting...`);
        }

        if (update.connection === "close") {
          newSock.ev.off("connection.update", handler);
          clearTimeout(timeout);
          reject(new Error("Connection closed"));
        }
      };

      newSock.ev.on("connection.update", handler);
    });
    console.log(`[CodePairing:Retry] New code: ${newCode}`);

    const formattedCode =
      newCode.length === 8 ? `${newCode.slice(0, 4)}-${newCode.slice(4)}` : newCode;

    login.runtime?.log(info(`[CodePairing] New pairing code: ${formattedCode}`));

    // Update login with new socket and code
    login.sock = newSock;
    login.pairingCode = formattedCode;
    login.codeGeneratedAt = Date.now();
    login.error = undefined;
    login.errorStatus = undefined;

    // Re-attach connection waiter
    attachLoginWaiter(login.accountId, login);

    // Set up auto-retry for the new socket
    setupCodePairingRetryHandler(login);

    return formattedCode;
  } catch (err) {
    closeSocket(newSock);
    login.runtime?.log(danger(`[CodePairing] Failed to get new pairing code: ${formatError(err)}`));
    return null;
  }
}

/**
 * Set up the connection event handler for code pairing.
 *
 * IMPORTANT: This is ONLY for code pairing mode (pairingMode: "code").
 *
 * Status codes:
 * - 408 = QR timeout ("QR refs attempts ended") - Baileys' internal QR expired.
 *         Since we're using code pairing, the socket is dead but we should
 *         create a new one and get a fresh code.
 * - 428 = Precondition Required (code expired/invalid) - Code was rejected.
 *         Get a fresh code.
 * - 515 = Restart required - WhatsApp wants us to reconnect.
 */
function setupCodePairingRetryHandler(login: ActiveLogin) {
  // Capture the socket ID at setup time to detect when socket is superseded
  const setupSocketId = login.currentSocketId;

  login.sock.ev.on(
    "connection.update",
    async (update: { connection?: string; lastDisconnect?: unknown }) => {
      // Only handle code pairing mode
      if (login.pairingMode !== "code") {
        return;
      }

      // Check if this handler's socket is still the current one
      if (login.currentSocketId !== setupSocketId) {
        console.log(
          `[CodePairing] Retry handler for socket ${setupSocketId} superseded by ${login.currentSocketId}, ignoring`,
        );
        return;
      }

      login.runtime?.log(info(`[CodePairing] connection.update: ${JSON.stringify(update)}`));

      if (update.connection === "close" && !login.connected) {
        const statusCode = getStatusCode(update.lastDisconnect);

        // 408 = QR timeout - socket is dead, need new socket + code
        // 428 = Code expired/invalid - need new code
        // Both require creating fresh socket and code
        if (statusCode === 408 || statusCode === 428) {
          const reason =
            statusCode === 408 ? "QR timeout (irrelevant but socket died)" : "code expired";
          login.runtime?.log(
            info(`[CodePairing] ${reason} (${statusCode}), creating fresh socket + code...`),
          );

          // CRITICAL: Set retry flag and clear error so waitForWebLogin doesn't return early
          login.codeRetryInProgress = true;
          login.error = undefined;
          login.errorStatus = undefined;

          const newCode = await retryPairingCode(login);
          login.codeRetryInProgress = false;

          if (!newCode) {
            login.error = "Failed to get new pairing code after retry";
            login.errorStatus = statusCode;
          }
          return;
        }

        // Other close reasons - set error but don't auto-retry
        login.runtime?.log(info(`[CodePairing] Connection closed (${statusCode}), not retrying`));
        login.error = `Connection closed: ${statusCode}`;
        login.errorStatus = statusCode;
      }
    },
  );
}

export async function startWebLoginWithQr(
  opts: {
    verbose?: boolean;
    timeoutMs?: number;
    force?: boolean;
    accountId?: string;
    authDir?: string; // Direct authDir override (bypasses config resolution)
    runtime?: RuntimeEnv;
    encryptionKey?: Buffer; // Optional encryption key for encrypted credential storage
  } = {},
): Promise<{ qrDataUrl?: string; message: string }> {
  const runtime = opts.runtime ?? defaultRuntime;
  const cfg = loadConfig();
  const resolvedAccount = resolveWhatsAppAccount({ cfg, accountId: opts.accountId });
  // Allow direct authDir override for multi-tenant platforms
  const account = opts.authDir ? { ...resolvedAccount, authDir: opts.authDir } : resolvedAccount;
  const hasWeb = await webAuthExists(account.authDir);
  const selfId = readWebSelfId(account.authDir);
  if (hasWeb && !opts.force) {
    const who = selfId.e164 ?? selfId.jid ?? "unknown";
    return {
      message: `WhatsApp is already linked (${who}). Say “relink” if you want a fresh QR.`,
    };
  }

  const existing = activeLogins.get(account.accountId);
  if (!opts.force && existing && isLoginFresh(existing) && existing.qrDataUrl) {
    return {
      qrDataUrl: existing.qrDataUrl,
      message: "QR already active. Scan it in WhatsApp → Linked Devices.",
    };
  }

  await resetActiveLogin(account.accountId);

  let resolveQr: ((qr: string) => void) | null = null;
  let rejectQr: ((err: Error) => void) | null = null;
  const qrPromise = new Promise<string>((resolve, reject) => {
    resolveQr = resolve;
    rejectQr = reject;
  });

  const qrTimer = setTimeout(
    () => {
      rejectQr?.(new Error("Timed out waiting for WhatsApp QR"));
    },
    Math.max(opts.timeoutMs ?? 30_000, 5000),
  );

  let sock: WaSocket;
  let pendingQr: string | null = null;
  try {
    sock = await createWaSocket(false, Boolean(opts.verbose), {
      authDir: account.authDir,
      encryptionKey: opts.encryptionKey,
      onQr: (qr: string) => {
        if (pendingQr) {
          return;
        }
        pendingQr = qr;
        const current = activeLogins.get(account.accountId);
        if (current && !current.qr) {
          current.qr = qr;
        }
        clearTimeout(qrTimer);
        runtime.log(info("WhatsApp QR received."));
        resolveQr?.(qr);
      },
    });
  } catch (err) {
    clearTimeout(qrTimer);
    await resetActiveLogin(account.accountId);
    return {
      message: `Failed to start WhatsApp login: ${String(err)}`,
    };
  }
  const login: ActiveLogin = {
    accountId: account.accountId,
    authDir: account.authDir,
    isLegacyAuthDir: account.isLegacyAuthDir,
    id: randomUUID(),
    sock,
    startedAt: Date.now(),
    pairingMode: "qr",
    connected: false,
    waitPromise: Promise.resolve(),
    restartAttempted: false,
    verbose: Boolean(opts.verbose),
    encryptionKey: opts.encryptionKey,
    codeRetryCount: 0,
    currentSocketId: 0, // Not used for QR pairing but required for type
  };
  activeLogins.set(account.accountId, login);
  if (pendingQr && !login.qr) {
    login.qr = pendingQr;
  }
  attachLoginWaiter(account.accountId, login);

  let qr: string;
  try {
    qr = await qrPromise;
  } catch (err) {
    clearTimeout(qrTimer);
    await resetActiveLogin(account.accountId);
    return {
      message: `Failed to get QR: ${String(err)}`,
    };
  }

  const base64 = await renderQrPngBase64(qr);
  login.qrDataUrl = `data:image/png;base64,${base64}`;
  return {
    qrDataUrl: login.qrDataUrl,
    message: "Scan this QR in WhatsApp → Linked Devices.",
  };
}

export async function waitForWebLogin(
  opts: { timeoutMs?: number; runtime?: RuntimeEnv; accountId?: string } = {},
): Promise<{ connected: boolean; message: string }> {
  const runtime = opts.runtime ?? defaultRuntime;
  const cfg = loadConfig();
  const account = resolveWhatsAppAccount({ cfg, accountId: opts.accountId });
  const activeLogin = activeLogins.get(account.accountId);
  if (!activeLogin) {
    return {
      connected: false,
      message: "No active WhatsApp login in progress.",
    };
  }

  const login = activeLogin;
  if (!isLoginFresh(login)) {
    await resetActiveLogin(account.accountId);
    return {
      connected: false,
      message: "The login QR expired. Ask me to generate a new one.",
    };
  }
  const timeoutMs = Math.max(opts.timeoutMs ?? 120_000, 1000);
  const deadline = Date.now() + timeoutMs;

  while (true) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return {
        connected: false,
        message: "Still waiting for the QR scan. Let me know when you’ve scanned it.",
      };
    }
    const timeout = new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), remaining),
    );
    const result = await Promise.race([login.waitPromise.then(() => "done"), timeout]);

    if (result === "timeout") {
      return {
        connected: false,
        message: "Still waiting for the QR scan. Let me know when you’ve scanned it.",
      };
    }

    if (login.error) {
      if (login.errorStatus === DisconnectReason.loggedOut) {
        await logoutWeb({
          authDir: login.authDir,
          isLegacyAuthDir: login.isLegacyAuthDir,
          runtime,
        });
        const message =
          "WhatsApp reported the session is logged out. Cleared cached web session; please scan a new QR.";
        await resetActiveLogin(account.accountId, message);
        runtime.log(danger(message));
        return { connected: false, message };
      }
      if (login.errorStatus === 515) {
        const restarted = await restartLoginSocket(login, runtime);
        if (restarted && isLoginFresh(login)) {
          continue;
        }
      }
      const message = `WhatsApp login failed: ${login.error}`;
      await resetActiveLogin(account.accountId, message);
      runtime.log(danger(message));
      return { connected: false, message };
    }

    if (login.connected) {
      const message = "✅ Linked! WhatsApp is ready.";
      runtime.log(success(message));
      await resetActiveLogin(account.accountId);
      return { connected: true, message };
    }

    return { connected: false, message: "Login ended without a connection." };
  }
}

/**
 * Start WhatsApp login using phone number + pairing code (alternative to QR).
 * User enters the returned 8-digit code in WhatsApp → Linked Devices → Link with phone number.
 */
export async function startWebLoginWithCode(opts: {
  phoneNumber: string; // E.164 format: +6281234567890
  verbose?: boolean;
  timeoutMs?: number;
  force?: boolean;
  accountId?: string;
  authDir?: string;
  runtime?: RuntimeEnv;
  encryptionKey?: Buffer; // Optional encryption key for encrypted credential storage
}): Promise<{ pairingCode?: string; message: string }> {
  const runtime = opts.runtime ?? defaultRuntime;
  const cfg = loadConfig();
  const resolvedAccount = resolveWhatsAppAccount({ cfg, accountId: opts.accountId });
  const account = opts.authDir ? { ...resolvedAccount, authDir: opts.authDir } : resolvedAccount;
  const hasWeb = await webAuthExists(account.authDir);
  const selfId = readWebSelfId(account.authDir);

  if (hasWeb && !opts.force) {
    const who = selfId.e164 ?? selfId.jid ?? "unknown";
    return {
      message: `WhatsApp is already linked (${who}). Use force=true for fresh pairing.`,
    };
  }

  // Clean up any existing login session
  await resetActiveLogin(account.accountId);

  // Validate phone number format (must be E.164: +countrycode followed by digits)
  const phoneNumber = opts.phoneNumber.replace(/\s+/g, "");
  if (!/^\+\d{10,15}$/.test(phoneNumber)) {
    return {
      message: "Invalid phone number format. Use E.164 format: +6281234567890",
    };
  }

  // CRITICAL: For code pairing, always clear auth dir to start fresh
  // This prevents issues where stale creds from a previous session cause immediate 428 errors
  // or where the socket connects with existing creds instead of requiring new pairing
  try {
    const { rm, mkdir } = await import("node:fs/promises");
    await rm(account.authDir, { recursive: true, force: true });
    await mkdir(account.authDir, { recursive: true });
    console.log(`[CodePairing] Cleared auth dir for fresh pairing: ${account.authDir}`);
  } catch (err) {
    console.log(`[CodePairing] Could not clear auth dir:`, err);
  }

  let sock: WaSocket;
  // Track socket ID to prevent race conditions during retry
  // This is initialized here and passed to the login object later
  let initialSocketId = 0;

  try {
    // Create socket - NO QR callback for code pairing
    sock = await createWaSocket(false, Boolean(opts.verbose), {
      authDir: account.authDir,
      encryptionKey: opts.encryptionKey,
      codePairing: true, // Use valid browser config for code pairing
      // NO onQr - we don't want QR mode at all
    });
    runtime.log(info("[CodePairing] Socket created, waiting for WebSocket to connect..."));
  } catch (err) {
    return {
      message: `Failed to start WhatsApp connection: ${String(err)}`,
    };
  }

  const phoneDigits = phoneNumber.slice(1); // Remove '+' prefix

  // Wait for "connecting" state, then 500ms for WS handshake, then request code
  const codePromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout getting pairing code")), 30_000);
    let resolved = false; // Track if we've already resolved to prevent double handling

    const handler = async (update: { connection?: string; qr?: string }) => {
      // Check if already resolved (prevents race conditions)
      if (resolved) {
        return;
      }

      console.log(
        `[CodePairing] connection.update: connection=${update.connection}, qr=${!!update.qr}`,
      );

      // Wait for QR (session fully established), then request code
      // DON'T detach handler - keep listening for connection events
      if (update.qr) {
        clearTimeout(timeout);

        console.log(`[CodePairing] QR received - session established, requesting code...`);

        try {
          const code = await sock.requestPairingCode(phoneDigits);
          console.log(`[CodePairing] Got pairing code: ${code}`);
          resolved = true;
          // Keep handler attached to monitor connection
          resolve(code);
        } catch (err) {
          console.log(`[CodePairing] Failed:`, err);
          resolved = true;
          sock.ev.off("connection.update", handler);
          reject(err);
        }
        return;
      }

      if (update.connection === "connecting") {
        console.log(`[CodePairing] Connecting, waiting for QR...`);
      }

      if (update.connection === "close") {
        resolved = true;
        sock.ev.off("connection.update", handler);
        clearTimeout(timeout);
        reject(new Error("Connection closed"));
        return;
      }
    };

    sock.ev.on("connection.update", handler);
  });

  let pairingCode: string;
  try {
    pairingCode = await codePromise;
    runtime.log(info(`WhatsApp pairing code generated for ${phoneNumber}`));
  } catch (err) {
    closeSocket(sock);
    return {
      message: `Failed to get pairing code: ${formatError(err)}`,
    };
  }

  // Format code as XXXX-XXXX for easier reading
  const formattedCode =
    pairingCode.length === 8 ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` : pairingCode;

  // Track the login session with code pairing fields
  const login: ActiveLogin = {
    accountId: account.accountId,
    authDir: account.authDir,
    isLegacyAuthDir: account.isLegacyAuthDir,
    id: randomUUID(),
    sock,
    startedAt: Date.now(),
    pairingMode: "code", // User chose code pairing - ignore QR events
    connected: false,
    waitPromise: Promise.resolve(),
    restartAttempted: false,
    verbose: Boolean(opts.verbose),
    encryptionKey: opts.encryptionKey,
    // Code pairing specific
    pairingCode: formattedCode,
    phoneNumber,
    codeRetryCount: 0,
    codeGeneratedAt: Date.now(),
    runtime,
    // Socket tracking for race condition prevention
    currentSocketId: initialSocketId,
  };
  activeLogins.set(account.accountId, login);
  attachLoginWaiter(account.accountId, login);

  // Set up auto-retry handler for 428 errors (like WhatsApp Web does)
  setupCodePairingRetryHandler(login);

  return {
    pairingCode: formattedCode,
    message: "Enter this code in WhatsApp → Linked Devices → Link with phone number.",
  };
}

// WhatsApp pairing codes expire after ~25 seconds
const CODE_EXPIRY_MS = 25_000;

/**
 * Get the current status of code-based pairing.
 * Returns codeExpired: true when the code is stale, letting the caller
 * decide when to request a new code (avoids WhatsApp rate limiting).
 */
export function getCodePairingStatus(opts: { accountId?: string }): {
  active: boolean;
  pairingCode?: string;
  connected: boolean;
  error?: string;
  retryCount: number;
  codeExpired?: boolean;
} {
  const cfg = loadConfig();
  const account = resolveWhatsAppAccount({ cfg, accountId: opts.accountId });

  // Debug: log all active logins and the resolved accountId
  console.log(
    `[getCodePairingStatus] requested accountId: ${opts.accountId}, resolved to: ${account.accountId}`,
  );
  console.log(`[getCodePairingStatus] activeLogins keys:`, [...activeLogins.keys()]);

  const login = activeLogins.get(account.accountId);

  if (!login || !login.pairingCode) {
    console.log(`[getCodePairingStatus] No login found for ${account.accountId}`);
    return {
      active: false,
      connected: false,
      retryCount: 0,
    };
  }

  // Check if connected - no need to check expiry
  if (login.connected) {
    return {
      active: true,
      pairingCode: login.pairingCode,
      connected: true,
      retryCount: login.codeRetryCount,
    };
  }

  // Check if code is stale - return codeExpired flag instead of auto-retrying
  // This avoids WhatsApp rate limiting from rapid reconnection attempts
  const codeAge = login.codeGeneratedAt ? Date.now() - login.codeGeneratedAt : Infinity;
  console.log(
    `[getCodePairingStatus] codeAge=${Math.round(codeAge / 1000)}s, phoneNumber=${login.phoneNumber}, error=${login.error}, codeGeneratedAt=${login.codeGeneratedAt}`,
  );

  if (codeAge > CODE_EXPIRY_MS && !login.error) {
    console.log(
      `[getCodePairingStatus] Code is stale (${Math.round(codeAge / 1000)}s old), marking as expired`,
    );
    return {
      active: false,
      pairingCode: login.pairingCode, // Still return old code for display
      connected: false,
      retryCount: login.codeRetryCount,
      codeExpired: true,
    };
  }

  console.log(
    `[getCodePairingStatus] Found login: code=${login.pairingCode}, retryCount=${login.codeRetryCount}`,
  );
  return {
    active: isLoginFresh(login),
    pairingCode: login.pairingCode,
    connected: login.connected,
    error: login.error,
    retryCount: login.codeRetryCount,
    codeExpired: false,
  };
}
