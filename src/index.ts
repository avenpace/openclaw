#!/usr/bin/env node
// Re-exports the OpenClaw CLI entry point for package execution.
// Package executable entrypoint that forwards to the CLI bootstrap.
import process from "node:process";
import { fileURLToPath } from "node:url";
import { formatCliFailureLines } from "./cli/failure-output.js";
import { formatUncaughtError } from "./infra/errors.js";
import { runFatalErrorHooks } from "./infra/fatal-error-hooks.js";
import { isMainModule } from "./infra/is-main.js";
import {
  installUnhandledRejectionHandler,
  isBenignUncaughtExceptionError,
  isUncaughtExceptionHandled,
} from "./infra/unhandled-rejections.js";

type LegacyCliDeps = {
  runCli: (argv: string[]) => Promise<void>;
};

type LibraryExports = typeof import("./library.js");

// These bindings are populated only for library consumers. The CLI entry stays
// on the lean path and must not read them while running as main.
export let applyTemplate: LibraryExports["applyTemplate"];
export let buildWorkspaceSkillStatus: LibraryExports["buildWorkspaceSkillStatus"];
export let clearConfigCache: LibraryExports["clearConfigCache"];
export let createDefaultDeps: LibraryExports["createDefaultDeps"];
export let ensureOpenClawModelsJson: LibraryExports["ensureOpenClawModelsJson"];
export let loadModelCatalog: LibraryExports["loadModelCatalog"];
export let deriveSessionKey: LibraryExports["deriveSessionKey"];
export let describePortOwner: LibraryExports["describePortOwner"];
export let ensureBinary: LibraryExports["ensureBinary"];
export let ensurePortAvailable: LibraryExports["ensurePortAvailable"];
export let getReplyFromConfig: LibraryExports["getReplyFromConfig"];
export let handlePortError: LibraryExports["handlePortError"];
export let loadConfig: LibraryExports["loadConfig"];
export let loadSessionStore: LibraryExports["loadSessionStore"];
export let monitorWebChannel: LibraryExports["monitorWebChannel"];
export let monitorWebInbox: LibraryExports["monitorWebInbox"];
export let startWebLoginWithQr: LibraryExports["startWebLoginWithQr"];
export let startWebLoginWithCode: LibraryExports["startWebLoginWithCode"];
export let waitForWebLogin: LibraryExports["waitForWebLogin"];
export let monitorTelegramProvider: LibraryExports["monitorTelegramProvider"];
export let normalizeE164: LibraryExports["normalizeE164"];
export let PortInUseError: LibraryExports["PortInUseError"];
export let promptYesNo: LibraryExports["promptYesNo"];
export let resolveSessionKey: LibraryExports["resolveSessionKey"];
export let resolveStorePath: LibraryExports["resolveStorePath"];
export let runCommandWithTimeout: LibraryExports["runCommandWithTimeout"];
export let runExec: LibraryExports["runExec"];
export let runEmbeddedPiAgent: LibraryExports["runEmbeddedPiAgent"];
export let loadOpenClawPlugins: LibraryExports["loadOpenClawPlugins"];
export let saveSessionStore: LibraryExports["saveSessionStore"];
export let sendMessageWhatsApp: LibraryExports["sendMessageWhatsApp"];
export let setConfigOverride: LibraryExports["setConfigOverride"];
export let getConfigOverrides: LibraryExports["getConfigOverrides"];
export let startGatewayServer: LibraryExports["startGatewayServer"];
export let transcribeFirstAudio: LibraryExports["transcribeFirstAudio"];
export let applyMediaUnderstanding: LibraryExports["applyMediaUnderstanding"];
export let updateLastRoute: LibraryExports["updateLastRoute"];
export let waitForever: LibraryExports["waitForever"];
export let normalizeGoogleModelId: LibraryExports["normalizeGoogleModelId"];
export let normalizeProviderId: LibraryExports["normalizeProviderId"];
export let normalizeModelRef: LibraryExports["normalizeModelRef"];
export let DEFAULT_MODEL: LibraryExports["DEFAULT_MODEL"];
export let DEFAULT_PROVIDER: LibraryExports["DEFAULT_PROVIDER"];
export let maybeApplyTtsToPayload: LibraryExports["maybeApplyTtsToPayload"];
export let textToSpeech: LibraryExports["textToSpeech"];
export let resolveTtsConfig: LibraryExports["resolveTtsConfig"];

