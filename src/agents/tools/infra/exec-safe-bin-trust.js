import path from "node:path";
const DEFAULT_SAFE_BIN_TRUSTED_DIRS = [
    "/bin",
    "/usr/bin",
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/opt/local/bin",
    "/snap/bin",
    "/run/current-system/sw/bin",
];
let trustedSafeBinCache = null;
function normalizeTrustedDir(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return path.resolve(trimmed);
}
export function normalizeTrustedSafeBinDirs(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    const normalized = entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
    return Array.from(new Set(normalized));
}
function resolveTrustedSafeBinDirs(entries) {
    const resolved = entries
        .map((entry) => normalizeTrustedDir(entry))
        .filter((entry) => Boolean(entry));
    return Array.from(new Set(resolved)).toSorted();
}
function buildTrustedSafeBinCacheKey(entries) {
    return resolveTrustedSafeBinDirs(normalizeTrustedSafeBinDirs(entries)).join("\u0001");
}
export function buildTrustedSafeBinDirs(params = {}) {
    const baseDirs = params.baseDirs ?? DEFAULT_SAFE_BIN_TRUSTED_DIRS;
    const extraDirs = params.extraDirs ?? [];
    // Trust is explicit only. Do not derive from PATH, which is user/environment controlled.
    return new Set(resolveTrustedSafeBinDirs([
        ...normalizeTrustedSafeBinDirs(baseDirs),
        ...normalizeTrustedSafeBinDirs(extraDirs),
    ]));
}
export function getTrustedSafeBinDirs(params = {}) {
    const baseDirs = params.baseDirs ?? DEFAULT_SAFE_BIN_TRUSTED_DIRS;
    const extraDirs = params.extraDirs ?? [];
    const key = buildTrustedSafeBinCacheKey([...baseDirs, ...extraDirs]);
    if (!params.refresh && trustedSafeBinCache?.key === key) {
        return trustedSafeBinCache.dirs;
    }
    const dirs = buildTrustedSafeBinDirs({
        baseDirs,
        extraDirs,
    });
    trustedSafeBinCache = { key, dirs };
    return dirs;
}
export function isTrustedSafeBinPath(params) {
    const trustedDirs = params.trustedDirs ?? getTrustedSafeBinDirs();
    const resolvedDir = path.dirname(path.resolve(params.resolvedPath));
    return trustedDirs.has(resolvedDir);
}
//# sourceMappingURL=exec-safe-bin-trust.js.map