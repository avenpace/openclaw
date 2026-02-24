import type { CronJobCreate, CronJobPatch } from "../types.js";
import type { CronServiceState } from "./state.js";
export declare function start(state: CronServiceState): Promise<void>;
export declare function stop(state: CronServiceState): void;
export declare function status(state: CronServiceState): Promise<{
    enabled: boolean;
    storePath: string;
    jobs: number;
    nextWakeAtMs: number;
}>;
export declare function list(state: CronServiceState, opts?: {
    includeDisabled?: boolean;
    agentId?: string;
}): Promise<any>;
export declare function add(state: CronServiceState, input: CronJobCreate): Promise<import("../types.js").CronJob>;
export declare function update(state: CronServiceState, id: string, patch: CronJobPatch, opts?: {
    agentId?: string;
}): Promise<import("../types.js").CronJob>;
export declare function remove(state: CronServiceState, id: string, opts?: {
    agentId?: string;
}): Promise<{
    readonly ok: false;
    readonly removed: false;
} | {
    readonly ok: true;
    readonly removed: boolean;
}>;
export declare function run(state: CronServiceState, id: string, mode?: "due" | "force"): Promise<{
    ok: boolean;
    ran: boolean;
    reason: "already-running";
    readonly jobId?: undefined;
    readonly startedAt?: undefined;
    readonly executionJob?: undefined;
} | {
    ok: boolean;
    ran: boolean;
    reason: "not-due";
    readonly jobId?: undefined;
    readonly startedAt?: undefined;
    readonly executionJob?: undefined;
} | {
    readonly ok: true;
    readonly ran: true;
    readonly jobId: string;
    readonly startedAt: number;
    readonly executionJob: import("../types.js").CronJob;
    reason?: undefined;
} | {
    readonly ok: false;
    readonly ran?: undefined;
} | {
    readonly ok: true;
    readonly ran: true;
}>;
export declare function wakeNow(state: CronServiceState, opts: {
    mode: "now" | "next-heartbeat";
    text: string;
}): {
    readonly ok: false;
} | {
    readonly ok: true;
};
