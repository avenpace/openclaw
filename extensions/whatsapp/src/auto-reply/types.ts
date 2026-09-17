// Whatsapp type declarations define plugin contracts.
import type {
  ChannelAccountSnapshot,
  ChannelRuntimeSurface,
} from "openclaw/plugin-sdk/channel-contract";
import type { WebInboundMessage } from "../inbound/types.js";
import type { ReconnectPolicy } from "../reconnect.js";
import type { WhatsAppSocketTimingOptions } from "../socket-timing.js";

export type WebChannelHealthState =
  | "starting"
  | "healthy"
  | "stale"
  | "reconnecting"
  | "conflict"
  | "logged-out"
  | "stopped";

/** @deprecated Use `WebInboundMessage`. */
export type WebInboundMsg = WebInboundMessage;

export type WebChannelStatus = {
  running: boolean;
  connected: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: number | null;
  lastDisconnect?: {
    at: number;
    status?: number;
    error?: string;
    loggedOut?: boolean;
  } | null;
  lastInboundAt?: number | null;
  lastMessageAt?: number | null;
  lastEventAt?: number | null;
  lastTransportActivityAt?: number | null;
  busy?: boolean;
  lastRunActivityAt?: number | null;
  lastError?: string | null;
  healthState?: WebChannelHealthState;
  lifecycle?: ChannelAccountSnapshot["lifecycle"];
  terminalDisconnect?: boolean;
  /** Phone number (E.164 format) when connected, from sock.user.id */
  selfE164?: string | null;
};

// Clawku: multi-tenant WhatsApp worker mode (per-account docker container isolation).
export type WhatsAppWorkerDockerOptions = {
  enabled?: boolean;
  image?: string;
  imageByAccount?: Record<string, string>;
  authMountPath?: string;
  workerEntry?: string;
  command?: string[];
  containerNamePrefix?: string;
  network?: string;
  extraArgs?: string[];
  env?: Record<string, string>;
};

export type WebMonitorTuning = {
  reconnect?: Partial<ReconnectPolicy>;
  socketTiming?: WhatsAppSocketTimingOptions;
  heartbeatSeconds?: number;
  transportTimeoutMs?: number;
  messageTimeoutMs?: number;
  watchdogCheckMs?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  statusSink?: (status: WebChannelStatus) => void;
  channelRuntime?: ChannelRuntimeSurface;
  /** WhatsApp account id. Default: "default". */
  accountId?: string;
  /** Debounce window (ms) for batching rapid consecutive messages from the same sender. */
  debounceMs?: number;
  /** Clawku: override WhatsApp worker mode (true forces worker, false forces direct). */
  useWorker?: boolean;
  /** Clawku: override WhatsApp worker settings for this monitor invocation. */
  worker?: {
    maxWorkers?: number;
    docker?: WhatsAppWorkerDockerOptions;
  };
  /** Clawku: override group policy for multi-tenant isolation. */
  groupPolicy?: "open" | "allowlist" | "disabled";
  /** Clawku: override group allowlist for multi-tenant isolation. */
  groupAllowFrom?: string[];
  /** Clawku: override per-group settings (e.g., requireMention) for multi-tenant isolation. */
  groups?: Record<string, { requireMention?: boolean }>;
  /**
   * Clawku: override the DM policy for multi-tenant isolation.
   *
   * Without this the monitor falls back to `account.dmPolicy` resolved from the
   * runtime config, and an absent value defaults to "pairing" — which replies to
   * unknown senders with a pairing code instead of ignoring them. Platform-managed
   * accounts set their policy through config overrides that do not reliably reach
   * `getRuntimeConfig()`, so the policy has to be passed in explicitly.
   */
  dmPolicy?: "open" | "allowlist" | "pairing" | "disabled";
  /** Clawku: override the DM allowlist that goes with `dmPolicy`. */
  allowFrom?: string[];
};
