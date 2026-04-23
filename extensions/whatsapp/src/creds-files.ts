import fsSync from "node:fs";
import path from "node:path";

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
