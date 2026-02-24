import type { WebInboundMessage, WebListenerCloseReason } from "./types.js";
type WorkerStatus = {
    accountId: string;
    pid?: number;
    startedAtMs: number;
    backend?: "child" | "docker";
    containerName?: string;
};
export declare function getWhatsAppWorkerStatus(): {
    active: number;
    workers: WorkerStatus[];
};
export declare function monitorWebInboxWorker(options: {
    verbose: boolean;
    accountId: string;
    authDir: string;
    onMessage: (msg: WebInboundMessage) => Promise<void>;
    mediaMaxMb?: number;
    sendReadReceipts?: boolean;
    debounceMs?: number;
    shouldDebounce?: (msg: WebInboundMessage) => boolean;
    maxWorkers?: number;
    docker?: {
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
}): Promise<{
    readonly close: () => Promise<void>;
    readonly onClose: Promise<WebListenerCloseReason>;
    readonly signalClose: (reason?: WebListenerCloseReason) => void;
    readonly sendMessage: (to: string, text: string, mediaBuffer?: Buffer, mediaType?: string, options?: {
        accountId?: string;
        fileName?: string;
        gifPlayback?: boolean;
    }) => Promise<{
        messageId: string;
    }>;
    readonly sendPoll: (to: string, poll: {
        question: string;
        options: string[];
        maxSelections?: number;
    }) => Promise<{
        messageId: string;
    }>;
    readonly sendReaction: (chatJid: string, messageId: string, emoji: string, fromMe: boolean, participant?: string) => Promise<void>;
    readonly sendComposingTo: (to: string) => Promise<void>;
}>;

