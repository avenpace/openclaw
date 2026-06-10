// Public library facade for consumers embedding OpenClaw reply runtime APIs.
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./agents/defaults.js";
import { runEmbeddedAgent as runEmbeddedPiAgent } from "./agents/embedded-agent-runner/run.js";
import { loadModelCatalog, type ModelCatalogEntry } from "./agents/model-catalog.js";
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
import { resolveStorePath } from "./config/sessions/paths.js";
import { deriveSessionKey, resolveSessionKey } from "./config/sessions/session-key.js";
import { loadSessionStore, saveSessionStore, updateLastRoute } from "./config/sessions/store.js";
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
import { normalizeGoogleModelId } from "./plugin-sdk/google-model-id.js";
import { loadOpenClawPlugins } from "./plugins/loader.js";
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
import {
  maybeApplyTtsToPayload,
  textToSpeech,
  resolveTtsConfig,
  type TtsResult,
} from "./tts/tts.js";
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

let replyRuntimePromise: Promise<typeof import("./auto-reply/reply.runtime.js")> | null = null;
let promptRuntimePromise: Promise<typeof import("./cli/prompt.js")> | null = null;
let binariesRuntimePromise: Promise<typeof import("./infra/binaries.js")> | null = null;
let execRuntimePromise: Promise<typeof import("./process/exec.js")> | null = null;
let webChannelRuntimePromise: Promise<
  typeof import("./plugins/runtime/runtime-web-channel-plugin.js")
> | null = null;

function loadReplyRuntime() {
  replyRuntimePromise ??= import("./auto-reply/reply.runtime.js");
  return replyRuntimePromise;
}

function loadPromptRuntime() {
  promptRuntimePromise ??= import("./cli/prompt.js");
  return promptRuntimePromise;
}

function loadBinariesRuntime() {
  binariesRuntimePromise ??= import("./infra/binaries.js");
  return binariesRuntimePromise;
}

function loadExecRuntime() {
  execRuntimePromise ??= import("./process/exec.js");
  return execRuntimePromise;
}

function loadWebChannelRuntime() {
  webChannelRuntimePromise ??= import("./plugins/runtime/runtime-web-channel-plugin.js");
  return webChannelRuntimePromise;
}

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
  loadSessionStore,
  // Platform: channel monitors loaded dynamically from extensions
  monitorTelegramProvider,
  normalizeE164,
  PortInUseError,
  resolveSessionKey,
  resolveStorePath,
  runEmbeddedPiAgent,
  saveSessionStore,
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
