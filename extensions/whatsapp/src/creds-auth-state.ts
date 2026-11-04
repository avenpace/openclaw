/**
 * Clawku: Baileys' multi-file auth state (baileys 7 `useMultiFileAuthState`) with every file
 * sealed at rest by creds-crypto when the platform registered a key for the folder.
 *
 * Same files, same names, same locking as upstream, so state migrations, backups and the
 * folder layout are unchanged. One difference matters: a sealed file that no registered key
 * opens is an ERROR, never "no data". Upstream returns null for an unreadable file, and for
 * creds.json that means fresh creds — a new, unlinked login written over the real session.
 */
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from "baileys";
import { BufferJSON, initAuthCreds, proto } from "baileys";
import { isSealed, openForDir, sealForDir } from "./creds-crypto.js";

const fileLocks = new Map<string, Promise<void>>();

/** Run `fn` with this file locked, one writer or reader at a time (upstream uses a mutex per path). */
async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const previous = fileLocks.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((r) => (release = r));
  const tail = previous.then(() => current);
  fileLocks.set(filePath, tail);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (fileLocks.get(filePath) === tail) fileLocks.delete(filePath);
  }
}

const fixFileName = (file: string) => file.replace(/\//g, "__").replace(/:/g, "-");

export async function useClawkuMultiFileAuthState(
  folder: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const writeData = async (data: unknown, file: string) => {
    const filePath = join(folder, fixFileName(file));
    await withFileLock(filePath, () =>
      writeFile(filePath, sealForDir(folder, JSON.stringify(data, BufferJSON.replacer)), {
        mode: 0o600,
      }),
    );
  };
  const readData = async (file: string): Promise<any> => {
    const filePath = join(folder, fixFileName(file));
    return withFileLock(filePath, async () => {
      let raw: string;
      try {
        raw = await readFile(filePath, { encoding: "utf-8" });
      } catch {
        return null; // missing: genuinely no data
      }
      if (isSealed(raw)) return JSON.parse(openForDir(folder, raw), BufferJSON.reviver); // throws without a key
      try {
        return JSON.parse(raw, BufferJSON.reviver);
      } catch {
        return null; // upstream behaviour for a damaged plain file
      }
    });
  };
  const removeData = async (file: string) => {
    const filePath = join(folder, fixFileName(file));
    await withFileLock(filePath, async () => {
      try {
        await unlink(filePath);
      } catch {
        // already gone
      }
    });
  };

  const folderInfo = await stat(folder).catch(() => undefined);
  if (folderInfo) {
    if (!folderInfo.isDirectory()) {
      throw new Error(
        `found something that is not a directory at ${folder}, either delete it or specify a different location`,
      );
    }
  } else {
    await mkdir(folder, { recursive: true });
  }

  const creds: AuthenticationCreds = (await readData("creds.json")) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === "app-state-sync-key" && value)
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category as keyof typeof data]) {
              const value = data[category as keyof typeof data]![id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => writeData(creds, "creds.json"),
  };
}
