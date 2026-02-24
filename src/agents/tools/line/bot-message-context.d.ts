import type { MessageEvent, EventSource, PostbackEvent } from "@line/bot-sdk";
import type { OpenClawConfig } from "../config/config.js";
import type { ResolvedLineAccount } from "./types.js";
interface MediaRef {
    path: string;
    contentType?: string;
}
interface BuildLineMessageContextParams {
    event: MessageEvent;
    allMedia: MediaRef[];
    cfg: OpenClawConfig;
    account: ResolvedLineAccount;
}
export type LineSourceInfo = {
    userId?: string;
    groupId?: string;
    roomId?: string;
    isGroup: boolean;
};
export declare function getLineSourceInfo(source: EventSource): LineSourceInfo;
export declare function buildLineMessageContext(params: BuildLineMessageContextParams): Promise<{
    ctxPayload: {
        OriginatingChannel: "line";
        OriginatingTo: string;
        LocationLat: number;
        LocationLon: number;
        LocationAccuracy?: number;
        LocationName?: string;
        LocationAddress?: string;
        LocationSource: import("../channels/location.js").LocationSource;
        LocationIsLive: boolean;
        Body: string;
        BodyForAgent: string;
        RawBody: string;
        CommandBody: string;
        From: string;
        To: string;
        SessionKey: string;
        AccountId: string;
        ChatType: string;
        ConversationLabel: string;
        GroupSubject: string;
        SenderId: string;
        Provider: string;
        Surface: string;
        MessageSid: string;
        Timestamp: number;
        MediaPath: string;
        MediaType: string;
        MediaUrl: string;
        MediaPaths: string[];
        MediaUrls: string[];
        MediaTypes: string[];
    } & Omit<import("../auto-reply/templating.js").MsgContext, "CommandAuthorized"> & {
        CommandAuthorized: boolean;
    };
    event: MessageEvent;
    userId: string;
    groupId: string;
    roomId: string;
    isGroup: boolean;
    route: import("../routing/resolve-route.js").ResolvedAgentRoute;
    replyToken: string;
    accountId: string;
}>;
export declare function buildLinePostbackContext(params: {
    event: PostbackEvent;
    cfg: OpenClawConfig;
    account: ResolvedLineAccount;
}): Promise<{
    ctxPayload: {
        OriginatingChannel: "line";
        OriginatingTo: string;
        LocationLat: number;
        LocationLon: number;
        LocationAccuracy?: number;
        LocationName?: string;
        LocationAddress?: string;
        LocationSource: import("../channels/location.js").LocationSource;
        LocationIsLive: boolean;
        Body: string;
        BodyForAgent: string;
        RawBody: string;
        CommandBody: string;
        From: string;
        To: string;
        SessionKey: string;
        AccountId: string;
        ChatType: string;
        ConversationLabel: string;
        GroupSubject: string;
        SenderId: string;
        Provider: string;
        Surface: string;
        MessageSid: string;
        Timestamp: number;
        MediaPath: string;
        MediaType: string;
        MediaUrl: string;
        MediaPaths: string[];
        MediaUrls: string[];
        MediaTypes: string[];
    } & Omit<import("../auto-reply/templating.js").MsgContext, "CommandAuthorized"> & {
        CommandAuthorized: boolean;
    };
    event: PostbackEvent;
    userId: string;
    groupId: string;
    roomId: string;
    isGroup: boolean;
    route: import("../routing/resolve-route.js").ResolvedAgentRoute;
    replyToken: string;
    accountId: string;
}>;
export type LineMessageContext = NonNullable<Awaited<ReturnType<typeof buildLineMessageContext>>>;
export type LinePostbackContext = NonNullable<Awaited<ReturnType<typeof buildLinePostbackContext>>>;
export type LineInboundContext = LineMessageContext | LinePostbackContext;

