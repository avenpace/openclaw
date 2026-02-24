import { resolvePinnedHostnameWithPolicy, } from "../infra/net/ssrf.js";
const NETWORK_NAVIGATION_PROTOCOLS = new Set(["http:", "https:"]);
const SAFE_NON_NETWORK_URLS = new Set(["about:blank"]);
function isAllowedNonNetworkNavigationUrl(parsed) {
    // Keep non-network navigation explicit; about:blank is the only allowed bootstrap URL.
    return SAFE_NON_NETWORK_URLS.has(parsed.href);
}
export class InvalidBrowserNavigationUrlError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidBrowserNavigationUrlError";
    }
}
export function withBrowserNavigationPolicy(ssrfPolicy) {
    return ssrfPolicy ? { ssrfPolicy } : {};
}
export async function assertBrowserNavigationAllowed(opts) {
    const rawUrl = String(opts.url ?? "").trim();
    if (!rawUrl) {
        throw new InvalidBrowserNavigationUrlError("url is required");
    }
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        throw new InvalidBrowserNavigationUrlError(`Invalid URL: ${rawUrl}`);
    }
    if (!NETWORK_NAVIGATION_PROTOCOLS.has(parsed.protocol)) {
        if (isAllowedNonNetworkNavigationUrl(parsed)) {
            return;
        }
        throw new InvalidBrowserNavigationUrlError(`Navigation blocked: unsupported protocol "${parsed.protocol}"`);
    }
    await resolvePinnedHostnameWithPolicy(parsed.hostname, {
        lookupFn: opts.lookupFn,
        policy: opts.ssrfPolicy,
    });
}
//# sourceMappingURL=navigation-guard.js.map