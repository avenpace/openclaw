#!/usr/bin/env node
import process from "node:process";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./agents/defaults.js";
import { loadModelCatalog, type ModelCatalogEntry } from "./agents/model-catalog.js";
import { normalizeProviderId, normalizeModelRef, type ModelRef } from "./agents/model-selection.js";
import { ensureOpenClawModelsJson } from "./agents/models-config.js";
import { normalizeGoogleModelId } from "./agents/models-config.providers.js";
import { runEmbeddedPiAgent } from "./agents/pi-embedded.js";
import { buildWorkspaceSkillStatus } from "./agents/skills-status.js";
import type { DevicesHandler } from "./agents/tools/devices-tool.js";
import { getReplyFromConfig } from "./auto-reply/reply.js";
import type { MsgContext } from "./auto-reply/templating.js";
import { applyTemplate } from "./auto-reply/templating.js";
import type { ReplyPayload } from "./auto-reply/types.js";
import { monitorWebChannel } from "./channel-web.js";
import { createDefaultDeps } from "./cli/deps.js";
import { promptYesNo } from "./cli/prompt.js";
import { waitForever } from "./cli/wait.js";
import { loadConfig, clearConfigCache } from "./config/config.js";
import { setConfigOverride } from "./config/runtime-overrides.js";
import {
  deriveSessionKey,
  loadSessionStore,
  resolveSessionKey,
  resolveStorePath,
  saveSessionStore,
  updateLastRoute,
} from "./config/sessions.js";
import { startGatewayServer } from "./gateway/server.js";
import { ensureBinary } from "./infra/binaries.js";
import { loadDotEnv } from "./infra/dotenv.js";
import { normalizeEnv } from "./infra/env.js";
import { formatUncaughtError } from "./infra/errors.js";
import { isMainModule } from "./infra/is-main.js";
import { ensureOpenClawCliOnPath } from "./infra/path-env.js";
import {
  describePortOwner,
  ensurePortAvailable,
  handlePortError,
  PortInUseError,
} from "./infra/ports.js";
import { assertSupportedRuntime } from "./infra/runtime-guard.js";
import { installUnhandledRejectionHandler } from "./infra/unhandled-rejections.js";
import { enableConsoleCapture } from "./logging.js";
import { applyMediaUnderstanding } from "./media-understanding/apply.js";
import { transcribeFirstAudio } from "./media-understanding/audio-preflight.js";
import { runCommandWithTimeout, runExec } from "./process/exec.js";
import { monitorTelegramProvider } from "./telegram/monitor.js";
import {
  maybeApplyTtsToPayload,
  textToSpeech,
  resolveTtsConfig,
  type TtsResult,
} from "./tts/tts.js";
import { assertWebChannel, normalizeE164, toWhatsappJid } from "./utils.js";
import type { WebChannelStatus } from "./web/auto-reply/types.js";
import { monitorWebInbox } from "./web/inbound/monitor.js";
import {
  startWebLoginWithQr,
  startWebLoginWithCode,
  waitForWebLogin,
  getCodePairingStatus,
} from "./web/login-qr.js";
import { sendMessageWhatsApp } from "./web/outbound.js";

loadDotEnv({ quiet: true });
normalizeEnv();
ensureOpenClawCliOnPath();

// Capture all console output into structured logs while keeping stdout/stderr behavior.
enableConsoleCapture();

// Enforce the minimum supported runtime before doing any work.
assertSupportedRuntime();

import { buildProgram } from "./cli/program.js";

const program = buildProgram();

export {
  assertWebChannel,
  applyTemplate,
  buildWorkspaceSkillStatus,
  clearConfigCache,
  createDefaultDeps,
  ensureOpenClawModelsJson,
  loadModelCatalog,
  deriveSessionKey,
  describePortOwner,
  ensureBinary,
  ensurePortAvailable,
  getReplyFromConfig,
  handlePortError,
  loadConfig,
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
  runExec,
  runEmbeddedPiAgent,
  saveSessionStore,
  sendMessageWhatsApp,
  setConfigOverride,
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
};

// Re-export types for platform integration
export type {
  MsgContext,
  ReplyPayload,
  WebChannelStatus,
  ModelCatalogEntry,
  DevicesHandler,
  ModelRef,
  TtsResult,
};

const isMain = isMainModule({
  currentFile: fileURLToPath(import.meta.url),
});

if (isMain) {
  // Global error handlers to prevent silent crashes from unhandled rejections/exceptions.
  // These log the error and exit gracefully instead of crashing without trace.
  installUnhandledRejectionHandler();

  process.on("uncaughtException", (error) => {
    console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
    process.exit(1);
  });

  void program.parseAsync(process.argv).catch((err) => {
    console.error("[openclaw] CLI failed:", formatUncaughtError(err));
    process.exit(1);
  });
}
