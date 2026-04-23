import type {
  ChannelAccountSnapshot,
  ChannelRuntimeSurface,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-runtime";
import type { getReplyFromConfig } from "openclaw/plugin-sdk/reply-runtime";
import type { RuntimeEnv } from "openclaw/plugin-sdk/runtime-env";

export type MonitorTelegramOpts = {
  token?: string;
  accountId?: string;
  config?: OpenClawConfig;
  runtime?: RuntimeEnv;
  channelRuntime?: ChannelRuntimeSurface;
  abortSignal?: AbortSignal;
  useWebhook?: boolean;
  webhookPath?: string;
  webhookPort?: number;
  webhookSecret?: string;
  webhookHost?: string;
  proxyFetch?: typeof fetch;
  webhookUrl?: string;
  webhookCertPath?: string;
  setStatus?: (patch: Omit<ChannelAccountSnapshot, "accountId">) => void;
  /** Custom reply resolver for platform integration (e.g., persona-specific agent logic) */
  replyResolver?: typeof getReplyFromConfig;
};

export type TelegramMonitorFn = (opts?: MonitorTelegramOpts) => Promise<void>;
