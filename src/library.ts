// Public library facade for consumers embedding OpenClaw reply runtime APIs.
import type { getReplyFromConfig as getReplyFromConfigRuntime } from "./auto-reply/reply.runtime.js";
import "./auto-reply/templating.js";
import "./cli/deps.js";
import type { promptYesNo as promptYesNoRuntime } from "./cli/prompt.js";
import "./cli/wait.js";
import "./config/config.js";
import "./config/sessions/paths.js";
import "./config/sessions/session-key.js";
import type { ensureBinary as ensureBinaryRuntime } from "./infra/binaries.js";
import "./infra/ports.js";
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
import { createLazyRuntimeModule } from "./shared/lazy-runtime.js";
export { applyTemplate } from "./auto-reply/templating.js";
export { createDefaultDeps } from "./cli/deps.js";
export { waitForever } from "./cli/wait.js";
export { loadConfig } from "./config/config.js";
export { resolveSessionStorePathCore as resolveStorePath } from "./config/sessions/paths.js";
export { deriveSessionKey, resolveSessionKey } from "./config/sessions/session-key.js";
export {
  describePortOwner,
  ensurePortAvailable,
  handlePortError,
  PortInUseError,
} from "./infra/ports.js";
export { normalizeE164 } from "./utils.js";

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

export const getReplyFromConfig: GetReplyFromConfig = async (...args) =>
  (await loadReplyRuntime()).getReplyFromConfig(...args);
export const promptYesNo: PromptYesNo = async (...args) =>
  (await loadPromptRuntime()).promptYesNo(...args);
export const ensureBinary: EnsureBinary = async (...args) =>
  (await loadBinariesRuntime()).ensureBinary(...args);
export const runExec: RunExec = async (...args) => (await loadExecRuntime()).runExec(...args);
export const runCommandWithTimeout: RunCommandWithTimeout = async (...args) =>
  (await loadExecRuntime()).runCommandWithTimeout(...args);
// Clawku: platform-api drives WhatsApp itself with the gateway's WhatsApp plugin disabled, so the
// gateway-registry facade (runtime-web-channel-plugin) never sees it. Call the core-bundled
// WhatsApp runtime directly.
type WhatsAppRuntimeFn = (...args: unknown[]) => unknown;
type WhatsAppRuntimeApi = {
  monitorWebChannel: WhatsAppRuntimeFn;
  monitorWebInbox: WhatsAppRuntimeFn;
  startWebLoginWithQr: WhatsAppRuntimeFn;
  startWebLoginWithCode: WhatsAppRuntimeFn;
  waitForWebLogin: WhatsAppRuntimeFn;
};
async function loadWhatsAppRuntimeApi(): Promise<WhatsAppRuntimeApi> {
  const mod = (await loadWhatsAppExtension()) as unknown as Record<string, unknown>;
  return new Proxy({} as WhatsAppRuntimeApi, {
    get: (_target, name) => {
      if (name === "then" || typeof name === "symbol") {
        return undefined; // keep the proxy from looking like a thenable when awaited
      }
      const fn = mod[name as string];
      if (typeof fn !== "function") {
        throw new Error(`WhatsApp runtime does not export ${String(name)}`);
      }
      return fn as WhatsAppRuntimeFn;
    },
  });
}
export const monitorWebChannel: MonitorWebChannel = async (...args) =>
  (await loadWhatsAppRuntimeApi()).monitorWebChannel(...args) as ReturnType<MonitorWebChannel>;
export const monitorWebInbox: MonitorWebInbox = async (...args) =>
  (await loadWhatsAppRuntimeApi()).monitorWebInbox(...args) as ReturnType<MonitorWebInbox>;
export const startWebLoginWithQr: StartWebLoginWithQr = async (...args) =>
  (await loadWhatsAppRuntimeApi()).startWebLoginWithQr(...args) as ReturnType<StartWebLoginWithQr>;
