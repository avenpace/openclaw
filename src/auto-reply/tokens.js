import { escapeRegExp } from "../utils.js";
export const HEARTBEAT_TOKEN = "HEARTBEAT_OK";
export const SILENT_REPLY_TOKEN = "NO_REPLY";
export function isSilentReplyText(text, token = SILENT_REPLY_TOKEN) {
    if (!text) {
        return false;
    }
    const escaped = escapeRegExp(token);
    const prefix = new RegExp(`^\\s*${escaped}(?=$|\\W)`);
    if (prefix.test(text)) {
        return true;
    }
    const suffix = new RegExp(`\\b${escaped}\\b\\W*$`);
    return suffix.test(text);
}
export function isSilentReplyPrefixText(text, token = SILENT_REPLY_TOKEN) {
    if (!text) {
        return false;
    }
    const normalized = text.trimStart().toUpperCase();
    if (!normalized) {
        return false;
    }
    if (!normalized.includes("_")) {
        return false;
    }
    if (/[^A-Z_]/.test(normalized)) {
        return false;
    }
    return token.toUpperCase().startsWith(normalized);
}
//# sourceMappingURL=tokens.js.map