import crypto from "node:crypto";
export const NOVNC_PASSWORD_ENV_KEY = "OPENCLAW_BROWSER_NOVNC_PASSWORD";
const NOVNC_TOKEN_TTL_MS = 5 * 60 * 1000;
const NO_VNC_OBSERVER_TOKENS = new Map();
function pruneExpiredNoVncObserverTokens(now) {
    for (const [token, entry] of NO_VNC_OBSERVER_TOKENS) {
        if (entry.expiresAt <= now) {
            NO_VNC_OBSERVER_TOKENS.delete(token);
        }
    }
}
export function isNoVncEnabled(params) {
    return params.enableNoVnc && !params.headless;
}
export function generateNoVncPassword() {
    // VNC auth uses an 8-char password max.
    return crypto.randomBytes(4).toString("hex");
}
export function buildNoVncDirectUrl(port, password) {
    const query = new URLSearchParams({
        autoconnect: "1",
        resize: "remote",
    });
    if (password?.trim()) {
        query.set("password", password);
    }
    return `http://127.0.0.1:${port}/vnc.html?${query.toString()}`;
}
export function issueNoVncObserverToken(params) {
    const now = params.nowMs ?? Date.now();
    pruneExpiredNoVncObserverTokens(now);
    const token = crypto.randomBytes(24).toString("hex");
    NO_VNC_OBSERVER_TOKENS.set(token, {
        url: params.url,
        expiresAt: now + Math.max(1, params.ttlMs ?? NOVNC_TOKEN_TTL_MS),
    });
    return token;
}
export function consumeNoVncObserverToken(token, nowMs) {
    const now = nowMs ?? Date.now();
    pruneExpiredNoVncObserverTokens(now);
    const normalized = token.trim();
    if (!normalized) {
        return null;
    }
    const entry = NO_VNC_OBSERVER_TOKENS.get(normalized);
    if (!entry) {
        return null;
    }
    NO_VNC_OBSERVER_TOKENS.delete(normalized);
    if (entry.expiresAt <= now) {
        return null;
    }
    return entry.url;
}
export function buildNoVncObserverTokenUrl(baseUrl, token) {
    const query = new URLSearchParams({ token });
    return `${baseUrl}/sandbox/novnc?${query.toString()}`;
}
export function resetNoVncObserverTokensForTests() {
    NO_VNC_OBSERVER_TOKENS.clear();
}
//# sourceMappingURL=novnc-auth.js.map