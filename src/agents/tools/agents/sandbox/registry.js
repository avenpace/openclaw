import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { acquireSessionWriteLock } from "../session-write-lock.js";
import { SANDBOX_BROWSER_REGISTRY_PATH, SANDBOX_REGISTRY_PATH, SANDBOX_STATE_DIR, } from "./constants.js";
function isRecord(value) {
    return Boolean(value) && typeof value === "object";
}
function isRegistryEntry(value) {
    return isRecord(value) && typeof value.containerName === "string";
}
function isRegistryFile(value) {
    if (!isRecord(value)) {
        return false;
    }
    const maybeEntries = value.entries;
    return Array.isArray(maybeEntries) && maybeEntries.every(isRegistryEntry);
}
async function withRegistryLock(registryPath, fn) {
    const lock = await acquireSessionWriteLock({ sessionFile: registryPath, allowReentrant: false });
    try {
        return await fn();
    }
    finally {
        await lock.release();
    }
}
async function readRegistryFromFile(registryPath, mode) {
    try {
        const raw = await fs.readFile(registryPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (isRegistryFile(parsed)) {
            return parsed;
        }
        if (mode === "fallback") {
            return { entries: [] };
        }
        throw new Error(`Invalid sandbox registry format: ${registryPath}`);
    }
    catch (error) {
        const code = error?.code;
        if (code === "ENOENT") {
            return { entries: [] };
        }
        if (mode === "fallback") {
            return { entries: [] };
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to read sandbox registry file: ${registryPath}`, { cause: error });
    }
}
async function writeRegistryFile(registryPath, registry) {
    await fs.mkdir(SANDBOX_STATE_DIR, { recursive: true });
    const payload = `${JSON.stringify(registry, null, 2)}\n`;
    const registryDir = path.dirname(registryPath);
    const tempPath = path.join(registryDir, `${path.basename(registryPath)}.${crypto.randomUUID()}.tmp`);
    await fs.writeFile(tempPath, payload, "utf-8");
    try {
        await fs.rename(tempPath, registryPath);
    }
    catch (error) {
        await fs.rm(tempPath, { force: true });
        throw error;
    }
}
export async function readRegistry() {
    return await readRegistryFromFile(SANDBOX_REGISTRY_PATH, "fallback");
}
function upsertEntry(entries, entry) {
    const existing = entries.find((item) => item.containerName === entry.containerName);
    const next = entries.filter((item) => item.containerName !== entry.containerName);
    next.push({
        ...entry,
        createdAtMs: existing?.createdAtMs ?? entry.createdAtMs,
        image: existing?.image ?? entry.image,
        configHash: entry.configHash ?? existing?.configHash,
    });
    return next;
}
function removeEntry(entries, containerName) {
    return entries.filter((entry) => entry.containerName !== containerName);
}
async function withRegistryMutation(registryPath, mutate) {
    await withRegistryLock(registryPath, async () => {
        const registry = await readRegistryFromFile(registryPath, "strict");
        const next = mutate(registry.entries);
        if (next === null) {
            return;
        }
        await writeRegistryFile(registryPath, { entries: next });
    });
}
export async function updateRegistry(entry) {
    await withRegistryMutation(SANDBOX_REGISTRY_PATH, (entries) => upsertEntry(entries, entry));
}
export async function removeRegistryEntry(containerName) {
    await withRegistryMutation(SANDBOX_REGISTRY_PATH, (entries) => {
        const next = removeEntry(entries, containerName);
        if (next.length === entries.length) {
            return null;
        }
        return next;
    });
}
export async function readBrowserRegistry() {
    return await readRegistryFromFile(SANDBOX_BROWSER_REGISTRY_PATH, "fallback");
}
export async function updateBrowserRegistry(entry) {
    await withRegistryMutation(SANDBOX_BROWSER_REGISTRY_PATH, (entries) => upsertEntry(entries, entry));
}
export async function removeBrowserRegistryEntry(containerName) {
    await withRegistryMutation(SANDBOX_BROWSER_REGISTRY_PATH, (entries) => {
        const next = removeEntry(entries, containerName);
        if (next.length === entries.length) {
            return null;
        }
        return next;
    });
}
//# sourceMappingURL=registry.js.map