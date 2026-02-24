import type { monitorWebInbox } from "../inbound.js";
import type { ReconnectPolicy } from "../reconnect.js";
export type WebInboundMsg = Parameters<typeof monitorWebInbox>[0]["onMessage"] extends (msg: infer M) => unknown ? M : never;
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
    lastMessageAt?: number | null;
    lastEventAt?: number | null;
    lastError?: string | null;
};
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
    heartbeatSeconds?: number;
    messageTimeoutMs?: number;
    watchdogCheckMs?: number;
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
    statusSink?: (status: WebChannelStatus) => void;
    /** WhatsApp account id. Default: "default". */
    accountId?: string;
    /** Debounce window (ms) for batching rapid consecutive messages from the same sender. */
    debounceMs?: number;
    /** Override WhatsApp worker mode (true forces worker, false forces direct). */
    useWorker?: boolean;
    /** Override WhatsApp worker settings for this monitor invocation. */
    worker?: {
        maxWorkers?: number;
        docker?: WhatsAppWorkerDockerOptions;
    };
};
//# sourceMappingURL=types.d.ts.map