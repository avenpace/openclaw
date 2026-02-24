import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
export declare function startTelegramWebhook(opts: {
    token: string;
    accountId?: string;
    config?: OpenClawConfig;
    path?: string;
    port?: number;
    host?: string;
    secret?: string;
    runtime?: RuntimeEnv;
    fetch?: typeof fetch;
    abortSignal?: AbortSignal;
    healthPath?: string;
    publicUrl?: string;
}): Promise<{
    server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    bot: import("grammy").Bot<import("grammy").Context, import("grammy").Api<import("grammy").RawApi>>;
    stop: () => void;
}>;
//# sourceMappingURL=webhook.d.ts.map