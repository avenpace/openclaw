export function mergeAllowFromSources(params) {
    const storeEntries = params.dmPolicy === "allowlist" ? [] : (params.storeAllowFrom ?? []);
    return [...(params.allowFrom ?? []), ...storeEntries]
        .map((value) => String(value).trim())
        .filter(Boolean);
}
export function firstDefined(...values) {
    for (const value of values) {
        if (typeof value !== "undefined") {
            return value;
        }
    }
    return undefined;
}
export function isSenderIdAllowed(allow, senderId, allowWhenEmpty) {
    if (!allow.hasEntries) {
        return allowWhenEmpty;
    }
    if (allow.hasWildcard) {
        return true;
    }
    if (!senderId) {
        return false;
    }
    return allow.entries.includes(senderId);
}
//# sourceMappingURL=allow-from.js.map