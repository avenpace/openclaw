import { type ErrorObject } from "ajv";
import type { SessionsPatchResult } from "../session-utils.types.js";
import { type AgentEvent, AgentEventSchema, type AgentIdentityParams, AgentIdentityParamsSchema, type AgentIdentityResult, AgentIdentityResultSchema, AgentParamsSchema, type AgentSummary, AgentSummarySchema, type AgentsFileEntry, AgentsFileEntrySchema, type AgentsCreateParams, AgentsCreateParamsSchema, type AgentsCreateResult, AgentsCreateResultSchema, type AgentsUpdateParams, AgentsUpdateParamsSchema, type AgentsUpdateResult, AgentsUpdateResultSchema, type AgentsDeleteParams, AgentsDeleteParamsSchema, type AgentsDeleteResult, AgentsDeleteResultSchema, type AgentsFilesGetParams, AgentsFilesGetParamsSchema, type AgentsFilesGetResult, AgentsFilesGetResultSchema, type AgentsFilesListParams, AgentsFilesListParamsSchema, type AgentsFilesListResult, AgentsFilesListResultSchema, type AgentsFilesSetParams, AgentsFilesSetParamsSchema, type AgentsFilesSetResult, AgentsFilesSetResultSchema, type AgentsListParams, AgentsListParamsSchema, type AgentsListResult, AgentsListResultSchema, type AgentWaitParams, type ChannelsLogoutParams, ChannelsLogoutParamsSchema, type TalkConfigParams, TalkConfigParamsSchema, type TalkConfigResult, TalkConfigResultSchema, type ChannelsStatusParams, ChannelsStatusParamsSchema, type ChannelsStatusResult, ChannelsStatusResultSchema, type ChatEvent, ChatEventSchema, ChatHistoryParamsSchema, type ChatInjectParams, ChatInjectParamsSchema, ChatSendParamsSchema, type ConfigApplyParams, ConfigApplyParamsSchema, type ConfigGetParams, ConfigGetParamsSchema, type ConfigPatchParams, ConfigPatchParamsSchema, type ConfigSchemaParams, ConfigSchemaParamsSchema, type ConfigSchemaResponse, ConfigSchemaResponseSchema, type ConfigSetParams, ConfigSetParamsSchema, type ConnectParams, ConnectParamsSchema, type CronAddParams, CronAddParamsSchema, type CronJob, CronJobSchema, type CronListParams, CronListParamsSchema, type CronRemoveParams, CronRemoveParamsSchema, type CronRunLogEntry, type CronRunParams, CronRunParamsSchema, type CronRunsParams, CronRunsParamsSchema, type CronStatusParams, CronStatusParamsSchema, type CronUpdateParams, CronUpdateParamsSchema, type DevicePairApproveParams, type DevicePairListParams, type DevicePairRejectParams, type ExecApprovalsGetParams, type ExecApprovalsSetParams, type ExecApprovalsSnapshot, ErrorCodes, type ErrorShape, ErrorShapeSchema, type EventFrame, EventFrameSchema, errorShape, type GatewayFrame, GatewayFrameSchema, type HelloOk, HelloOkSchema, type LogsTailParams, LogsTailParamsSchema, type LogsTailResult, LogsTailResultSchema, ModelsListParamsSchema, type NodeEventParams, type NodeInvokeParams, NodeInvokeParamsSchema, type NodeInvokeResultParams, type NodeListParams, NodeListParamsSchema, type NodePairApproveParams, NodePairApproveParamsSchema, type NodePairListParams, NodePairListParamsSchema, type NodePairRejectParams, NodePairRejectParamsSchema, type NodePairRequestParams, NodePairRequestParamsSchema, type NodePairVerifyParams, NodePairVerifyParamsSchema, type PollParams, PollParamsSchema, PROTOCOL_VERSION, PushTestParamsSchema, PushTestResultSchema, type PresenceEntry, PresenceEntrySchema, ProtocolSchemas, type RequestFrame, RequestFrameSchema, type ResponseFrame, ResponseFrameSchema, SendParamsSchema, type SessionsCompactParams, SessionsCompactParamsSchema, type SessionsDeleteParams, SessionsDeleteParamsSchema, type SessionsListParams, SessionsListParamsSchema, type SessionsPatchParams, SessionsPatchParamsSchema, type SessionsPreviewParams, SessionsPreviewParamsSchema, type SessionsResetParams, SessionsResetParamsSchema, type SessionsResolveParams, type SessionsUsageParams, SessionsUsageParamsSchema, type ShutdownEvent, ShutdownEventSchema, type SkillsBinsParams, type SkillsBinsResult, type SkillsInstallParams, SkillsInstallParamsSchema, type SkillsStatusParams, SkillsStatusParamsSchema, type SkillsUpdateParams, SkillsUpdateParamsSchema, type Snapshot, SnapshotSchema, type StateVersion, StateVersionSchema, type TalkModeParams, type TickEvent, TickEventSchema, type UpdateRunParams, UpdateRunParamsSchema, type WakeParams, WakeParamsSchema, type WebLoginStartParams, WebLoginStartParamsSchema, type WebLoginWaitParams, WebLoginWaitParamsSchema, type WizardCancelParams, WizardCancelParamsSchema, type WizardNextParams, WizardNextParamsSchema, type WizardNextResult, WizardNextResultSchema, type WizardStartParams, WizardStartParamsSchema, type WizardStartResult, WizardStartResultSchema, type WizardStatusParams, WizardStatusParamsSchema, type WizardStatusResult, WizardStatusResultSchema, type WizardStep, WizardStepSchema } from "./schema.js";
export declare const validateConnectParams: import("ajv").ValidateFunction<{
    permissions?: {
        [x: string]: boolean;
    };
    commands?: string[];
    auth?: {
        token?: string;
        password?: string;
        deviceToken?: string;
    };
    role?: string;
    scopes?: string[];
    device?: {
        id: string;
        publicKey: string;
        signature: string;
        signedAt: number;
        nonce: string;
    };
    caps?: string[];
    pathEnv?: string;
    locale?: string;
    userAgent?: string;
    minProtocol: number;
    maxProtocol: number;
    client: {
        displayName?: string;
        deviceFamily?: string;
        modelIdentifier?: string;
        instanceId?: string;
        id: "cli" | "test" | "webchat" | "webchat-ui" | "openclaw-control-ui" | "gateway-client" | "openclaw-macos" | "openclaw-ios" | "openclaw-android" | "node-host" | "fingerprint" | "openclaw-probe";
        mode: "node" | "cli" | "ui" | "test" | "webchat" | "backend" | "probe";
        version: string;
        platform: string;
    };
}>;
export declare const validateRequestFrame: import("ajv").ValidateFunction<{
    params?: unknown;
    id: string;
    type: "req";
    method: string;
}>;
export declare const validateResponseFrame: import("ajv").ValidateFunction<{
    payload?: unknown;
    error?: {
        retryAfterMs?: number;
        details?: unknown;
        retryable?: boolean;
        message: string;
        code: string;
    };
    id: string;
    type: "res";
    ok: boolean;
}>;
export declare const validateEventFrame: import("ajv").ValidateFunction<{
    payload?: unknown;
    seq?: number;
    stateVersion?: {
        presence: number;
        health: number;
    };
    type: "event";
    event: string;
}>;
export declare const validateSendParams: import("ajv").ValidateFunction<unknown>;
export declare const validatePollParams: import("ajv").ValidateFunction<{
    channel?: string;
    silent?: boolean;
    accountId?: string;
    threadId?: string;
    maxSelections?: number;
    durationSeconds?: number;
    durationHours?: number;
    isAnonymous?: boolean;
    options: string[];
    to: string;
    idempotencyKey: string;
    question: string;
}>;
export declare const validateAgentParams: import("ajv").ValidateFunction<unknown>;
export declare const validateAgentIdentityParams: import("ajv").ValidateFunction<{
    sessionKey?: string;
    agentId?: string;
}>;
export declare const validateAgentWaitParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    runId: string;
}>;
export declare const validateWakeParams: import("ajv").ValidateFunction<{
    mode: "now" | "next-heartbeat";
    text: string;
}>;
export declare const validateAgentsListParams: import("ajv").ValidateFunction<{}>;
export declare const validateAgentsCreateParams: import("ajv").ValidateFunction<{
    emoji?: string;
    avatar?: string;
    name: string;
    workspace: string;
}>;
export declare const validateAgentsUpdateParams: import("ajv").ValidateFunction<{
    name?: string;
    workspace?: string;
    model?: string;
    avatar?: string;
    agentId: string;
}>;
export declare const validateAgentsDeleteParams: import("ajv").ValidateFunction<{
    deleteFiles?: boolean;
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
    name: string;
    content: string;
    agentId: string;
}>;
export declare const validateNodePairRequestParams: import("ajv").ValidateFunction<{
    silent?: boolean;
    commands?: string[];
    version?: string;
    displayName?: string;
    platform?: string;
    remoteIp?: string;
    deviceFamily?: string;
    modelIdentifier?: string;
    caps?: string[];
    coreVersion?: string;
    uiVersion?: string;
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
    timeoutMs?: number;
    params?: unknown;
    command: string;
    idempotencyKey: string;
    nodeId: string;
}>;
export declare const validateNodeInvokeResultParams: import("ajv").ValidateFunction<{
    payload?: unknown;
    error?: {
        message?: string;
        code?: string;
    };
    payloadJSON?: string;
    id: string;
    ok: boolean;
    nodeId: string;
}>;
export declare const validateNodeEventParams: import("ajv").ValidateFunction<{
    payload?: unknown;
    payloadJSON?: string;
    event: string;
}>;
export declare const validatePushTestParams: import("ajv").ValidateFunction<{
    title?: string;
    body?: string;
    environment?: string;
    nodeId: string;
}>;
export declare const validateSessionsListParams: import("ajv").ValidateFunction<{
    search?: string;
    label?: string;
    agentId?: string;
    spawnedBy?: string;
    limit?: number;
    activeMinutes?: number;
    includeGlobal?: boolean;
    includeUnknown?: boolean;
    includeDerivedTitles?: boolean;
    includeLastMessage?: boolean;
}>;
export declare const validateSessionsPreviewParams: import("ajv").ValidateFunction<{
    limit?: number;
    maxChars?: number;
    keys: string[];
}>;
export declare const validateSessionsResolveParams: import("ajv").ValidateFunction<{
    key?: string;
    label?: string;
    sessionId?: string;
    agentId?: string;
    spawnedBy?: string;
    includeGlobal?: boolean;
    includeUnknown?: boolean;
}>;
export declare const validateSessionsPatchParams: import("ajv").ValidateFunction<{
    label?: string;
    model?: string;
    execHost?: string;
    execSecurity?: string;
    execAsk?: string;
    execNode?: string;
    spawnedBy?: string;
    spawnDepth?: number;
    thinkingLevel?: string;
    verboseLevel?: string;
    reasoningLevel?: string;
    elevatedLevel?: string;
    responseUsage?: "full" | "off" | "on" | "tokens";
    groupActivation?: "always" | "mention";
    sendPolicy?: "deny" | "allow";
    key: string;
}>;
export declare const validateSessionsResetParams: import("ajv").ValidateFunction<{
    reason?: "new" | "reset";
    key: string;
}>;
export declare const validateSessionsDeleteParams: import("ajv").ValidateFunction<{
    deleteTranscript?: boolean;
    emitLifecycleHooks?: boolean;
    key: string;
}>;
export declare const validateSessionsCompactParams: import("ajv").ValidateFunction<{
    maxLines?: number;
    key: string;
}>;
export declare const validateSessionsUsageParams: import("ajv").ValidateFunction<{
    key?: string;
    mode?: "gateway" | "utc" | "specific";
    limit?: number;
    startDate?: string;
    endDate?: string;
    utcOffset?: string;
    includeContextWeight?: boolean;
}>;
export declare const validateConfigGetParams: import("ajv").ValidateFunction<{}>;
export declare const validateConfigSetParams: import("ajv").ValidateFunction<{
    baseHash?: string;
    raw: string;
}>;
export declare const validateConfigApplyParams: import("ajv").ValidateFunction<{
    sessionKey?: string;
    baseHash?: string;
    note?: string;
    restartDelayMs?: number;
    raw: string;
}>;
export declare const validateConfigPatchParams: import("ajv").ValidateFunction<{
    sessionKey?: string;
    baseHash?: string;
    note?: string;
    restartDelayMs?: number;
    raw: string;
}>;
export declare const validateConfigSchemaParams: import("ajv").ValidateFunction<{}>;
export declare const validateWizardStartParams: import("ajv").ValidateFunction<{
    mode?: "local" | "remote";
    workspace?: string;
}>;
export declare const validateWizardNextParams: import("ajv").ValidateFunction<{
    answer?: {
        value?: unknown;
        stepId: string;
    };
    sessionId: string;
}>;
export declare const validateWizardCancelParams: import("ajv").ValidateFunction<{
    sessionId: string;
}>;
export declare const validateWizardStatusParams: import("ajv").ValidateFunction<{
    sessionId: string;
}>;
export declare const validateTalkModeParams: import("ajv").ValidateFunction<{
    phase?: string;
    enabled: boolean;
}>;
export declare const validateTalkConfigParams: import("ajv").ValidateFunction<{
    includeSecrets?: boolean;
}>;
export declare const validateChannelsStatusParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    probe?: boolean;
}>;
export declare const validateChannelsLogoutParams: import("ajv").ValidateFunction<{
    accountId?: string;
    channel: string;
}>;
export declare const validateModelsListParams: import("ajv").ValidateFunction<{}>;
export declare const validateSkillsStatusParams: import("ajv").ValidateFunction<{
    agentId?: string;
}>;
export declare const validateSkillsBinsParams: import("ajv").ValidateFunction<{}>;
export declare const validateSkillsInstallParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    name: string;
    installId: string;
}>;
export declare const validateSkillsUpdateParams: import("ajv").ValidateFunction<{
    env?: {
        [x: string]: string;
    };
    enabled?: boolean;
    apiKey?: string;
    skillKey: string;
}>;
export declare const validateCronListParams: import("ajv").ValidateFunction<{
    includeDisabled?: boolean;
}>;
export declare const validateCronStatusParams: import("ajv").ValidateFunction<{}>;
export declare const validateCronAddParams: import("ajv").ValidateFunction<{
    enabled?: boolean;
    sessionKey?: string;
    agentId?: string;
    description?: string;
    deleteAfterRun?: boolean;
    delivery?: {
        channel?: string;
        to?: string;
        bestEffort?: boolean;
        mode: "none";
    } | {
        channel?: string;
        to?: string;
        bestEffort?: boolean;
        mode: "announce";
    } | {
        channel?: string;
        bestEffort?: boolean;
        mode: "webhook";
        to: string;
    };
    payload: {
        text: string;
        kind: "systemEvent";
    } | {
        channel?: string;
        thinking?: string;
        model?: string;
        timeoutSeconds?: number;
        to?: string;
        deliver?: boolean;
        allowUnsafeExternalContent?: boolean;
        bestEffortDeliver?: boolean;
        message: unknown;
        kind: "agentTurn";
    };
    name: string;
    schedule: {
        at: string;
        kind: "at";
    } | {
        anchorMs?: number;
        kind: "every";
        everyMs: number;
    } | {
        tz?: string;
        staggerMs?: number;
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
    scopes?: string[];
    role: string;
    deviceId: string;
}>;
export declare const validateDeviceTokenRevokeParams: import("ajv").ValidateFunction<{
    role: string;
    deviceId: string;
}>;
export declare const validateExecApprovalsGetParams: import("ajv").ValidateFunction<{}>;
export declare const validateExecApprovalsSetParams: import("ajv").ValidateFunction<{
    baseHash?: string;
    file: {
        socket?: {
            token?: string;
            path?: string;
        };
        agents?: {
            [x: string]: {
                allowlist?: {
                    id?: string;
                    lastUsedAt?: number;
                    lastUsedCommand?: string;
                    lastResolvedPath?: string;
                    pattern: string;
                }[];
                security?: string;
                ask?: string;
                askFallback?: string;
                autoAllowSkills?: boolean;
            };
        };
        defaults?: {
            security?: string;
            ask?: string;
            askFallback?: string;
            autoAllowSkills?: boolean;
        };
        version: 1;
    };
}>;
export declare const validateExecApprovalRequestParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    id?: string;
    security?: string;
    ask?: string;
    cwd?: string;
    host?: string;
    sessionKey?: string;
    agentId?: string;
    resolvedPath?: string;
    twoPhase?: boolean;
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
    baseHash?: string;
    file: {
        socket?: {
            token?: string;
            path?: string;
        };
        agents?: {
            [x: string]: {
                allowlist?: {
                    id?: string;
                    lastUsedAt?: number;
                    lastUsedCommand?: string;
                    lastResolvedPath?: string;
                    pattern: string;
                }[];
                security?: string;
                ask?: string;
                askFallback?: string;
                autoAllowSkills?: boolean;
            };
        };
        defaults?: {
            security?: string;
            ask?: string;
            askFallback?: string;
            autoAllowSkills?: boolean;
        };
        version: 1;
    };
    nodeId: string;
}>;
export declare const validateLogsTailParams: import("ajv").ValidateFunction<{
    limit?: number;
    cursor?: number;
    maxBytes?: number;
}>;
export declare const validateChatHistoryParams: import("ajv").ValidateFunction<unknown>;
export declare const validateChatSendParams: import("ajv").ValidateFunction<unknown>;
export declare const validateChatAbortParams: import("ajv").ValidateFunction<{
    runId?: string;
    sessionKey: string;
}>;
export declare const validateChatInjectParams: import("ajv").ValidateFunction<{
    label?: string;
    message: string;
    sessionKey: string;
}>;
export declare const validateChatEvent: import("ajv").ValidateFunction<unknown>;
export declare const validateUpdateRunParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    sessionKey?: string;
    note?: string;
    restartDelayMs?: number;
}>;
export declare const validateWebLoginStartParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    verbose?: boolean;
    accountId?: string;
    force?: boolean;
}>;
export declare const validateWebLoginWaitParams: import("ajv").ValidateFunction<{
    timeoutMs?: number;
    accountId?: string;
}>;
export declare function formatValidationErrors(errors: ErrorObject[] | null | undefined): string;
export { ConnectParamsSchema, HelloOkSchema, RequestFrameSchema, ResponseFrameSchema, EventFrameSchema, GatewayFrameSchema, PresenceEntrySchema, SnapshotSchema, ErrorShapeSchema, StateVersionSchema, AgentEventSchema, ChatEventSchema, SendParamsSchema, PollParamsSchema, AgentParamsSchema, AgentIdentityParamsSchema, AgentIdentityResultSchema, WakeParamsSchema, PushTestParamsSchema, PushTestResultSchema, NodePairRequestParamsSchema, NodePairListParamsSchema, NodePairApproveParamsSchema, NodePairRejectParamsSchema, NodePairVerifyParamsSchema, NodeListParamsSchema, NodeInvokeParamsSchema, SessionsListParamsSchema, SessionsPreviewParamsSchema, SessionsPatchParamsSchema, SessionsResetParamsSchema, SessionsDeleteParamsSchema, SessionsCompactParamsSchema, SessionsUsageParamsSchema, ConfigGetParamsSchema, ConfigSetParamsSchema, ConfigApplyParamsSchema, ConfigPatchParamsSchema, ConfigSchemaParamsSchema, ConfigSchemaResponseSchema, WizardStartParamsSchema, WizardNextParamsSchema, WizardCancelParamsSchema, WizardStatusParamsSchema, WizardStepSchema, WizardNextResultSchema, WizardStartResultSchema, WizardStatusResultSchema, TalkConfigParamsSchema, TalkConfigResultSchema, ChannelsStatusParamsSchema, ChannelsStatusResultSchema, ChannelsLogoutParamsSchema, WebLoginStartParamsSchema, WebLoginWaitParamsSchema, AgentSummarySchema, AgentsFileEntrySchema, AgentsCreateParamsSchema, AgentsCreateResultSchema, AgentsUpdateParamsSchema, AgentsUpdateResultSchema, AgentsDeleteParamsSchema, AgentsDeleteResultSchema, AgentsFilesListParamsSchema, AgentsFilesListResultSchema, AgentsFilesGetParamsSchema, AgentsFilesGetResultSchema, AgentsFilesSetParamsSchema, AgentsFilesSetResultSchema, AgentsListParamsSchema, AgentsListResultSchema, ModelsListParamsSchema, SkillsStatusParamsSchema, SkillsInstallParamsSchema, SkillsUpdateParamsSchema, CronJobSchema, CronListParamsSchema, CronStatusParamsSchema, CronAddParamsSchema, CronUpdateParamsSchema, CronRemoveParamsSchema, CronRunParamsSchema, CronRunsParamsSchema, LogsTailParamsSchema, LogsTailResultSchema, ChatHistoryParamsSchema, ChatSendParamsSchema, ChatInjectParamsSchema, UpdateRunParamsSchema, TickEventSchema, ShutdownEventSchema, ProtocolSchemas, PROTOCOL_VERSION, ErrorCodes, errorShape, };
export type { GatewayFrame, ConnectParams, HelloOk, RequestFrame, ResponseFrame, EventFrame, PresenceEntry, Snapshot, ErrorShape, StateVersion, AgentEvent, AgentIdentityParams, AgentIdentityResult, AgentWaitParams, ChatEvent, TickEvent, ShutdownEvent, WakeParams, NodePairRequestParams, NodePairListParams, NodePairApproveParams, DevicePairListParams, DevicePairApproveParams, DevicePairRejectParams, ConfigGetParams, ConfigSetParams, ConfigApplyParams, ConfigPatchParams, ConfigSchemaParams, ConfigSchemaResponse, WizardStartParams, WizardNextParams, WizardCancelParams, WizardStatusParams, WizardStep, WizardNextResult, WizardStartResult, WizardStatusResult, TalkConfigParams, TalkConfigResult, TalkModeParams, ChannelsStatusParams, ChannelsStatusResult, ChannelsLogoutParams, WebLoginStartParams, WebLoginWaitParams, AgentSummary, AgentsFileEntry, AgentsCreateParams, AgentsCreateResult, AgentsUpdateParams, AgentsUpdateResult, AgentsDeleteParams, AgentsDeleteResult, AgentsFilesListParams, AgentsFilesListResult, AgentsFilesGetParams, AgentsFilesGetResult, AgentsFilesSetParams, AgentsFilesSetResult, AgentsListParams, AgentsListResult, SkillsStatusParams, SkillsBinsParams, SkillsBinsResult, SkillsInstallParams, SkillsUpdateParams, NodePairRejectParams, NodePairVerifyParams, NodeListParams, NodeInvokeParams, NodeInvokeResultParams, NodeEventParams, SessionsListParams, SessionsPreviewParams, SessionsResolveParams, SessionsPatchParams, SessionsPatchResult, SessionsResetParams, SessionsDeleteParams, SessionsCompactParams, SessionsUsageParams, CronJob, CronListParams, CronStatusParams, CronAddParams, CronUpdateParams, CronRemoveParams, CronRunParams, CronRunsParams, CronRunLogEntry, ExecApprovalsGetParams, ExecApprovalsSetParams, ExecApprovalsSnapshot, LogsTailParams, LogsTailResult, PollParams, UpdateRunParams, ChatInjectParams, };
