import type { Bot } from "grammy";
import type { getReplyFromConfig } from "../auto-reply/reply.js";
import type { OpenClawConfig, ReplyToMode, TelegramAccountConfig } from "../config/types.js";
import type { RuntimeEnv } from "../runtime.js";
import type { TelegramMessageContext } from "./bot-message-context.js";
import type { TelegramBotOptions } from "./bot.js";
import type { TelegramStreamMode } from "./bot/types.js";
type DispatchTelegramMessageParams = {
    context: TelegramMessageContext;
    bot: Bot;
    cfg: OpenClawConfig;
    runtime: RuntimeEnv;
    replyToMode: ReplyToMode;
    streamMode: TelegramStreamMode;
    textLimit: number;
    telegramCfg: TelegramAccountConfig;
    opts: Pick<TelegramBotOptions, "token">;
    /** Custom reply resolver for platform integration (e.g., persona-specific agent logic) */
    replyResolver?: typeof getReplyFromConfig;
};
export declare const dispatchTelegramMessage: ({ context, bot, cfg, runtime, replyToMode, streamMode, textLimit, telegramCfg, opts, replyResolver, }: DispatchTelegramMessageParams) => Promise<void>;

//# sourceMappingURL=bot-message-dispatch.d.ts.map