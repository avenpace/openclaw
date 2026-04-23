import type { getReplyFromConfig as getReplyFromConfigRuntime } from "./auto-reply/reply.runtime.js";
import { applyTemplate } from "./auto-reply/templating.js";
import { createDefaultDeps } from "./cli/deps.js";
import type { promptYesNo as promptYesNoRuntime } from "./cli/prompt.js";
import { waitForever } from "./cli/wait.js";
import { loadConfig, clearConfigCache } from "./config/config.js";
import { setConfigOverride, getConfigOverrides } from "./config/runtime-overrides.js";
import { resolveStorePath } from "./config/sessions/paths.js";
import { deriveSessionKey, resolveSessionKey } from "./config/sessions/session-key.js";
import { loadSessionStore, saveSessionStore, updateLastRoute } from "./config/sessions/store.js";
import type { ensureBinary as ensureBinaryRuntime } from "./infra/binaries.js";
import {
  describePortOwner,
  ensurePortAvailable,
  handlePortError,
  PortInUseError,
} from "./infra/ports.js";
import type { monitorWebChannel as monitorWebChannelRuntime } from "./plugins/runtime/runtime-web-channel-plugin.js";
import type {
  runCommandWithTimeout as runCommandWithTimeoutRuntime,
  runExec as runExecRuntime,
} from "./process/exec.js";
import { normalizeE164 } from "./utils.js";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./agents/defaults.js";
import { loadModelCatalog, type ModelCatalogEntry } from "./agents/model-catalog.js";
import { normalizeProviderId, normalizeModelRef, type ModelRef } from "./agents/model-selection.js";
import { ensureOpenClawModelsJson } from "./agents/models-config.js";
import { normalizeGoogleModelId } from "./agents/models-config.providers.js";
import { runEmbeddedPiAgent } from "./agents/pi-embedded.js";
import { buildWorkspaceSkillStatus } from "./agents/skills-status.js";
import type { DevicesHandler } from "./agents/tools/devices-tool.js";
import type { HermesMemoryHandler } from "./agents/tools/hermes-memory-tool.js";
import type { HermesSkillsHandler } from "./agents/tools/hermes-skills-tool.js";
import type { MsgContext } from "./auto-reply/templating.js";
import type { ReplyPayload } from "./auto-reply/types.js";
import { startGatewayServer } from "./gateway/server.js";
import { applyMediaUnderstanding } from "./media-understanding/apply.js";
import { transcribeFirstAudio } from "./media-understanding/audio-preflight.js";
import { loadOpenClawPlugins } from "./plugins/loader.js";
import { monitorTelegramProvider } from "./telegram/monitor.js";
import {
  maybeApplyTtsToPayload,
  textToSpeech,
  resolveTtsConfig,
  type TtsResult,
} from "./tts/tts.js";
import type { WebChannelStatus } from "./web/auto-reply/types.js";
import { monitorWebInbox } from "./web/inbound/monitor.js";
import {
  startWebLoginWithQr,
  startWebLoginWithCode,
  waitForWebLogin,
  getCodePairingStatus,
} from "./web/login-qr.js";
import { sendMessageWhatsApp } from "./web/outbound.js";

type GetReplyFromConfig = typeof getReplyFromConfigRuntime;
type PromptYesNo = typeof promptYesNoRuntime;
type EnsureBinary = typeof ensureBinaryRuntime;
type RunExec = typeof runExecRuntime;
type RunCommandWithTimeout = typeof runCommandWithTimeoutRuntime;
type MonitorWebChannel = typeof monitorWebChannelRuntime;

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

export {
  applyTemplate,
  buildWorkspaceSkillStatus,
  clearConfigCache,
  createDefaultDeps,
  deriveSessionKey,
  describePortOwner,
  ensureBinary,
  ensureOpenClawModelsJson,
  ensurePortAvailable,
  getReplyFromConfig,
  handlePortError,
  loadConfig,
  loadModelCatalog,
  loadSessionStore,
  monitorWebChannel,
  monitorWebInbox,
  monitorTelegramProvider,
  normalizeE164,
  PortInUseError,
  promptYesNo,
  resolveSessionKey,
  resolveStorePath,
  runCommandWithTimeout,
  runEmbeddedPiAgent,
  runExec,
  saveSessionStore,
  sendMessageWhatsApp,
  setConfigOverride,
  getConfigOverrides,
  startGatewayServer,
  startWebLoginWithQr,
  startWebLoginWithCode,
  toWhatsappJid,
  transcribeFirstAudio,
  applyMediaUnderstanding,
  updateLastRoute,
  waitForever,
  waitForWebLogin,
  getCodePairingStatus,
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
  WebChannelStatus,
  ModelCatalogEntry,
  DevicesHandler,
  HermesMemoryHandler,
  HermesSkillsHandler,
  ModelRef,
  TtsResult,
};