export const startWebLoginWithCode: (...args: unknown[]) => Promise<unknown> = async (...args) => {
  const rt = await loadWhatsAppRuntimeApi();
  const fn = (rt as Record<string, unknown>).startWebLoginWithCode;
  if (typeof fn === "function") {
    return fn(...args);
  }
  return undefined;
};
export const waitForWebLogin: WaitForWebLogin = async (...args) =>
  (await loadWhatsAppRuntimeApi()).waitForWebLogin(...args) as ReturnType<WaitForWebLogin>;

// ---------------------------------------------------------------------------
// Clawku platform exports. platform-api embeds OpenClaw as a library and drives
// per-persona agent runs, channel monitors, auth and model selection directly.
// ---------------------------------------------------------------------------
export { registerResolvedAgentDir } from "./agents/agent-dir-registry.js";
export { saveAuthProfileStore } from "./agents/auth-profiles/store-runtime.js";
export { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./agents/defaults.js";
export { runEmbeddedAgent as runEmbeddedPiAgent } from "./agents/embedded-agent-runner/run.js";
export { normalizeProviderId, normalizeModelRef } from "./agents/model-selection.js";
export { ensureOpenClawModelsJson } from "./agents/models-config.js";
export { clearConfigCache } from "./config/config.js";
export { setConfigOverride, getConfigOverrides } from "./config/runtime-overrides.js";
export { updateSessionLastRoute as updateLastRoute } from "./config/sessions/inbound.runtime.js";
export { startGatewayServer } from "./gateway/server.js";
export { applyMediaUnderstanding } from "./media-understanding/apply.js";
export { transcribeFirstAudio } from "./media-understanding/audio-preflight.js";
export { loadModelCatalog } from "./plugin-sdk/agent-runtime.js";
export { normalizeGooglePreviewModelId as normalizeGoogleModelId } from "./plugin-sdk/model-ref-parse.js";
export { loadOpenClawPlugins } from "./plugins/loader.js";
export { buildWorkspaceSkillStatus } from "./skills/discovery/status.js";
export { maybeApplyTtsToPayload, textToSpeech, resolveTtsConfig } from "./tts/tts.js";
export { loadLegacySessionStore as loadSessionStore } from "./infra/state-migrations.legacy-session-store.js";
// platform-api publishes a single persona's configured owner instead of a whole-config refresh,
// to avoid thrashing the shared multi-tenant model catalog.
export {
  publishPreparedModelRuntimeSnapshot,
  refreshPreparedModelRuntimeSnapshots,
} from "./agents/prepared-model-runtime.js";
export { listConfiguredOwnerInputs } from "./agents/prepared-model-runtime.configured.js";
// The API calls the embedded runner directly, so it prepares each run's admission itself.
export {
  createOperationalRunInstanceRef,
  prepareAgentRunAdmission,
} from "./agents/admitted-run-context.js";
// The API drives the Anthropic sign-in itself (session-backed callbacks).
export { loginAnthropic } from "./llm/utils/oauth/anthropic.js";

// Clawku platform: platform-api runs its own per-persona channel monitors. In v2026.10.9 each
// plugin owns a module instance (its runtime proxy, keyed stores and ingress queues are injected
// there), so the platform must call the channel code inside that instance rather than a plain
// import, which sees "<Channel> runtime not initialized". platform-api hands the registry from
// its startup plugin load to activatePlatformChannelRuntimes; channel calls then resolve through
// the owning plugin instance, with a direct import as fallback.
type PlatformPluginRecord = { id: string; status?: string; rootDir?: string };
let platformChannelRegistry: { plugins?: PlatformPluginRecord[] } | undefined;

// Clawku: secrets the host keeps out of every exec child's environment.
export { setHostExecInheritedEnvDenylist } from "./infra/host-env-security.js";

export async function activatePlatformChannelRuntimes(registry?: unknown): Promise<string[]> {
  if (registry && typeof registry === "object") {
    platformChannelRegistry = registry as { plugins?: PlatformPluginRecord[] };
  }
  const active: string[] = [];
  for (const id of ["whatsapp", "telegram", "discord", "slack", "signal"]) {
    if (await loadPlatformChannelInstanceModule(id)) {
      active.push(id);
    }
  }
  return active;
}

async function loadPlatformChannelInstanceModule(
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const record = platformChannelRegistry?.plugins?.find(
    (entry) => entry.id === id && entry.status === "loaded",
  );
  if (!record?.rootDir) {
    return undefined;
  }
  const [{ getPluginInstance }, { default: path }] = await Promise.all([
    import("./plugins/plugin-instance-scope.js"),
    import("node:path"),
  ]);
  const instance = getPluginInstance(record as never);
  if (!instance) {
    return undefined;
  }
  const modulePath = path.join(record.rootDir, "runtime-api.js");
  if (instance.hasModuleSource?.(modulePath) === false) {
    return undefined;
  }
  try {
    return instance.loadModule(modulePath) as Record<string, unknown>;
  } catch (err) {
    console.warn(`[clawku] ${id} plugin instance module unavailable, using direct import:`, err);
    return undefined;
  }
}

async function loadTelegramExtension() {
  return (
    (await loadPlatformChannelInstanceModule("telegram")) ??
    (await import("../extensions/telegram/runtime-api.js"))
  );
}
async function loadWhatsAppExtension() {
  return (
    (await loadPlatformChannelInstanceModule("whatsapp")) ??
    (await import("../extensions/whatsapp/runtime-api.js"))
  );
}
async function loadDiscordExtension() {
  return (
    (await loadPlatformChannelInstanceModule("discord")) ??
    (await import("../extensions/discord/runtime-api.js"))
  );
}
export const monitorTelegramProvider: (...args: unknown[]) => Promise<void> = async (...args) => {
  const ext = await loadTelegramExtension();
  // oxlint-disable-next-line typescript/no-explicit-any
  return (ext as any).monitorTelegramProvider(...args);
};
// v2026.10.9 Discord monitors require a plugin service scheduler (the gateway passes its own
// to channel accounts it starts). Platform-run monitors get one shared host-clock scheduler.
let platformDiscordScheduler: unknown;
async function getPlatformServiceScheduler(): Promise<unknown> {
  if (!platformDiscordScheduler) {
    const [{ GatewayScheduler }, { createPluginServiceScheduler }] = await Promise.all([
      import("./infra/gateway-scheduler.js"),
      import("./plugins/service-scheduler.js"),
    ]);
    platformDiscordScheduler = createPluginServiceScheduler(new GatewayScheduler()).scheduler;
  }
  return platformDiscordScheduler;
}
export const monitorDiscordProvider: (...args: unknown[]) => Promise<void> = async (...args) => {
  const ext = await loadDiscordExtension();
  const [first, ...rest] = args;
  const opts = (first && typeof first === "object" ? first : {}) as Record<string, unknown>;
  const withScheduler = opts.scheduler
    ? opts
    : { ...opts, scheduler: await getPlatformServiceScheduler() };
  // oxlint-disable-next-line typescript/no-explicit-any
  return (ext as any).monitorDiscordProvider(withScheduler, ...rest);
};
export const sendMessageWhatsApp: (...args: unknown[]) => Promise<unknown> = async (...args) => {
  const ext = await loadWhatsAppExtension();
  // oxlint-disable-next-line typescript/no-explicit-any
  return (ext as any).sendMessageWhatsApp(...args);
};

export type { ModelCatalogEntry } from "./agents/model-catalog.js";
export type { ModelRef } from "./agents/model-selection.js";
export type { DevicesHandler } from "./agents/tools/devices-tool.js";
export type { HermesMemoryHandler } from "./agents/tools/hermes-memory-tool.js";
export type { HermesSkillsHandler } from "./agents/tools/hermes-skills-tool.js";
export type { MsgContext } from "./auto-reply/templating.js";
export type { ReplyPayload } from "./auto-reply/types.js";
export type { TtsResult } from "./tts/tts-runtime-types.js";
export type { PlatformToolsHandler, PlatformToolSpec } from "./agents/tools/platform-tools.js";
