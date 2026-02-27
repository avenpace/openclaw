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

type ActiveLogin = {
  accountId: string;
  authDir: string;
  isLegacyAuthDir: boolean;
  id: string;
  sock: WaSocket;
  startedAt: number;
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
  runtime?: RuntimeEnv;
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
  login.runtime?.log(
    info(`[CodePairing] Retrying pairing code (attempt ${login.codeRetryCount})...`),
  );

  // Close existing socket
  closeSocket(login.sock);

  // Create a new socket
  let newSock: WaSocket;
  let socketReady = false;

  try {
    const readyPromise = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), 30_000);

      newSock = undefined as unknown as WaSocket;
      createWaSocket(false, login.verbose, {
        authDir: login.authDir,
        encryptionKey: login.encryptionKey,
        onQr: () => {
          clearTimeout(timeout);
          resolve(true);
        },
      })
        .then((sock) => {
          newSock = sock;
          sock.ev.on(
            "connection.update",
            (update: { connection?: string; lastDisconnect?: unknown }) => {
              if (update.connection === "close") {
                clearTimeout(timeout);
                reject((update.lastDisconnect as Error) ?? new Error("Connection closed"));
              }
            },
          );
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });

    socketReady = await readyPromise;
  } catch (err) {
    login.runtime?.log(danger(`[CodePairing] Failed to create new socket: ${formatError(err)}`));
    return null;
  }

  if (!newSock! || !socketReady) {
    return null;
  }

  // Request new pairing code
  try {
    const phoneDigits = login.phoneNumber.slice(1); // Remove '+' prefix
    const newCode = await newSock.requestPairingCode(phoneDigits);
    const formattedCode =
      newCode.length === 8 ? `${newCode.slice(0, 4)}-${newCode.slice(4)}` : newCode;

    login.runtime?.log(info(`[CodePairing] New pairing code: ${formattedCode}`));

    // Update login with new socket and code
    login.sock = newSock;
    login.pairingCode = formattedCode;
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
 * Set up the connection event handler that auto-retries on 428/close.
 */
function setupCodePairingRetryHandler(login: ActiveLogin) {
  login.sock.ev.on(
    "connection.update",
    async (update: { connection?: string; lastDisconnect?: unknown }) => {
      login.runtime?.log(info(`[CodePairing] connection.update: ${JSON.stringify(update)}`));

      if (update.connection === "close" && !login.connected) {
        const statusCode = getStatusCode(update.lastDisconnect);
        // 428 = Precondition Required (code expired/invalid)
        // Also retry on generic connection closed before success
        if (statusCode === 428 || !login.error) {
          login.runtime?.log(
            info(
              `[CodePairing] Connection closed (${statusCode}), auto-retrying with fresh code...`,
            ),
          );
          const newCode = await retryPairingCode(login);
          if (!newCode) {
            login.error = "Failed to get new pairing code after retry";
            login.errorStatus = statusCode;
          }
        }
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
    connected: false,
    waitPromise: Promise.resolve(),
    restartAttempted: false,
    verbose: Boolean(opts.verbose),
    encryptionKey: opts.encryptionKey,
    codeRetryCount: 0,
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

  let sock: WaSocket;
  let socketReadyPromise: Promise<boolean>;

  try {
    // Create socket with QR callback that signals socket readiness
    // We set up the ready promise BEFORE creating socket so we don't miss the event
    let resolveReady: (value: boolean) => void;
    let rejectReady: (err: Error) => void;
    socketReadyPromise = new Promise<boolean>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const readyTimeout = setTimeout(
      () => {
        rejectReady(new Error("Timeout waiting for WhatsApp connection"));
      },
      Math.max(opts.timeoutMs ?? 30_000, 10_000),
    );

    sock = await createWaSocket(false, Boolean(opts.verbose), {
      authDir: account.authDir,
      encryptionKey: opts.encryptionKey,
      onQr: () => {
        // QR received means socket is ready for pairing code
        clearTimeout(readyTimeout);
        resolveReady(true);
      },
    });

    // Also listen for connection state in case QR doesn't fire
    sock.ev.on("connection.update", (update: { connection?: string; lastDisconnect?: unknown }) => {
      if (update.connection === "close") {
        clearTimeout(readyTimeout);
        rejectReady(
          (update.lastDisconnect as Error) ?? new Error("Connection closed before ready"),
        );
      }
    });
  } catch (err) {
    return {
      message: `Failed to start WhatsApp connection: ${String(err)}`,
    };
  }

  // Wait for socket to be ready (QR event or timeout)
  try {
    await socketReadyPromise;
    runtime.log(info("WhatsApp socket ready, requesting pairing code..."));
  } catch (err) {
    closeSocket(sock);
    return {
      message: `WhatsApp connection failed: ${formatError(err)}`,
    };
  }

  // Now request pairing code - socket is ready
  let pairingCode: string;
  try {
    // Remove '+' prefix for Baileys - it expects just the digits
    const phoneDigits = phoneNumber.slice(1);
    pairingCode = await sock.requestPairingCode(phoneDigits);
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
    connected: false,
    waitPromise: Promise.resolve(),
    restartAttempted: false,
    verbose: Boolean(opts.verbose),
    encryptionKey: opts.encryptionKey,
    // Code pairing specific
    pairingCode: formattedCode,
    phoneNumber,
    codeRetryCount: 0,
    runtime,
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

/**
 * Get the current status of code-based pairing.
 * Use this to poll for updated pairing codes (auto-retry generates new codes).
 */
export function getCodePairingStatus(opts: { accountId?: string }): {
  active: boolean;
  pairingCode?: string;
  connected: boolean;
  error?: string;
  retryCount: number;
} {
  const cfg = loadConfig();
  const account = resolveWhatsAppAccount({ cfg, accountId: opts.accountId });
  const login = activeLogins.get(account.accountId);

  if (!login || !login.pairingCode) {
    return {
      active: false,
      connected: false,
      retryCount: 0,
    };
  }

  return {
    active: isLoginFresh(login),
    pairingCode: login.pairingCode,
    connected: login.connected,
    error: login.error,
    retryCount: login.codeRetryCount,
  };
}
