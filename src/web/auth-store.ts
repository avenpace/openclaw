import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { formatCliCommand } from "../cli/command-format.js";
import { resolveOAuthDir } from "../config/paths.js";
import { info, success } from "../globals.js";
import { getChildLogger } from "../logging.js";
import { DEFAULT_ACCOUNT_ID } from "../routing/session-key.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import type { WebChannel } from "../utils.js";
import { jidToE164, resolveUserPath } from "../utils.js";

export function resolveDefaultWebAuthDir(): string {
  return path.join(resolveOAuthDir(), "whatsapp", DEFAULT_ACCOUNT_ID);
}

export const WA_WEB_AUTH_DIR = resolveDefaultWebAuthDir();

export function resolveWebCredsPath(authDir: string): string {
  return path.join(authDir, "creds.json");
}

export function resolveWebCredsEncPath(authDir: string): string {
  return path.join(authDir, "creds.json.enc");
}

export function resolveWebCredsBackupPath(authDir: string): string {
  return path.join(authDir, "creds.json.bak");
}

/**
 * Check if WhatsApp credentials exist (plain or encrypted)
 */
export function hasWebCredsSync(authDir: string): boolean {
  // Check for encrypted credentials first (preferred)
  try {
    const encStats = fsSync.statSync(resolveWebCredsEncPath(authDir));
    if (encStats.isFile() && encStats.size > 1) {
      return true;
    }
  } catch {
    // no encrypted creds, check plain
  }
  // Fall back to plain credentials
  try {
    const stats = fsSync.statSync(resolveWebCredsPath(authDir));
    return stats.isFile() && stats.size > 1;
  } catch {
    return false;
  }
}

export function readCredsJsonRaw(filePath: string): string | null {
  try {
    if (!fsSync.existsSync(filePath)) {
      return null;
    }
    const stats = fsSync.statSync(filePath);
    if (!stats.isFile() || stats.size <= 1) {
      return null;
    }
    return fsSync.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function maybeRestoreCredsFromBackup(authDir: string): void {
  const logger = getChildLogger({ module: "web-session" });
  try {
    const credsPath = resolveWebCredsPath(authDir);
    const backupPath = resolveWebCredsBackupPath(authDir);
    const raw = readCredsJsonRaw(credsPath);
    if (raw) {
      // Validate that creds.json is parseable.
      JSON.parse(raw);
      return;
    }

    const backupRaw = readCredsJsonRaw(backupPath);
    if (!backupRaw) {
      return;
    }

    // Ensure backup is parseable before restoring.
    JSON.parse(backupRaw);
    fsSync.copyFileSync(backupPath, credsPath);
    try {
      fsSync.chmodSync(credsPath, 0o600);
    } catch {
      // best-effort on platforms that support it
    }
    logger.warn({ credsPath }, "restored corrupted WhatsApp creds.json from backup");
  } catch {
    // ignore
  }
}

export async function webAuthExists(authDir: string = resolveDefaultWebAuthDir()) {
  const resolvedAuthDir = resolveUserPath(authDir);
  maybeRestoreCredsFromBackup(resolvedAuthDir);
  const credsPath = resolveWebCredsPath(resolvedAuthDir);
  const encCredsPath = resolveWebCredsEncPath(resolvedAuthDir);
  try {
    await fs.access(resolvedAuthDir);
  } catch {
    return false;
  }
  // Check for encrypted credentials first (preferred)
  try {
    const encStats = await fs.stat(encCredsPath);
    if (encStats.isFile() && encStats.size > 1) {
      // Encrypted creds exist - we can't validate content without key, but file exists
      return true;
    }
  } catch {
    // no encrypted creds, check plain
  }
  // Fall back to plain credentials
  try {
    const stats = await fs.stat(credsPath);
    if (!stats.isFile() || stats.size <= 1) {
      return false;
    }
    const raw = await fs.readFile(credsPath, "utf-8");
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

async function clearLegacyBaileysAuthState(authDir: string) {
  const entries = await fs.readdir(authDir, { withFileTypes: true });
  const shouldDelete = (name: string) => {
    if (name === "oauth.json") {
      return false;
    }
    // Include encrypted variants
    if (name === "creds.json" || name === "creds.json.bak" || name === "creds.json.enc") {
      return true;
    }
    // Delete both .json and .json.enc files
    if (!name.endsWith(".json") && !name.endsWith(".json.enc")) {
      return false;
    }
    const baseName = name.replace(/\.enc$/, "");
    return /^(app-state-sync|session|sender-key|pre-key)-/.test(baseName);
  };
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) {
        return;
      }
      if (!shouldDelete(entry.name)) {
        return;
      }
      await fs.rm(path.join(authDir, entry.name), { force: true });
    }),
  );
}

