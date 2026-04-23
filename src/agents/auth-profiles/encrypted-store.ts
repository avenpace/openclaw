/**
 * Encrypted Auth Profile Store
 *
 * Provides AES-256-GCM encryption for auth-profiles.json
 * to protect OAuth tokens and API keys at rest.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";

// Encryption constants (same as encrypted-auth-state.ts)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_EXTENSION = ".enc";

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptAuthProfiles(data: Buffer, key: Buffer): Buffer {
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
export function decryptAuthProfiles(encryptedData: Buffer, key: Buffer): Buffer {
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
 * Get the encrypted file path
 */
export function getEncryptedPath(plainPath: string): string {
  return plainPath + ENCRYPTED_EXTENSION;
}

/**
 * Read and decrypt auth-profiles.json
 * Falls back to plain file for migration
 */
export async function readEncryptedAuthProfiles<T>(
  filePath: string,
  key: Buffer,
): Promise<T | null> {
  const encPath = getEncryptedPath(filePath);

  // Try encrypted file first
  if (fsSync.existsSync(encPath)) {
    try {
      const encryptedData = await fs.readFile(encPath);
      const decrypted = decryptAuthProfiles(encryptedData, key);
      return JSON.parse(decrypted.toString("utf-8"));
    } catch (err) {
      console.error(`[EncryptedAuthProfiles] Failed to read/decrypt ${encPath}:`, err);
      return null;
    }
  }

  // Fall back to unencrypted (for migration)
  if (fsSync.existsSync(filePath)) {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error(`[EncryptedAuthProfiles] Failed to read plain ${filePath}:`, err);
      return null;
    }
  }

  return null;
}

/**
 * Synchronous version for compatibility with existing loadJsonFile pattern
 */
export function readEncryptedAuthProfilesSync<T>(filePath: string, key: Buffer): T | null {
  const encPath = getEncryptedPath(filePath);

  // Try encrypted file first
  if (fsSync.existsSync(encPath)) {
    try {
      const encryptedData = fsSync.readFileSync(encPath);
      const decrypted = decryptAuthProfiles(encryptedData, key);
      return JSON.parse(decrypted.toString("utf-8"));
    } catch (err) {
      console.error(`[EncryptedAuthProfiles] Failed to read/decrypt ${encPath}:`, err);
      return null;
    }
  }

  // Fall back to unencrypted (for migration)
  if (fsSync.existsSync(filePath)) {
    try {
      const data = fsSync.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error(`[EncryptedAuthProfiles] Failed to read plain ${filePath}:`, err);
      return null;
    }
  }

  return null;
}

/**
 * Encrypt and write auth-profiles.json
 */
export async function writeEncryptedAuthProfiles(
  filePath: string,
  data: unknown,
  key: Buffer,
): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2);
  const encrypted = encryptAuthProfiles(Buffer.from(jsonData, "utf-8"), key);
  const encPath = getEncryptedPath(filePath);

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
      console.log(`[EncryptedAuthProfiles] Migrated ${filePath} to encrypted storage`);
    } catch {
      // best-effort cleanup
    }
  }
}

/**
 * Synchronous version for compatibility
 */
export function writeEncryptedAuthProfilesSync(filePath: string, data: unknown, key: Buffer): void {
  const jsonData = JSON.stringify(data, null, 2);
  const encrypted = encryptAuthProfiles(Buffer.from(jsonData, "utf-8"), key);
  const encPath = getEncryptedPath(filePath);

  fsSync.writeFileSync(encPath, encrypted);

  // Set restrictive permissions
  try {
    fsSync.chmodSync(encPath, 0o600);
  } catch {
    // best-effort
  }

  // Remove unencrypted version if it exists (migration cleanup)
  if (fsSync.existsSync(filePath)) {
    try {
      fsSync.unlinkSync(filePath);
      console.log(`[EncryptedAuthProfiles] Migrated ${filePath} to encrypted storage`);
    } catch {
      // best-effort cleanup
    }
  }
}

/**
 * Check if encrypted auth-profiles exists
 */
export function encryptedAuthProfilesExists(filePath: string): boolean {
  return fsSync.existsSync(getEncryptedPath(filePath));
}
