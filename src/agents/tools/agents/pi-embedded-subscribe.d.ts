import type { SubscribeEmbeddedPiSessionParams } from "./pi-embedded-subscribe.types.js";
export type { BlockReplyChunking, SubscribeEmbeddedPiSessionParams, ToolResultFormat, } from "./pi-embedded-subscribe.types.js";
export declare function subscribeEmbeddedPiSession(params: SubscribeEmbeddedPiSessionParams): {
    assistantTexts: string[];
    toolMetas: {
        toolName?: string;
        meta?: string;
    }[];
    unsubscribe: () => void;
    isCompacting: () => boolean;
    isCompactionInFlight: () => boolean;
    getMessagingToolSentTexts: () => string[];
    getMessagingToolSentMediaUrls: () => string[];
    getMessagingToolSentTargets: () => import("./pi-embedded-messaging.js").MessagingToolSend[];
    getSuccessfulCronAdds: () => number;
    didSendViaMessagingTool: () => boolean;
    getLastToolError: () => {
        toolName: string;
        meta?: string;
        error?: string;
        mutatingAction?: boolean;
        actionFingerprint?: string;
    };
    getUsageTotals: () => {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
        total: number;
    };
    getCompactionCount: () => number;
    waitForCompactionRetry: () => Promise<void>;
};
