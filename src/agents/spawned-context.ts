import type { OpenClawConfig } from "../config/types.openclaw.js";
import { normalizeAgentId, parseAgentSessionKey } from "../routing/session-key.js";
import { normalizeOptionalString } from "../shared/string-coerce.js";
import { resolveAgentWorkspaceDir } from "./agent-scope.js";

export type SpawnedRunMetadata = {
  spawnedBy?: string | null;
  groupId?: string | null;
  groupChannel?: string | null;
  groupSpace?: string | null;
  workspaceDir?: string | null;
  /** Working directory offset relative to workspaceDir (e.g., "websites/my-project") */
  cwd?: string | null;
  // Platform: inherited skill count for exec gating
  installedSkillCount?: number | null;
};

export type SpawnedToolContext = {
  agentGroupId?: string | null;
  agentGroupChannel?: string | null;
  agentGroupSpace?: string | null;
  agentMemberRoleIds?: string[];
  workspaceDir?: string;
  /** Working directory offset relative to workspaceDir (e.g., "websites/my-project") */
  cwd?: string;
  // Platform: inherited skill count for exec gating
  installedSkillCount?: number;
};

type NormalizedSpawnedRunMetadata = {
  spawnedBy?: string;
  groupId?: string;
  groupChannel?: string;
  groupSpace?: string;
  workspaceDir?: string;
  /** Working directory offset relative to workspaceDir (e.g., "websites/my-project") */
  cwd?: string;
  // Platform: inherited skill count for exec gating
  installedSkillCount?: number;
};

function normalizeOptionalNumber(value?: number | null): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

export function normalizeSpawnedRunMetadata(
  value?: SpawnedRunMetadata | null,
): NormalizedSpawnedRunMetadata {
  return {
    spawnedBy: normalizeOptionalString(value?.spawnedBy),
    groupId: normalizeOptionalString(value?.groupId),
    groupChannel: normalizeOptionalString(value?.groupChannel),
    groupSpace: normalizeOptionalString(value?.groupSpace),
    workspaceDir: normalizeOptionalString(value?.workspaceDir),
    cwd: normalizeOptionalString(value?.cwd),
    installedSkillCount: normalizeOptionalNumber(value?.installedSkillCount),
  };
}

export function mapToolContextToSpawnedRunMetadata(
  value?: SpawnedToolContext | null,
): Pick<
  NormalizedSpawnedRunMetadata,
  "groupId" | "groupChannel" | "groupSpace" | "workspaceDir" | "cwd" | "installedSkillCount"
> {
  return {
    groupId: normalizeOptionalString(value?.agentGroupId),
    groupChannel: normalizeOptionalString(value?.agentGroupChannel),
    groupSpace: normalizeOptionalString(value?.agentGroupSpace),
    workspaceDir: normalizeOptionalString(value?.workspaceDir),
    cwd: normalizeOptionalString(value?.cwd),
    installedSkillCount: normalizeOptionalNumber(value?.installedSkillCount),
  };
}

export function resolveSpawnedWorkspaceInheritance(params: {
  config: OpenClawConfig;
  targetAgentId?: string;
  requesterSessionKey?: string;
  explicitWorkspaceDir?: string | null;
}): string | undefined {
  const explicit = normalizeOptionalString(params.explicitWorkspaceDir);
  if (explicit) {
    return explicit;
  }
  // For cross-agent spawns, use the target agent's workspace instead of the requester's.
  const agentId =
    params.targetAgentId ??
    (params.requesterSessionKey
      ? parseAgentSessionKey(params.requesterSessionKey)?.agentId
      : undefined);
  return agentId ? resolveAgentWorkspaceDir(params.config, normalizeAgentId(agentId)) : undefined;
}

export function resolveIngressWorkspaceOverrideForSpawnedRun(
  metadata?: Pick<SpawnedRunMetadata, "spawnedBy" | "workspaceDir"> | null,
): string | undefined {
  const normalized = normalizeSpawnedRunMetadata(metadata);
  return normalized.spawnedBy ? normalized.workspaceDir : undefined;
}
