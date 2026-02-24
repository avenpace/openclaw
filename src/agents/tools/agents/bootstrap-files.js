import { applyBootstrapHookOverrides } from "./bootstrap-hooks.js";
import { buildBootstrapContextFiles, resolveBootstrapMaxChars, resolveBootstrapTotalMaxChars, } from "./pi-embedded-helpers.js";
import { filterBootstrapFilesForSession, loadWorkspaceBootstrapFiles, } from "./workspace.js";
export function makeBootstrapWarn(params) {
    if (!params.warn) {
        return undefined;
    }
    return (message) => params.warn?.(`${message} (sessionKey=${params.sessionLabel})`);
}
function sanitizeBootstrapFiles(files, warn) {
    const sanitized = [];
    for (const file of files) {
        const pathValue = typeof file.path === "string" ? file.path.trim() : "";
        if (!pathValue) {
            warn?.(`skipping bootstrap file "${file.name}" — missing or invalid "path" field (hook may have used "filePath" instead)`);
            continue;
        }
        sanitized.push({ ...file, path: pathValue });
    }
    return sanitized;
}
export async function resolveBootstrapFilesForRun(params) {
    const sessionKey = params.sessionKey ?? params.sessionId;
    const bootstrapFiles = filterBootstrapFilesForSession(await loadWorkspaceBootstrapFiles(params.workspaceDir), sessionKey);
    const updated = await applyBootstrapHookOverrides({
        files: bootstrapFiles,
        workspaceDir: params.workspaceDir,
        config: params.config,
        sessionKey: params.sessionKey,
        sessionId: params.sessionId,
        agentId: params.agentId,
    });
    return sanitizeBootstrapFiles(updated, params.warn);
}
export async function resolveBootstrapContextForRun(params) {
    const bootstrapFiles = await resolveBootstrapFilesForRun(params);
    const contextFiles = buildBootstrapContextFiles(bootstrapFiles, {
        maxChars: resolveBootstrapMaxChars(params.config),
        totalMaxChars: resolveBootstrapTotalMaxChars(params.config),
        warn: params.warn,
    });
    return { bootstrapFiles, contextFiles };
}
//# sourceMappingURL=bootstrap-files.js.map