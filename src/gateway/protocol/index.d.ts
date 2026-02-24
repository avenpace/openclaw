import { type ErrorObject } from "ajv";
import type { SessionsPatchResult } from "../session-utils.types.js";
import { type AgentEvent, AgentEventSchema, type AgentIdentityParams, AgentIdentityParamsSchema, type AgentIdentityResult, AgentIdentityResultSchema, AgentParamsSchema, type AgentSummary, AgentSummarySchema, type AgentsFileEntry, AgentsFileEntrySchema, type AgentsCreateParams, AgentsCreateParamsSchema, type AgentsCreateResult, AgentsCreateResultSchema, type AgentsUpdateParams, AgentsUpdateParamsSchema, type AgentsUpdateResult, AgentsUpdateResultSchema, type AgentsDeleteParams, AgentsDeleteParamsSchema, type AgentsDeleteResult, AgentsDeleteResultSchema, type AgentsFilesGetParams, AgentsFilesGetParamsSchema, type AgentsFilesGetResult, AgentsFilesGetResultSchema, type AgentsFilesListParams, AgentsFilesListParamsSchema, type AgentsFilesListResult, AgentsFilesListResultSchema, type AgentsFilesSetParams, AgentsFilesSetParamsSchema, type AgentsFilesSetResult, AgentsFilesSetResultSchema, type AgentsListParams, AgentsListParamsSchema, type AgentsListResult, AgentsListResultSchema, type AgentWaitParams, type ChannelsLogoutParams, ChannelsLogoutParamsSchema, type TalkConfigParams, TalkConfigParamsSchema, type TalkConfigResult, TalkConfigResultSchema, type ChannelsStatusParams, ChannelsStatusParamsSchema, type ChannelsStatusResult, ChannelsStatusResultSchema, type ChatEvent, ChatEventSchema, ChatHistoryParamsSchema, type ChatInjectParams, ChatInjectParamsSchema, ChatSendParamsSchema, type ConfigApplyParams, ConfigApplyParamsSchema, type ConfigGetParams, ConfigGetParamsSchema, type ConfigPatchParams, ConfigPatchParamsSchema, type ConfigSchemaParams, ConfigSchemaParamsSchema, type ConfigSchemaResponse, ConfigSchemaResponseSchema, type ConfigSetParams, ConfigSetParamsSchema, type ConnectParams, ConnectParamsSchema, type CronAddParams, CronAddParamsSchema, type CronJob, CronJobSchema, type CronListParams, CronListParamsSchema, type CronRemoveParams, CronRemoveParamsSchema, type CronRunLogEntry, type CronRunParams, CronRunParamsSchema, type CronRunsParams, CronRunsParamsSchema, type CronStatusParams, CronStatusParamsSchema, type CronUpdateParams, CronUpdateParamsSchema, type DevicePairApproveParams, type DevicePairListParams, type DevicePairRejectParams, type ExecApprovalsGetParams, type ExecApprovalsSetParams, type ExecApprovalsSnapshot, ErrorCodes, type ErrorShape, ErrorShapeSchema, type EventFrame, EventFrameSchema, errorShape, type GatewayFrame, GatewayFrameSchema, type HelloOk, HelloOkSchema, type LogsTailParams, LogsTailParamsSchema, type LogsTailResult, LogsTailResultSchema, ModelsListParamsSchema, type NodeEventParams, type NodeInvokeParams, NodeInvokeParamsSchema, type NodeInvokeResultParams, type NodeListParams, NodeListParamsSchema, type NodePairApproveParams, NodePairApproveParamsSchema, type NodePairListParams, NodePairListParamsSchema, type NodePairRejectParams, NodePairRejectParamsSchema, type NodePairRequestParams, NodePairRequestParamsSchema, type NodePairVerifyParams, NodePairVerifyParamsSchema, type PollParams, PollParamsSchema, PROTOCOL_VERSION, PushTestParamsSchema, PushTestResultSchema, type PresenceEntry, PresenceEntrySchema, ProtocolSchemas, type RequestFrame, RequestFrameSchema, type ResponseFrame, ResponseFrameSchema, SendParamsSchema, type SessionsCompactParams, SessionsCompactParamsSchema, type SessionsDeleteParams, SessionsDeleteParamsSchema, type SessionsListParams, SessionsListParamsSchema, type SessionsPatchParams, SessionsPatchParamsSchema, type SessionsPreviewParams, SessionsPreviewParamsSchema, type SessionsResetParams, SessionsResetParamsSchema, type SessionsResolveParams, type SessionsUsageParams, SessionsUsageParamsSchema, type ShutdownEvent, ShutdownEventSchema, type SkillsBinsParams, type SkillsBinsResult, type SkillsInstallParams, SkillsInstallParamsSchema, type SkillsStatusParams, SkillsStatusParamsSchema, type SkillsUpdateParams, SkillsUpdateParamsSchema, type Snapshot, SnapshotSchema, type StateVersion, StateVersionSchema, type TalkModeParams, type TickEvent, TickEventSchema, type UpdateRunParams, UpdateRunParamsSchema, type WakeParams, WakeParamsSchema, type WebLoginStartParams, WebLoginStartParamsSchema, type WebLoginWaitParams, WebLoginWaitParamsSchema, type WizardCancelParams, WizardCancelParamsSchema, type WizardNextParams, WizardNextParamsSchema, type WizardNextResult, WizardNextResultSchema, type WizardStartParams, WizardStartParamsSchema, type WizardStartResult, WizardStartResultSchema, type WizardStatusParams, WizardStatusParamsSchema, type WizardStatusResult, WizardStatusResultSchema, type WizardStep, WizardStepSchema } from "./schema.js";
export declare const validateConnectParams: import("ajv").ValidateFunction<{
    scopes?: string[] | undefined;
    device?: {
        nonce: string;
        id: string;
        publicKey: string;
        signature: string;
        signedAt: number;
    } | undefined;
    permissions?: {
        [x: string]: boolean;
    } | undefined;
    commands?: string[] | undefined;
    auth?: {
        password?: string | undefined;
        deviceToken?: string | undefined;
        token?: string | undefined;
    } | undefined;
    role?: string | undefined;
    caps?: string[] | undefined;
    pathEnv?: string | undefined;
    locale?: string | undefined;
    userAgent?: string | undefined;
    minProtocol: number;
    maxProtocol: number;
    client: {
        displayName?: string | undefined;
        deviceFamily?: string | undefined;
        modelIdentifier?: string | undefined;
        instanceId?: string | undefined;
        version: string;
        id: "cli" | "test" | "webchat-ui" | "openclaw-control-ui" | "webchat" | "gateway-client" | "openclaw-macos" | "openclaw-ios" | "openclaw-android" | "node-host" | "fingerprint" | "openclaw-probe";
        mode: "node" | "cli" | "ui" | "test" | "webchat" | "backend" | "probe";
        platform: string;
    };
}>;
export declare const validateRequestFrame: import("ajv").ValidateFunction<{
    params?: unknown;
    type: "req";
    method: string;
    id: string;
}>;
export declare const validateResponseFrame: import("ajv").ValidateFunction<{
    error?: {
        details?: unknown;
        retryAfterMs?: number | undefined;
        retryable?: boolean | undefined;
        code: string;
        message: string;
    } | undefined;
    payload?: unknown;
    type: "res";
    id: string;
    ok: boolean;
}>;
export declare const validateEventFrame: import("ajv").ValidateFunction<{
    payload?: unknown;
    seq?: number | undefined;
    stateVersion?: {
        presence: number;
        health: number;
    } | undefined;
    type: "event";
    event: string;
}>;
export declare const validateSendParams: import("ajv").ValidateFunction<{
    to: any;
    idempotencyKey: any;
} & {
    to: any;
} & {
    idempotencyKey: any;
}>;
export declare const validatePollParams: import("ajv").ValidateFunction<{
    silent?: boolean | undefined;
    channel?: string | undefined;
    accountId?: string | undefined;
    threadId?: string | undefined;
    maxSelections?: number | undefined;
    durationSeconds?: number | undefined;
    durationHours?: number | undefined;
    isAnonymous?: boolean | undefined;
    options: string[];
    to: string;
    question: string;
    idempotencyKey: string;
}>;
export declare const validateAgentParams: import("ajv").ValidateFunction<{
    message: any;
    idempotencyKey: any;
} & {
    message: any;
} & {
    idempotencyKey: any;
}>;
export declare const validateAgentIdentityParams: import("ajv").ValidateFunction<{
    sessionKey?: string | undefined;
    agentId?: string | undefined;
}>;
export declare const validateAgentWaitParams: import("ajv").ValidateFunction<{
    timeoutMs?: number | undefined;
    runId: string;
}>;
export declare const validateWakeParams: import("ajv").ValidateFunction<{
    mode: "now" | "next-heartbeat";
    text: string;
}>;
export declare const validateAgentsListParams: import("ajv").ValidateFunction<{}>;
export declare const validateAgentsCreateParams: import("ajv").ValidateFunction<{
    emoji?: string | undefined;
    avatar?: string | undefined;
    name: string;
    workspace: string;
}>;
export declare const validateAgentsUpdateParams: import("ajv").ValidateFunction<{
    name?: string | undefined;
    workspace?: string | undefined;
    model?: string | undefined;
    avatar?: string | undefined;
    agentId: string;
}>;
export declare const validateAgentsDeleteParams: import("ajv").ValidateFunction<{
    deleteFiles?: boolean | undefined;
    agentId: string;
}>;
export declare const validateAgentsFilesListParams: import("ajv").ValidateFunction<{
    agentId: string;
}>;
export declare const validateAgentsFilesGetParams: import("ajv").ValidateFunction<{
    name: string;
    agentId: string;
}>;
export declare const validateAgentsFilesSetParams: import("ajv").ValidateFunction<{
    content: string;
    name: string;
    agentId: string;
}>;
export declare const validateNodePairRequestParams: import("ajv").ValidateFunction<{
    silent?: boolean | undefined;
    version?: string | undefined;
    displayName?: string | undefined;
    platform?: string | undefined;
    commands?: string[] | undefined;
    remoteIp?: string | undefined;
    deviceFamily?: string | undefined;
    modelIdentifier?: string | undefined;
    caps?: string[] | undefined;
    coreVersion?: string | undefined;
    uiVersion?: string | undefined;
    nodeId: string;
}>;
export declare const validateNodePairListParams: import("ajv").ValidateFunction<{}>;
export declare const validateNodePairApproveParams: import("ajv").ValidateFunction<{
    requestId: string;
}>;
export declare const validateNodePairRejectParams: import("ajv").ValidateFunction<{
    requestId: string;
}>;
export declare const validateNodePairVerifyParams: import("ajv").ValidateFunction<{
    token: string;
    nodeId: string;
}>;
export declare const validateNodeRenameParams: import("ajv").ValidateFunction<{
    displayName: string;
    nodeId: string;
}>;
export declare const validateNodeListParams: import("ajv").ValidateFunction<{}>;
export declare const validateNodeDescribeParams: import("ajv").ValidateFunction<{
    nodeId: string;
}>;
export declare const validateNodeInvokeParams: import("ajv").ValidateFunction<{
    params?: unknown;
    timeoutMs?: number | undefined;
    command: string;
    idempotencyKey: string;
    nodeId: string;
}>;
export declare const validateNodeInvokeResultParams: import("ajv").ValidateFunction<{
    error?: {
        code?: string | undefined;
        message?: string | undefined;
    } | undefined;
    payload?: unknown;
    payloadJSON?: string | undefined;
    id: string;
    ok: boolean;
    nodeId: string;
}>;
export declare const validateNodeEventParams: import("ajv").ValidateFunction<{
    payload?: unknown;
    payloadJSON?: string | undefined;
    event: string;
}>;
export declare const validatePushTestParams: import("ajv").ValidateFunction<{
    body?: string | undefined;
    title?: string | undefined;
    environment?: string | undefined;
    nodeId: string;
}>;
export declare const validateSessionsListParams: import("ajv").ValidateFunction<{
    search?: string | undefined;
    label?: string | undefined;
    agentId?: string | undefined;
    spawnedBy?: string | undefined;
    limit?: number | undefined;
    activeMinutes?: number | undefined;
    includeGlobal?: boolean | undefined;
    includeUnknown?: boolean | undefined;
    includeDerivedTitles?: boolean | undefined;
    includeLastMessage?: boolean | undefined;
}>;
export declare const validateSessionsPreviewParams: import("ajv").ValidateFunction<{
    limit?: number | undefined;
    maxChars?: number | undefined;
    keys: string[];
}>;
export declare const validateSessionsResolveParams: import("ajv").ValidateFunction<{
    key?: string | undefined;
    label?: string | undefined;
    agentId?: string | undefined;
    sessionId?: string | undefined;
    spawnedBy?: string | undefined;
    includeGlobal?: boolean | undefined;
    includeUnknown?: boolean | undefined;
}>;
export declare const validateSessionsPatchParams: import("ajv").ValidateFunction<{
    label?: string | null | undefined;
    model?: string | null | undefined;
    execHost?: string | null | undefined;
    execSecurity?: string | null | undefined;
    execAsk?: string | null | undefined;
    execNode?: string | null | undefined;
    spawnedBy?: string | null | undefined;
    spawnDepth?: number | null | undefined;
    thinkingLevel?: string | null | undefined;
    verboseLevel?: string | null | undefined;
    reasoningLevel?: string | null | undefined;
    elevatedLevel?: string | null | undefined;
    responseUsage?: "full" | "on" | "off" | "tokens" | null | undefined;
    groupActivation?: "always" | "mention" | null | undefined;
    sendPolicy?: "allow" | "deny" | null | undefined;
    key: string;
}>;
export declare const validateSessionsResetParams: import("ajv").ValidateFunction<{
    reason?: "new" | "reset" | undefined;
    key: string;
}>;
export declare const validateSessionsDeleteParams: import("ajv").ValidateFunction<{
    deleteTranscript?: boolean | undefined;
    emitLifecycleHooks?: boolean | undefined;
    key: string;
}>;
export declare const validateSessionsCompactParams: import("ajv").ValidateFunction<{
    maxLines?: number | undefined;
    key: string;
}>;
export declare const validateSessionsUsageParams: import("ajv").ValidateFunction<{
    key?: string | undefined;
    mode?: "gateway" | "utc" | "specific" | undefined;
    limit?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    utcOffset?: string | undefined;
    includeContextWeight?: boolean | undefined;
}>;
export declare const validateConfigGetParams: import("ajv").ValidateFunction<{}>;
export declare const validateConfigSetParams: import("ajv").ValidateFunction<{
    baseHash?: string | undefined;
    raw: string;
}>;
export declare const validateConfigApplyParams: import("ajv").ValidateFunction<{
    sessionKey?: string | undefined;
    baseHash?: string | undefined;
    note?: string | undefined;
    restartDelayMs?: number | undefined;
    raw: string;
}>;
export declare const validateConfigPatchParams: import("ajv").ValidateFunction<{
    sessionKey?: string | undefined;
    baseHash?: string | undefined;
    note?: string | undefined;
    restartDelayMs?: number | undefined;
    raw: string;
}>;
export declare const validateConfigSchemaParams: import("ajv").ValidateFunction<{}>;
export declare const validateWizardStartParams: import("ajv").ValidateFunction<{
    mode?: "local" | "remote" | undefined;
    workspace?: string | undefined;
}>;
export declare const validateWizardNextParams: import("ajv").ValidateFunction<{
    answer?: {
        value?: unknown;
        stepId: string;
    } | undefined;
    sessionId: string;
}>;
export declare const validateWizardCancelParams: import("ajv").ValidateFunction<{
    sessionId: string;
}>;
export declare const validateWizardStatusParams: import("ajv").ValidateFunction<{
    sessionId: string;
}>;
export declare const validateTalkModeParams: import("ajv").ValidateFunction<{
    phase?: string | undefined;
    enabled: boolean;
}>;
export declare const validateTalkConfigParams: import("ajv").ValidateFunction<{
    includeSecrets?: boolean | undefined;
}>;
export declare const validateChannelsStatusParams: import("ajv").ValidateFunction<{
    timeoutMs?: number | undefined;
    probe?: boolean | undefined;
}>;
export declare const validateChannelsLogoutParams: import("ajv").ValidateFunction<{
    accountId?: string | undefined;
    channel: string;
}>;
export declare const validateModelsListParams: import("ajv").ValidateFunction<{}>;
export declare const validateSkillsStatusParams: import("ajv").ValidateFunction<{
    agentId?: string | undefined;
}>;
export declare const validateSkillsBinsParams: import("ajv").ValidateFunction<{}>;
export declare const validateSkillsInstallParams: import("ajv").ValidateFunction<{
    timeoutMs?: number | undefined;
    name: string;
    installId: string;
}>;
export declare const validateSkillsUpdateParams: import("ajv").ValidateFunction<{
    apiKey?: string | undefined;
    enabled?: boolean | undefined;
    env?: {
        [x: string]: string;
    } | undefined;
    skillKey: string;
}>;
export declare const validateCronListParams: import("ajv").ValidateFunction<{
    includeDisabled?: boolean | undefined;
}>;
export declare const validateCronStatusParams: import("ajv").ValidateFunction<{}>;
export declare const validateCronAddParams: import("ajv").ValidateFunction<{
    description?: string | undefined;
    sessionKey?: string | null | undefined;
    enabled?: boolean | undefined;
    agentId?: string | null | undefined;
    deleteAfterRun?: boolean | undefined;
    delivery?: {
        to?: string | undefined;
        channel?: string | undefined;
        bestEffort?: boolean | undefined;
        mode: "none";
    } | {
        to?: string | undefined;
        channel?: string | undefined;
        bestEffort?: boolean | undefined;
        mode: "announce";
    } | {
        channel?: string | undefined;
        bestEffort?: boolean | undefined;
        to: string;
        mode: "webhook";
    } | undefined;
    name: string;
    payload: {
        text: string;
        kind: "systemEvent";
    } | {
        to?: string | undefined;
        channel?: string | undefined;
        thinking?: string | undefined;
        model?: string | undefined;
        timeoutSeconds?: number | undefined;
        deliver?: boolean | undefined;
        allowUnsafeExternalContent?: boolean | undefined;
        bestEffortDeliver?: boolean | undefined;
        message: unknown;
        kind: "agentTurn";
    };
    schedule: {
        at: string;
        kind: "at";
    } | {
        anchorMs?: number | undefined;
        kind: "every";
        everyMs: number;
    } | {
        tz?: string | undefined;
        staggerMs?: number | undefined;
        kind: "cron";
        expr: string;
    };
    sessionTarget: "main" | "isolated";
    wakeMode: "now" | "next-heartbeat";
}>;
export declare const validateCronUpdateParams: import("ajv").ValidateFunction<{
    id: string;
} | {
    jobId: string;
}>;
export declare const validateCronRemoveParams: import("ajv").ValidateFunction<{
    id: string;
} | {
    jobId: string;
}>;
export declare const validateCronRunParams: import("ajv").ValidateFunction<{
    id: string;
} | {
    jobId: string;
}>;
export declare const validateCronRunsParams: import("ajv").ValidateFunction<{
    id: string;
} | {
    jobId: string;
}>;
export declare const validateDevicePairListParams: import("ajv").ValidateFunction<{}>;
export declare const validateDevicePairApproveParams: import("ajv").ValidateFunction<{
    requestId: string;
}>;
export declare const validateDevicePairRejectParams: import("ajv").ValidateFunction<{
    requestId: string;
}>;
export declare const validateDevicePairRemoveParams: import("ajv").ValidateFunction<{
    deviceId: string;
}>;
export declare const validateDeviceTokenRotateParams: import("ajv").ValidateFunction<{
    scopes?: string[] | undefined;
    deviceId: string;
    role: string;
}>;
export declare const validateDeviceTokenRevokeParams: import("ajv").ValidateFunction<{
    deviceId: string;
    role: string;
}>;
export declare const validateExecApprovalsGetParams: import("ajv").ValidateFunction<{}>;
export declare const validateExecApprovalsSetParams: import("ajv").ValidateFunction<{
    baseHash?: string | undefined;
    file: {
        socket?: {
            path?: string | undefined;
            token?: string | undefined;
        } | undefined;
        agents?: {
            [x: string]: {
                security?: string | undefined;
                allowlist?: {
                    id?: string | undefined;
                    lastUsedAt?: number | undefined;
                    lastUsedCommand?: string | undefined;
                    lastResolvedPath?: string | undefined;
                    pattern: string;
                }[] | undefined;
                ask?: string | undefined;
                askFallback?: string | undefined;
                autoAllowSkills?: boolean | undefined;
            };
        } | undefined;
        defaults?: {
            security?: string | undefined;
            ask?: string | undefined;
            askFallback?: string | undefined;
            autoAllowSkills?: boolean | undefined;
        } | undefined;
        version: 1;
    };
}>;
export declare const validateExecApprovalRequestParams: import("ajv").ValidateFunction<{
    host?: string | null | undefined;
    security?: string | null | undefined;
    id?: string | undefined;
    sessionKey?: string | null | undefined;
    cwd?: string | null | undefined;
    timeoutMs?: number | undefined;
    agentId?: string | null | undefined;
    resolvedPath?: string | null | undefined;
    ask?: string | null | undefined;
    twoPhase?: boolean | undefined;
    command: string;
}>;
export declare const validateExecApprovalResolveParams: import("ajv").ValidateFunction<{
    id: string;
    decision: string;
}>;
export declare const validateExecApprovalsNodeGetParams: import("ajv").ValidateFunction<{
    nodeId: string;
}>;
export declare const validateExecApprovalsNodeSetParams: import("ajv").ValidateFunction<{
    baseHash?: string | undefined;
    file: {
        socket?: {
            path?: string | undefined;
            token?: string | undefined;
        } | undefined;
        agents?: {
            [x: string]: {
                security?: string | undefined;
                allowlist?: {
                    id?: string | undefined;
                    lastUsedAt?: number | undefined;
                    lastUsedCommand?: string | undefined;
                    lastResolvedPath?: string | undefined;
                    pattern: string;
                }[] | undefined;
                ask?: string | undefined;
                askFallback?: string | undefined;
                autoAllowSkills?: boolean | undefined;
            };
        } | undefined;
        defaults?: {
            security?: string | undefined;
            ask?: string | undefined;
            askFallback?: string | undefined;
            autoAllowSkills?: boolean | undefined;
        } | undefined;
        version: 1;
    };
    nodeId: string;
}>;
export declare const validateLogsTailParams: import("ajv").ValidateFunction<{
    cursor?: number | undefined;
    maxBytes?: number | undefined;
    limit?: number | undefined;
}>;
export declare const validateChatHistoryParams: import("ajv").ValidateFunction<{
    sessionKey: any;
}>;
export declare const validateChatSendParams: import("ajv").ValidateFunction<{
    message: any;
    sessionKey: any;
    idempotencyKey: any;
} & {
    message: any;
} & {
    sessionKey: any;
} & {
    idempotencyKey: any;
}>;
export declare const validateChatAbortParams: import("ajv").ValidateFunction<{
    runId?: string | undefined;
    sessionKey: string;
}>;
export declare const validateChatInjectParams: import("ajv").ValidateFunction<{
    label?: string | undefined;
    message: string;
    sessionKey: string;
}>;
export declare const validateChatEvent: import("ajv").ValidateFunction<{
    state: any;
    sessionKey: any;
    seq: any;
    runId: any;
} & {
    state: any;
} & {
    sessionKey: any;
} & {
    seq: any;
} & {
    runId: any;
}>;
export declare const validateUpdateRunParams: import("ajv").ValidateFunction<{
    sessionKey?: string | undefined;
    timeoutMs?: number | undefined;
    note?: string | undefined;
    restartDelayMs?: number | undefined;
}>;
export declare const validateWebLoginStartParams: import("ajv").ValidateFunction<{
    force?: boolean | undefined;
    verbose?: boolean | undefined;
    timeoutMs?: number | undefined;
    accountId?: string | undefined;
}>;
export declare const validateWebLoginWaitParams: import("ajv").ValidateFunction<{
    timeoutMs?: number | undefined;
    accountId?: string | undefined;
}>;
export declare function formatValidationErrors(errors: ErrorObject[] | null | undefined): string;
export { ConnectParamsSchema, HelloOkSchema, RequestFrameSchema, ResponseFrameSchema, EventFrameSchema, GatewayFrameSchema, PresenceEntrySchema, SnapshotSchema, ErrorShapeSchema, StateVersionSchema, AgentEventSchema, ChatEventSchema, SendParamsSchema, PollParamsSchema, AgentParamsSchema, AgentIdentityParamsSchema, AgentIdentityResultSchema, WakeParamsSchema, PushTestParamsSchema, PushTestResultSchema, NodePairRequestParamsSchema, NodePairListParamsSchema, NodePairApproveParamsSchema, NodePairRejectParamsSchema, NodePairVerifyParamsSchema, NodeListParamsSchema, NodeInvokeParamsSchema, SessionsListParamsSchema, SessionsPreviewParamsSchema, SessionsPatchParamsSchema, SessionsResetParamsSchema, SessionsDeleteParamsSchema, SessionsCompactParamsSchema, SessionsUsageParamsSchema, ConfigGetParamsSchema, ConfigSetParamsSchema, ConfigApplyParamsSchema, ConfigPatchParamsSchema, ConfigSchemaParamsSchema, ConfigSchemaResponseSchema, WizardStartParamsSchema, WizardNextParamsSchema, WizardCancelParamsSchema, WizardStatusParamsSchema, WizardStepSchema, WizardNextResultSchema, WizardStartResultSchema, WizardStatusResultSchema, TalkConfigParamsSchema, TalkConfigResultSchema, ChannelsStatusParamsSchema, ChannelsStatusResultSchema, ChannelsLogoutParamsSchema, WebLoginStartParamsSchema, WebLoginWaitParamsSchema, AgentSummarySchema, AgentsFileEntrySchema, AgentsCreateParamsSchema, AgentsCreateResultSchema, AgentsUpdateParamsSchema, AgentsUpdateResultSchema, AgentsDeleteParamsSchema, AgentsDeleteResultSchema, AgentsFilesListParamsSchema, AgentsFilesListResultSchema, AgentsFilesGetParamsSchema, AgentsFilesGetResultSchema, AgentsFilesSetParamsSchema, AgentsFilesSetResultSchema, AgentsListParamsSchema, AgentsListResultSchema, ModelsListParamsSchema, SkillsStatusParamsSchema, SkillsInstallParamsSchema, SkillsUpdateParamsSchema, CronJobSchema, CronListParamsSchema, CronStatusParamsSchema, CronAddParamsSchema, CronUpdateParamsSchema, CronRemoveParamsSchema, CronRunParamsSchema, CronRunsParamsSchema, LogsTailParamsSchema, LogsTailResultSchema, ChatHistoryParamsSchema, ChatSendParamsSchema, ChatInjectParamsSchema, UpdateRunParamsSchema, TickEventSchema, ShutdownEventSchema, ProtocolSchemas, PROTOCOL_VERSION, ErrorCodes, errorShape, };
export type { GatewayFrame, ConnectParams, HelloOk, RequestFrame, ResponseFrame, EventFrame, PresenceEntry, Snapshot, ErrorShape, StateVersion, AgentEvent, AgentIdentityParams, AgentIdentityResult, AgentWaitParams, ChatEvent, TickEvent, ShutdownEvent, WakeParams, NodePairRequestParams, NodePairListParams, NodePairApproveParams, DevicePairListParams, DevicePairApproveParams, DevicePairRejectParams, ConfigGetParams, ConfigSetParams, ConfigApplyParams, ConfigPatchParams, ConfigSchemaParams, ConfigSchemaResponse, WizardStartParams, WizardNextParams, WizardCancelParams, WizardStatusParams, WizardStep, WizardNextResult, WizardStartResult, WizardStatusResult, TalkConfigParams, TalkConfigResult, TalkModeParams, ChannelsStatusParams, ChannelsStatusResult, ChannelsLogoutParams, WebLoginStartParams, WebLoginWaitParams, AgentSummary, AgentsFileEntry, AgentsCreateParams, AgentsCreateResult, AgentsUpdateParams, AgentsUpdateResult, AgentsDeleteParams, AgentsDeleteResult, AgentsFilesListParams, AgentsFilesListResult, AgentsFilesGetParams, AgentsFilesGetResult, AgentsFilesSetParams, AgentsFilesSetResult, AgentsListParams, AgentsListResult, SkillsStatusParams, SkillsBinsParams, SkillsBinsResult, SkillsInstallParams, SkillsUpdateParams, NodePairRejectParams, NodePairVerifyParams, NodeListParams, NodeInvokeParams, NodeInvokeResultParams, NodeEventParams, SessionsListParams, SessionsPreviewParams, SessionsResolveParams, SessionsPatchParams, SessionsPatchResult, SessionsResetParams, SessionsDeleteParams, SessionsCompactParams, SessionsUsageParams, CronJob, CronListParams, CronStatusParams, CronAddParams, CronUpdateParams, CronRemoveParams, CronRunParams, CronRunsParams, CronRunLogEntry, ExecApprovalsGetParams, ExecApprovalsSetParams, ExecApprovalsSnapshot, LogsTailParams, LogsTailResult, PollParams, UpdateRunParams, ChatInjectParams, };
//# sourceMappingURL=index.d.ts.map