async function loadLegacyCliDeps(): Promise<LegacyCliDeps> {
  const { runCli } = await import("./cli/run-main.js");
  return { runCli };
}

// Legacy direct file entrypoint only. Package root exports now live in library.ts.
export async function runLegacyCliEntry(
  argv: string[] = process.argv,
  deps?: LegacyCliDeps,
): Promise<void> {
  const { runCli } = deps ?? (await loadLegacyCliDeps());
  await runCli(argv);
}

const isMain = isMainModule({
  currentFile: fileURLToPath(import.meta.url),
});

if (!isMain) {
  ({
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
    startWebLoginWithQr,
    startWebLoginWithCode,
    waitForWebLogin,
    monitorTelegramProvider,
    normalizeE164,
    PortInUseError,
    promptYesNo,
    resolveSessionKey,
    resolveStorePath,
    runCommandWithTimeout,
    runExec,
    runEmbeddedPiAgent,
    loadOpenClawPlugins,
    saveSessionStore,
    sendMessageWhatsApp,
    setConfigOverride,
    getConfigOverrides,
    startGatewayServer,
    transcribeFirstAudio,
    applyMediaUnderstanding,
    updateLastRoute,
    waitForever,
    normalizeGoogleModelId,
    normalizeProviderId,
    normalizeModelRef,
    DEFAULT_MODEL,
    DEFAULT_PROVIDER,
    maybeApplyTtsToPayload,
    textToSpeech,
    resolveTtsConfig,
  } = await import("./library.js"));
}

// Re-export types for platform integration
export type { MsgContext } from "./auto-reply/templating.js";
export type { ReplyPayload } from "./auto-reply/types.js";
export type { ModelCatalogEntry } from "./agents/model-catalog.js";
export type { DevicesHandler } from "./agents/tools/devices-tool.js";
export type { HermesMemoryHandler } from "./agents/tools/hermes-memory-tool.js";
export type { HermesSkillsHandler } from "./agents/tools/hermes-skills-tool.js";
export type { ModelRef } from "./agents/model-selection.js";
export type { TtsResult } from "./tts/tts.js";

if (isMain) {
  const { restoreTerminalState } = await import("../packages/terminal-core/src/restore.js");

  // Global error handlers to prevent silent crashes from unhandled rejections/exceptions.
  // These log the error and exit gracefully instead of crashing without trace.
  installUnhandledRejectionHandler();

  process.on("uncaughtException", (error) => {
    if (isUncaughtExceptionHandled(error)) {
      return;
    }
    if (isBenignUncaughtExceptionError(error)) {
      console.warn(
        "[openclaw] Non-fatal uncaught exception (continuing):",
        formatUncaughtError(error),
      );
      return;
    }
    for (const line of formatCliFailureLines({
      title: "OpenClaw hit an unexpected runtime error.",
      error,
      argv: process.argv,
    })) {
      console.error(line);
    }
    for (const message of runFatalErrorHooks({ reason: "uncaught_exception", error })) {
      console.error("[openclaw]", message);
    }
    restoreTerminalState("uncaught exception", { resumeStdinIfPaused: false });
    process.exit(1);
  });

  void runLegacyCliEntry(process.argv).catch((err: unknown) => {
    for (const line of formatCliFailureLines({
      title: "The CLI command failed.",
      error: err,
      argv: process.argv,
    })) {
      console.error(line);
    }
    for (const message of runFatalErrorHooks({ reason: "legacy_cli_failure", error: err })) {
      console.error("[openclaw]", message);
    }
    restoreTerminalState("legacy cli failure", { resumeStdinIfPaused: false });
    process.exit(1);
  });
}
