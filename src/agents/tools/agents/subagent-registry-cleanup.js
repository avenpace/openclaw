import { SUBAGENT_ENDED_REASON_COMPLETE, } from "./subagent-lifecycle-events.js";
export function resolveCleanupCompletionReason(entry) {
    return entry.endedReason ?? SUBAGENT_ENDED_REASON_COMPLETE;
}
function resolveEndedAgoMs(entry, now) {
    return typeof entry.endedAt === "number" ? now - entry.endedAt : 0;
}
export function resolveDeferredCleanupDecision(params) {
    const endedAgo = resolveEndedAgoMs(params.entry, params.now);
    if (params.entry.expectsCompletionMessage === true && params.activeDescendantRuns > 0) {
        if (endedAgo > params.announceExpiryMs) {
            return { kind: "give-up", reason: "expiry" };
        }
        return { kind: "defer-descendants", delayMs: params.deferDescendantDelayMs };
    }
    const retryCount = (params.entry.announceRetryCount ?? 0) + 1;
    if (retryCount >= params.maxAnnounceRetryCount || endedAgo > params.announceExpiryMs) {
        return {
            kind: "give-up",
            reason: retryCount >= params.maxAnnounceRetryCount ? "retry-limit" : "expiry",
            retryCount,
        };
    }
    return {
        kind: "retry",
        retryCount,
        resumeDelayMs: params.entry.expectsCompletionMessage === true
            ? params.resolveAnnounceRetryDelayMs(retryCount)
            : undefined,
    };
}
//# sourceMappingURL=subagent-registry-cleanup.js.map