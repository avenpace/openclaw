import type { OpenClawConfig } from "../config/config.js";
import { normalizeAgentId, parseAgentSessionKey } from "../routing/session-key.js";
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
  workspaceDir?: string;
  /** Working directory offset relative to workspaceDir (e.g., "websites/my-project") */
  cwd?: string;
  // Platform: inherited skill count for exec gating
  installedSkillCount?: number;
};

export type NormalizedSpawnedRunMetadata = {
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

function normalizeOptionalText(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

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
    spawnedBy: normalizeOptionalText(value?.spawnedBy),
    groupId: normalizeOptionalText(value?.groupId),
    groupChannel: normalizeOptionalText(value?.groupChannel),
    groupSpace: normalizeOptionalText(value?.groupSpace),
    workspaceDir: normalizeOptionalText(value?.workspaceDir),
    cwd: normalizeOptionalText(value?.cwd),
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
    groupId: normalizeOptionalText(value?.agentGroupId),
    groupChannel: normalizeOptionalText(value?.agentGroupChannel),
    groupSpace: normalizeOptionalText(value?.agentGroupSpace),
    workspaceDir: normalizeOptionalText(value?.workspaceDir),
    cwd: normalizeOptionalText(value?.cwd),
    installedSkillCount: normalizeOptionalNumber(value?.installedSkillCount),
  };
}

export function resolveSpawnedWorkspaceInheritance(params: {
  config: OpenClawConfig;
  requesterSessionKey?: string;
  explicitWorkspaceDir?: string | null;
}): string | undefined {
  const explicit = normalizeOptionalText(params.explicitWorkspaceDir);
  if (explicit) {
    return explicit;
  }
  const requesterAgentId = params.requesterSessionKey
    ? parseAgentSessionKey(params.requesterSessionKey)?.agentId
    : undefined;
  return requesterAgentId
    ? resolveAgentWorkspaceDir(params.config, normalizeAgentId(requesterAgentId))
    : undefined;
}

export function resolveIngressWorkspaceOverrideForSpawnedRun(
  metadata?: Pick<SpawnedRunMetadata, "spawnedBy" | "workspaceDir"> | null,
): string | undefined {
  const normalized = normalizeSpawnedRunMetadata(metadata);
  return normalized.spawnedBy ? normalized.workspaceDir : undefined;
}
