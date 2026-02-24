import { applyJobPatch, computeJobNextRunAtMs, createJob, findJobOrThrow, isJobDue, nextWakeAtMs, recomputeNextRuns, recomputeNextRunsForMaintenance, } from "./jobs.js";
import { locked } from "./locked.js";
import { ensureLoaded, persist, warnIfDisabled } from "./store.js";
import { applyJobResult, armTimer, emit, executeJobCoreWithTimeout, runMissedJobs, stopTimer, wake, } from "./timer.js";
async function ensureLoadedForRead(state) {
    await ensureLoaded(state, { skipRecompute: true });
    if (!state.store) {
        return;
    }
    // Use the maintenance-only version so that read-only operations never
    // advance a past-due nextRunAtMs without executing the job (#16156).
    const changed = recomputeNextRunsForMaintenance(state);
    if (changed) {
        await persist(state);
    }
}
export async function start(state) {
    if (!state.deps.cronEnabled) {
        state.deps.log.info({ enabled: false }, "cron: disabled");
        return;
    }
    const startupInterruptedJobIds = new Set();
    await locked(state, async () => {
        await ensureLoaded(state, { skipRecompute: true });
        const jobs = state.store?.jobs ?? [];
        for (const job of jobs) {
            if (typeof job.state.runningAtMs === "number") {
                state.deps.log.warn({ jobId: job.id, runningAtMs: job.state.runningAtMs }, "cron: clearing stale running marker on startup");
                job.state.runningAtMs = undefined;
                startupInterruptedJobIds.add(job.id);
            }
        }
        await persist(state);
    });
    await runMissedJobs(state, { skipJobIds: startupInterruptedJobIds });
    await locked(state, async () => {
        await ensureLoaded(state, { forceReload: true, skipRecompute: true });
        recomputeNextRuns(state);
        await persist(state);
        armTimer(state);
        state.deps.log.info({
            enabled: true,
            jobs: state.store?.jobs.length ?? 0,
            nextWakeAtMs: nextWakeAtMs(state) ?? null,
        }, "cron: started");
    });
}
export function stop(state) {
    stopTimer(state);
}
export async function status(state) {
    return await locked(state, async () => {
        await ensureLoadedForRead(state);
        return {
            enabled: state.deps.cronEnabled,
            storePath: state.deps.storePath,
            jobs: state.store?.jobs.length ?? 0,
            nextWakeAtMs: state.deps.cronEnabled ? (nextWakeAtMs(state) ?? null) : null,
        };
    });
}
export async function list(state, opts) {
    return await locked(state, async () => {
        await ensureLoadedForRead(state);
        const includeDisabled = opts?.includeDisabled === true;
        const filterAgentId = opts?.agentId?.trim()?.toLowerCase();
        const jobs = (state.store?.jobs ?? []).filter((j) => {
            if (!includeDisabled && !j.enabled) {
                return false;
            }
            // Filter by agentId if provided (multi-tenant isolation)
            if (filterAgentId) {
                const jobAgentId = j.agentId?.trim()?.toLowerCase();
                if (jobAgentId !== filterAgentId) {
                    return false;
                }
            }
            return true;
        });
        return jobs.toSorted((a, b) => (a.state.nextRunAtMs ?? 0) - (b.state.nextRunAtMs ?? 0));
    });
}
export async function add(state, input) {
    return await locked(state, async () => {
        warnIfDisabled(state, "add");
        await ensureLoaded(state);
        const job = createJob(state, input);
        state.store?.jobs.push(job);
        // Defensive: recompute all next-run times to ensure consistency
        recomputeNextRuns(state);
        await persist(state);
        armTimer(state);
        state.deps.log.info({
            jobId: job.id,
            jobName: job.name,
            nextRunAtMs: job.state.nextRunAtMs,
            schedulerNextWakeAtMs: nextWakeAtMs(state) ?? null,
            timerArmed: state.timer !== null,
            cronEnabled: state.deps.cronEnabled,
        }, "cron: job added");
        emit(state, {
            jobId: job.id,
            action: "added",
            nextRunAtMs: job.state.nextRunAtMs,
        });
        return job;
    });
}
/** Check if agentId matches (for multi-tenant isolation) */
function verifyAgentId(jobAgentId, requestAgentId) {
    if (!requestAgentId) {
        return true;
    } // No filter = allow all (backwards compat)
    const jobId = jobAgentId?.trim()?.toLowerCase();
    const reqId = requestAgentId.trim().toLowerCase();
    return jobId === reqId;
}
export async function update(state, id, patch, opts) {
    return await locked(state, async () => {
        warnIfDisabled(state, "update");
        await ensureLoaded(state, { skipRecompute: true });
        const job = findJobOrThrow(state, id);
        // Multi-tenant: verify ownership
        if (opts?.agentId && !verifyAgentId(job.agentId, opts.agentId)) {
            throw new Error(`Job ${id} not found`);
        }
        const now = state.deps.nowMs();
        applyJobPatch(job, patch);
        if (job.schedule.kind === "every") {
            const anchor = job.schedule.anchorMs;
            if (typeof anchor !== "number" || !Number.isFinite(anchor)) {
                const patchSchedule = patch.schedule;
                const fallbackAnchorMs = patchSchedule?.kind === "every"
                    ? now
                    : typeof job.createdAtMs === "number" && Number.isFinite(job.createdAtMs)
                        ? job.createdAtMs
                        : now;
                job.schedule = {
                    ...job.schedule,
                    anchorMs: Math.max(0, Math.floor(fallbackAnchorMs)),
                };
            }
        }
        const scheduleChanged = patch.schedule !== undefined;
        const enabledChanged = patch.enabled !== undefined;
        job.updatedAtMs = now;
        if (scheduleChanged || enabledChanged) {
            if (job.enabled) {
                job.state.nextRunAtMs = computeJobNextRunAtMs(job, now);
            }
            else {
                job.state.nextRunAtMs = undefined;
                job.state.runningAtMs = undefined;
            }
        }
        else if (job.enabled) {
            // Non-schedule edits should not mutate other jobs, but still repair a
            // missing/corrupt nextRunAtMs for the updated job.
            const nextRun = job.state.nextRunAtMs;
            if (typeof nextRun !== "number" || !Number.isFinite(nextRun)) {
                job.state.nextRunAtMs = computeJobNextRunAtMs(job, now);
            }
        }
        await persist(state);
        armTimer(state);
        emit(state, {
            jobId: id,
            action: "updated",
            nextRunAtMs: job.state.nextRunAtMs,
        });
        return job;
    });
}
export async function remove(state, id, opts) {
    return await locked(state, async () => {
        warnIfDisabled(state, "remove");
        await ensureLoaded(state);
        const before = state.store?.jobs.length ?? 0;
        if (!state.store) {
            return { ok: false, removed: false };
        }
        // Multi-tenant: only remove if agentId matches (or no filter)
        state.store.jobs = state.store.jobs.filter((j) => {
            if (j.id !== id) {
                return true;
            } // Keep non-matching jobs
            // If agentId filter provided, verify ownership
            if (opts?.agentId && !verifyAgentId(j.agentId, opts.agentId)) {
                return true; // Keep job (not owned by requester)
            }
            return false; // Remove this job
        });
        const removed = (state.store.jobs.length ?? 0) !== before;
        await persist(state);
        armTimer(state);
        if (removed) {
            emit(state, { jobId: id, action: "removed" });
        }
        return { ok: true, removed };
    });
}
export async function run(state, id, mode) {
    const prepared = await locked(state, async () => {
        warnIfDisabled(state, "run");
        await ensureLoaded(state, { skipRecompute: true });
        const job = findJobOrThrow(state, id);
        if (typeof job.state.runningAtMs === "number") {
            return { ok: true, ran: false, reason: "already-running" };
        }
        const now = state.deps.nowMs();
        const due = isJobDue(job, now, { forced: mode === "force" });
        if (!due) {
            return { ok: true, ran: false, reason: "not-due" };
        }
        // Reserve this run under lock, then execute outside lock so read ops
        // (`list`, `status`) stay responsive while the run is in progress.
        job.state.runningAtMs = now;
        job.state.lastError = undefined;
        // Persist the running marker before releasing lock so timer ticks that
        // force-reload from disk cannot start the same job concurrently.
        await persist(state);
        emit(state, { jobId: job.id, action: "started", runAtMs: now });
        const executionJob = JSON.parse(JSON.stringify(job));
        return {
            ok: true,
            ran: true,
            jobId: job.id,
            startedAt: now,
            executionJob,
        };
    });
    if (!prepared.ran) {
        return prepared;
    }
    if (!prepared.executionJob || typeof prepared.startedAt !== "number") {
        return { ok: false };
    }
    const executionJob = prepared.executionJob;
    const startedAt = prepared.startedAt;
    const jobId = prepared.jobId;
    let coreResult;
    try {
        coreResult = await executeJobCoreWithTimeout(state, executionJob);
    }
    catch (err) {
        coreResult = { status: "error", error: String(err) };
    }
    const endedAt = state.deps.nowMs();
    await locked(state, async () => {
        await ensureLoaded(state, { skipRecompute: true });
        const job = state.store?.jobs.find((entry) => entry.id === jobId);
        if (!job) {
            return;
        }
        const shouldDelete = applyJobResult(state, job, {
            status: coreResult.status,
            error: coreResult.error,
            delivered: coreResult.delivered,
            startedAt,
            endedAt,
        });
        emit(state, {
            jobId: job.id,
            action: "finished",
            status: coreResult.status,
            error: coreResult.error,
            summary: coreResult.summary,
            delivered: coreResult.delivered,
            deliveryStatus: job.state.lastDeliveryStatus,
            deliveryError: job.state.lastDeliveryError,
            sessionId: coreResult.sessionId,
            sessionKey: coreResult.sessionKey,
            runAtMs: startedAt,
            durationMs: job.state.lastDurationMs,
            nextRunAtMs: job.state.nextRunAtMs,
            model: coreResult.model,
            provider: coreResult.provider,
            usage: coreResult.usage,
        });
        if (shouldDelete && state.store) {
            state.store.jobs = state.store.jobs.filter((entry) => entry.id !== job.id);
            emit(state, { jobId: job.id, action: "removed" });
        }
        // Manual runs should not advance other due jobs without executing them.
        // Use maintenance-only recompute to repair missing values while
        // preserving existing past-due nextRunAtMs entries for future timer ticks.
        recomputeNextRunsForMaintenance(state);
        await persist(state);
        armTimer(state);
    });
    return { ok: true, ran: true };
}
export function wakeNow(state, opts) {
    return wake(state, opts);
}
//# sourceMappingURL=ops.js.map