export async function logoutWeb(params: {
  authDir?: string;
  isLegacyAuthDir?: boolean;
  runtime?: RuntimeEnv;
}) {
  const runtime = params.runtime ?? defaultRuntime;
  const resolvedAuthDir = resolveUserPath(params.authDir ?? resolveDefaultWebAuthDir());
  const exists = await webAuthExists(resolvedAuthDir);
  if (!exists) {
    runtime.log(info("No WhatsApp Web session found; nothing to delete."));
    return false;
  }
  if (params.isLegacyAuthDir) {
    await clearLegacyBaileysAuthState(resolvedAuthDir);
  } else {
    await fs.rm(resolvedAuthDir, { recursive: true, force: true });
  }
  runtime.log(success("Cleared WhatsApp Web credentials."));
  return true;
}

export function readWebSelfId(authDir: string = resolveDefaultWebAuthDir()) {
  // Read the cached WhatsApp Web identity (jid + E.164) from disk if present.
  // Note: For encrypted credentials, we can't read the identity without the key.
  const resolvedAuthDir = resolveUserPath(authDir);
  try {
    const credsPath = resolveWebCredsPath(resolvedAuthDir);
    if (!fsSync.existsSync(credsPath)) {
      // Check if encrypted creds exist - we have a session but can't read identity
      const encCredsPath = resolveWebCredsEncPath(resolvedAuthDir);
      if (fsSync.existsSync(encCredsPath)) {
        return { e164: null, jid: null, encrypted: true } as const;
      }
      return { e164: null, jid: null } as const;
    }
    const raw = fsSync.readFileSync(credsPath, "utf-8");
    const parsed = JSON.parse(raw) as { me?: { id?: string } } | undefined;
    const jid = parsed?.me?.id ?? null;
    const e164 = jid ? jidToE164(jid, { authDir: resolvedAuthDir }) : null;
    return { e164, jid } as const;
  } catch {
    return { e164: null, jid: null } as const;
  }
}

/**
 * Return the age (in milliseconds) of the cached WhatsApp web auth state, or null when missing.
 * Helpful for heartbeats/observability to spot stale credentials.
 * Checks encrypted credentials first, then falls back to plain.
 */
export function getWebAuthAgeMs(authDir: string = resolveDefaultWebAuthDir()): number | null {
  const resolvedAuthDir = resolveUserPath(authDir);
  // Check encrypted first
  try {
    const encStats = fsSync.statSync(resolveWebCredsEncPath(resolvedAuthDir));
    return Date.now() - encStats.mtimeMs;
  } catch {
    // no encrypted creds
  }
  // Fall back to plain
  try {
    const stats = fsSync.statSync(resolveWebCredsPath(resolvedAuthDir));
    return Date.now() - stats.mtimeMs;
  } catch {
    return null;
  }
}

export function logWebSelfId(
  authDir: string = resolveDefaultWebAuthDir(),
  runtime: RuntimeEnv = defaultRuntime,
  includeChannelPrefix = false,
) {
  // Human-friendly log of the currently linked personal web session.
  const { e164, jid } = readWebSelfId(authDir);
  const details = e164 || jid ? `${e164 ?? "unknown"}${jid ? ` (jid ${jid})` : ""}` : "unknown";
  const prefix = includeChannelPrefix ? "Web Channel: " : "";
  runtime.log(info(`${prefix}${details}`));
}

export async function pickWebChannel(
  pref: WebChannel | "auto",
  authDir: string = resolveDefaultWebAuthDir(),
): Promise<WebChannel> {
  const choice: WebChannel = pref === "auto" ? "web" : pref;
  const hasWeb = await webAuthExists(authDir);
  if (!hasWeb) {
    throw new Error(
      `No WhatsApp Web session found. Run \`${formatCliCommand("openclaw channels login --channel whatsapp --verbose")}\` to link.`,
    );
  }
  return choice;
}
