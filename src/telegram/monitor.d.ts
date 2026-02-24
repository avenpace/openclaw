import { type RunOptions } from "@grammyjs/runner";
import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { getReplyFromConfig } from "../auto-reply/reply.js";
export type MonitorTelegramOpts = {
    token?: string;
    accountId?: string;
    config?: OpenClawConfig;
    runtime?: RuntimeEnv;
    abortSignal?: AbortSignal;
    useWebhook?: boolean;
    webhookPath?: string;
    webhookPort?: number;
    webhookSecret?: string;
    webhookHost?: string;
    proxyFetch?: typeof fetch;
    webhookUrl?: string;
    /** Custom reply resolver for platform integration (e.g., persona-specific agent logic) */
    replyResolver?: typeof getReplyFromConfig;
};
export declare function createTelegramRunnerOptions(cfg: OpenClawConfig): RunOptions<unknown>;
export declare function monitorTelegramProvider(opts?: MonitorTelegramOpts): Promise<void>;
//# sourceMappingURL=monitor.d.ts.map