/**
 * Encrypted Multi-File Auth State for Baileys
 *
 * Provides transparent AES-256-GCM encryption for WhatsApp credentials.
 * Drop-in replacement for useMultiFileAuthState when encryption key is provided.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { proto } from "@whiskeysockets/baileys";
import { initAuthCreds } from "@whiskeysockets/baileys";

// Encryption constants
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_EXTENSION = ".enc";

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: IV (12 bytes) + AuthTag (16 bytes) + Encrypted Data
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData: Buffer, key: Buffer): Buffer {
  if (encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short");
  }
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * Read and decrypt a JSON file
 */
async function readEncryptedJson<T>(filePath: string, key: Buffer): Promise<T | null> {
  const encPath = filePath + ENCRYPTED_EXTENSION;

  // Try encrypted file first
  if (fsSync.existsSync(encPath)) {
    try {
      const encryptedData = await fs.readFile(encPath);
      const decrypted = decrypt(encryptedData, key);
      return JSON.parse(decrypted.toString("utf-8"), BufferJSON.reviver);
    } catch {
      return null;
    }
  }

  // Fall back to unencrypted (for migration)
  if (fsSync.existsSync(filePath)) {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data, BufferJSON.reviver);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Encrypt and write a JSON file
 */
async function writeEncryptedJson(filePath: string, data: unknown, key: Buffer): Promise<void> {
  const jsonData = JSON.stringify(data, BufferJSON.replacer);
  const encrypted = encrypt(Buffer.from(jsonData, "utf-8"), key);
  const encPath = filePath + ENCRYPTED_EXTENSION;

  await fs.writeFile(encPath, encrypted);

  // Set restrictive permissions
  try {
    await fs.chmod(encPath, 0o600);
  } catch {
    // best-effort
  }

  // Remove unencrypted version if it exists (migration cleanup)
  if (fsSync.existsSync(filePath)) {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore
    }
  }
}

/**
 * Remove an encrypted file
 */
async function removeEncryptedFile(filePath: string): Promise<void> {
  const encPath = filePath + ENCRYPTED_EXTENSION;
  try {
    await fs.unlink(encPath);
  } catch {
    // ignore
  }
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

// BufferJSON helper for Baileys serialization
const BufferJSON = {
  replacer: (_key: string, value: unknown) => {
    if (value && typeof value === "object" && (value as { type?: string }).type === "Buffer") {
      const bufData = value as { type: string; data: number[] };
      return { type: "Buffer", data: Buffer.from(bufData.data).toString("base64") };
    }
    if (Buffer.isBuffer(value)) {
      return { type: "Buffer", data: value.toString("base64") };
    }
    return value;
  },
  reviver: (_key: string, value: unknown) => {
    if (value && typeof value === "object" && (value as { type?: string }).type === "Buffer") {
      const bufData = value as { type: string; data: string };
      return Buffer.from(bufData.data, "base64");
    }
    return value;
  },
};

/**
 * Create an encrypted multi-file auth state
 * Drop-in replacement for useMultiFileAuthState with encryption support
 */
export async function useEncryptedMultiFileAuthState(
  authDir: string,
  encryptionKey: Buffer,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  // Ensure directory exists
  await fs.mkdir(authDir, { recursive: true });

  const credsPath = path.join(authDir, "creds.json");

  // Read or initialize credentials
  let creds = await readEncryptedJson<AuthenticationCreds>(credsPath, encryptionKey);
  if (!creds) {
    creds = initAuthCreds();
  }

  const saveCreds = async () => {
    await writeEncryptedJson(credsPath, creds, encryptionKey);
  };

  // Signal keys implementation (same pattern as Baileys' useMultiFileAuthState)
  const keys: AuthenticationState["keys"] = {
    get: async <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
      const data: { [id: string]: SignalDataTypeMap[T] } = {};
      await Promise.all(
        ids.map(async (id) => {
          const filePath = path.join(authDir, `${type}-${id}.json`);
          const value = await readEncryptedJson<SignalDataTypeMap[T]>(filePath, encryptionKey);
          if (type === "app-state-sync-key" && value) {
            data[id] = proto.Message.AppStateSyncKeyData.fromObject(
              value as unknown as proto.Message.IAppStateSyncKeyData,
            ) as unknown as SignalDataTypeMap[T];
          } else if (value !== null) {
            data[id] = value;
          }
        }),
      );
      return data;
    },
    set: async (
      data: Partial<{
        [T in keyof SignalDataTypeMap]: { [id: string]: SignalDataTypeMap[T] | null };
      }>,
    ): Promise<void> => {
      const tasks: Promise<void>[] = [];
      for (const category in data) {
        const categoryData = data[category as keyof SignalDataTypeMap];
        if (!categoryData) {
          continue;
        }
        for (const id in categoryData) {
          const value = categoryData[id];
          const filePath = path.join(authDir, `${category}-${id}.json`);
          if (value) {
            tasks.push(writeEncryptedJson(filePath, value, encryptionKey));
          } else {
            tasks.push(removeEncryptedFile(filePath));
          }
        }
      }
      await Promise.all(tasks);
    },
  };

  return {
    state: { creds, keys },
    saveCreds,
  };
}

/**
 * Migrate existing unencrypted auth files to encrypted format
 */
export async function migrateAuthToEncrypted(
  authDir: string,
  encryptionKey: Buffer,
): Promise<{
  migrated: number;
  skipped: number;
}> {
  let migrated = 0;
  let skipped = 0;

  if (!fsSync.existsSync(authDir)) {
    return { migrated, skipped };
  }

  const entries = await fs.readdir(authDir);

  for (const entry of entries) {
    // Skip already encrypted files
    if (entry.endsWith(ENCRYPTED_EXTENSION)) {
      skipped++;
      continue;
    }

    // Skip non-JSON files
    if (!entry.endsWith(".json")) {
      skipped++;
      continue;
    }

    const filePath = path.join(authDir, entry);
    const encPath = filePath + ENCRYPTED_EXTENSION;

    // Skip if encrypted version already exists
    if (fsSync.existsSync(encPath)) {
      skipped++;
      continue;
    }

    try {
      const data = await fs.readFile(filePath, "utf-8");
      JSON.parse(data); // Validate JSON
      const encrypted = encrypt(Buffer.from(data, "utf-8"), encryptionKey);
      await fs.writeFile(encPath, encrypted);
      await fs.chmod(encPath, 0o600);
      await fs.unlink(filePath);
      migrated++;
    } catch {
      skipped++;
    }
  }

  return { migrated, skipped };
}
