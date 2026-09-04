import { registerResolvedAgentDir } from "./agents/agent-dir-registry.js";
import { saveAuthProfileStore } from "./agents/auth-profiles/store.js";
// Public library facade for consumers embedding OpenClaw reply runtime APIs.
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./agents/defaults.js";
import { runEmbeddedAgent as runEmbeddedPiAgent } from "./agents/embedded-agent-runner/run.js";
import { loadModelCatalog } from "./plugin-sdk/agent-runtime.js";
import type { ModelCatalogEntry } from "./agents/model-catalog.js";
import { normalizeProviderId, normalizeModelRef, type ModelRef } from "./agents/model-selection.js";
import { ensureOpenClawModelsJson } from "./agents/models-config.js";
import type { DevicesHandler } from "./agents/tools/devices-tool.js";
import type { HermesMemoryHandler } from "./agents/tools/hermes-memory-tool.js";
import type { HermesSkillsHandler } from "./agents/tools/hermes-skills-tool.js";
import type { getReplyFromConfig as getReplyFromConfigRuntime } from "./auto-reply/reply.runtime.js";
import { applyTemplate } from "./auto-reply/templating.js";
import type { MsgContext } from "./auto-reply/templating.js";
import type { ReplyPayload } from "./auto-reply/types.js";
import { createDefaultDeps } from "./cli/deps.js";
import type { promptYesNo as promptYesNoRuntime } from "./cli/prompt.js";
import { waitForever } from "./cli/wait.js";
import { loadConfig, clearConfigCache } from "./config/config.js";
import { setConfigOverride, getConfigOverrides } from "./config/runtime-overrides.js";
import { resolveSessionStorePathCore } from "./config/sessions/paths.js";
import { deriveSessionKey, resolveSessionKey } from "./config/sessions/session-key.js";
// Clawku: upstream moved session store to SQLite; legacy load/save come from the
// legacy-session-store module (re-exported below), route updates from the accessor.
import { updateSessionLastRoute as updateLastRoute } from "./config/sessions/inbound.runtime.js";
import { startGatewayServer } from "./gateway/server.js";
import type { ensureBinary as ensureBinaryRuntime } from "./infra/binaries.js";
import {
  describePortOwner,
  ensurePortAvailable,
  handlePortError,
  PortInUseError,
} from "./infra/ports.js";
import { applyMediaUnderstanding } from "./media-understanding/apply.js";
import { transcribeFirstAudio } from "./media-understanding/audio-preflight.js";
import { normalizeGoogleModelId } from "./plugin-sdk/image-generation-core.js";
import { loadOpenClawPlugins } from "./plugins/loader.js";
import {
  saveLegacySessionStore,
  type LegacySessionStoreSaveOptions,
} from "./infra/state-migrations.legacy-session-store.js";
import type {
  monitorWebChannel as monitorWebChannelRuntime,
  monitorWebInbox as monitorWebInboxRuntime,
  startWebLoginWithQr as startWebLoginWithQrRuntime,
  waitForWebLogin as waitForWebLoginRuntime,
} from "./plugins/runtime/runtime-web-channel-plugin.js";
import type {
  runCommandWithTimeout as runCommandWithTimeoutRuntime,
  runExec as runExecRuntime,
} from "./process/exec.js";
import { buildWorkspaceSkillStatus } from "./skills/discovery/status.js";
import { maybeApplyTtsToPayload, textToSpeech, resolveTtsConfig } from "./tts/tts.js";
import type { TtsResult } from "./tts/tts-runtime-types.js";
import { createLazyRuntimeModule } from "./shared/lazy-runtime.js";
import { normalizeE164 } from "./utils.js";

// Clawku platform: channel-specific exports are loaded dynamically from extensions.
// These lazy loaders avoid broken imports when the old src/ shim files are removed by upstream.
async function loadTelegramExtension() {
  return import("../extensions/telegram/runtime-api.js");
}
async function loadWhatsAppExtension() {
  return import("../extensions/whatsapp/runtime-api.js");
}

const monitorTelegramProvider: (...args: unknown[]) => Promise<void> = async (...args) => {
  const ext = await loadTelegramExtension();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ext as any).monitorTelegramProvider(...args);
};

const sendMessageWhatsApp: (...args: unknown[]) => Promise<unknown> = async (...args) => {
  const ext = await loadWhatsAppExtension();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ext as any).sendMessageWhatsApp(...args);
};

