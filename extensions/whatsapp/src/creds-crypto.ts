/**
 * Clawku: WhatsApp credentials encrypted at rest.
 *
 * Every file in a WhatsApp auth folder (creds.json, its backup, and Baileys' signal keys) is
 * written as `CLAWKU-WA1:` + base64(iv | tag | AES-256-GCM ciphertext) when the platform has
 * registered a key for that folder. Reading accepts both forms, so a session saved before this
 * existed keeps working and is encrypted the next time each file is written — nobody re-pairs.
 *
 * The platform registers keys per auth folder (current key first, then the key being retired
 * during a storage-key rotation) in a process-wide registry, because channel monitors run in
 * their own module instance. A folder with no registered key is read and written as before.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import path from "node:path";

export const SEALED_PREFIX = "CLAWKU-WA1:";
const REGISTRY = Symbol.for("clawku.whatsapp.authKeys");

type Registry = Map<string, Buffer[]>;

function registry(): Registry {
  const g = globalThis as unknown as Record<symbol, Registry | undefined>;
  if (!g[REGISTRY]) g[REGISTRY] = new Map();
  return g[REGISTRY]!;
}

function key(dir: string): string {
  return path.resolve(dir);
}

/** The platform's keys for one auth folder, current first. Each must be 32 bytes. */
export function registerWhatsAppAuthKeys(authDir: string, keys: Buffer[]): void {
  const good = keys.filter((k) => Buffer.isBuffer(k) && k.length === 32);
  if (good.length) registry().set(key(authDir), good);
}

export function whatsAppAuthKeys(authDir: string): Buffer[] {
  return registry().get(key(authDir)) ?? [];
}

export function isSealed(raw: string): boolean {
  return raw.startsWith(SEALED_PREFIX);
}

/** Encrypt with the folder's current key; plain when the folder has none. */
export function sealForDir(authDir: string, text: string): string {
  const [current] = whatsAppAuthKeys(authDir);
  if (!current) return text;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", current, iv);
  const ct = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);
  return SEALED_PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

/** Plain text of a file's content; throws if it is sealed and no registered key opens it. */
export function openForDir(authDir: string, raw: string): string {
  if (!isSealed(raw)) return raw;
  const blob = Buffer.from(raw.slice(SEALED_PREFIX.length), "base64");
  if (blob.length < 29) throw new Error("WhatsApp credential file is damaged");
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  for (const k of whatsAppAuthKeys(authDir)) {
    try {
      const d = createDecipheriv("aes-256-gcm", k, iv);
      d.setAuthTag(tag);
      return Buffer.concat([d.update(ct), d.final()]).toString("utf-8");
    } catch {
      // try the next key
    }
  }
  throw new Error(`No registered key opens the WhatsApp credentials in ${authDir}`);
}