type GetReplyFromConfig = typeof getReplyFromConfigRuntime;
type PromptYesNo = typeof promptYesNoRuntime;
type EnsureBinary = typeof ensureBinaryRuntime;
type RunExec = typeof runExecRuntime;
type RunCommandWithTimeout = typeof runCommandWithTimeoutRuntime;
type MonitorWebChannel = typeof monitorWebChannelRuntime;
type MonitorWebInbox = typeof monitorWebInboxRuntime;
type StartWebLoginWithQr = typeof startWebLoginWithQrRuntime;
type WaitForWebLogin = typeof waitForWebLoginRuntime;

const loadReplyRuntime = createLazyRuntimeModule(() => import("./auto-reply/reply.runtime.js"));
const loadPromptRuntime = createLazyRuntimeModule(() => import("./cli/prompt.js"));
const loadBinariesRuntime = createLazyRuntimeModule(() => import("./infra/binaries.js"));
const loadExecRuntime = createLazyRuntimeModule(() => import("./process/exec.js"));
const loadWebChannelRuntime = createLazyRuntimeModule(
  () => import("./plugins/runtime/runtime-web-channel-plugin.js"),
);

export const getReplyFromConfig: GetReplyFromConfig = async (...args) =>
  (await loadReplyRuntime()).getReplyFromConfig(...args);
export const promptYesNo: PromptYesNo = async (...args) =>
  (await loadPromptRuntime()).promptYesNo(...args);
export const ensureBinary: EnsureBinary = async (...args) =>
  (await loadBinariesRuntime()).ensureBinary(...args);
export const runExec: RunExec = async (...args) => (await loadExecRuntime()).runExec(...args);
export const runCommandWithTimeout: RunCommandWithTimeout = async (...args) =>
  (await loadExecRuntime()).runCommandWithTimeout(...args);
export const monitorWebChannel: MonitorWebChannel = async (...args) =>
  (await loadWebChannelRuntime()).monitorWebChannel(...args);
export const monitorWebInbox: MonitorWebInbox = async (...args) =>
  (await loadWebChannelRuntime()).monitorWebInbox(...args);
export const startWebLoginWithQr: StartWebLoginWithQr = async (...args) =>
  (await loadWebChannelRuntime()).startWebLoginWithQr(...args);
export const startWebLoginWithCode: (...args: unknown[]) => Promise<unknown> = async (...args) => {
  const rt = await loadWebChannelRuntime();
  const fn = (rt as Record<string, unknown>).startWebLoginWithCode;
  if (typeof fn === "function") {
    return fn(...args);
  }
  return undefined as unknown as Promise<unknown>;
};
export const waitForWebLogin: WaitForWebLogin = async (...args) =>
  (await loadWebChannelRuntime()).waitForWebLogin(...args);

export { loadLegacySessionStore as loadSessionStore } from "./infra/state-migrations.legacy-session-store.js";

/**
 * @deprecated Legacy sessions.json compatibility for package-root consumers.
 * Use SQLite-backed session APIs. Remove after 2026-10-12, once the v2026.7.x
 * upgrade window no longer requires the legacy doctor importer.
 */
export async function saveSessionStore(
  storePath: string,
  store: Parameters<typeof saveLegacySessionStore>[1],
  options?: LegacySessionStoreSaveOptions,
): Promise<void> {
  await saveLegacySessionStore(storePath, store, options);
}

export {
  applyTemplate,
  buildWorkspaceSkillStatus,
  clearConfigCache,
  createDefaultDeps,
  deriveSessionKey,
  describePortOwner,
  ensureOpenClawModelsJson,
  ensurePortAvailable,
  handlePortError,
  loadConfig,
  loadModelCatalog,
  // loadSessionStore + saveSessionStore already exported at their legacy declarations above.
  // Platform: channel monitors loaded dynamically from extensions
  monitorTelegramProvider,
  normalizeE164,
  PortInUseError,
  resolveSessionKey,
  resolveSessionStorePathCore as resolveStorePath,
  runEmbeddedPiAgent,
  registerResolvedAgentDir,
  saveAuthProfileStore,
  sendMessageWhatsApp,
  setConfigOverride,
  getConfigOverrides,
  startGatewayServer,
  transcribeFirstAudio,
  applyMediaUnderstanding,
  updateLastRoute,
  waitForever,
  // Model selection utilities
  normalizeGoogleModelId,
  normalizeProviderId,
  normalizeModelRef,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  // TTS (text-to-speech)
  maybeApplyTtsToPayload,
  textToSpeech,
  resolveTtsConfig,
  loadOpenClawPlugins,
};

// Export types for platform integration
export type {
  MsgContext,
  ReplyPayload,
  ModelCatalogEntry,
  DevicesHandler,
  HermesMemoryHandler,
  HermesSkillsHandler,
  ModelRef,
  TtsResult,
};
