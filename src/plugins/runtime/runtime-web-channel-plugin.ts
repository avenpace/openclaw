import { getRuntimeConfig } from "../../config/config.js";
import { loadFacadeModuleAtLocationSync } from "../../plugin-sdk/facade-loader.js";
import { shouldRejectHardlinkedPluginFiles } from "../hardlink-policy.js";
import { getPluginInstance } from "../plugin-instance-scope.js";
import { resolvePluginMetadataSnapshot } from "../plugin-metadata-snapshot.js";
import { resolvePluginRootPublicSurfacePath } from "../public-surface-runtime.js";
import { getPluginRegistryForContext } from "./gateway-request-scope.js";

function readColdPluginRecords() {
  let config;
  try {
    config = getRuntimeConfig();
  } catch {
    config = {};
  }
  return resolvePluginMetadataSnapshot({ config }).plugins;
}

type WebChannelRuntimeApi = {
  monitorWebChannel: (...args: unknown[]) => Promise<unknown>;
  // Clawku: the embedding platform also drives login and inbox through the same boundary.
  monitorWebInbox?: (...args: unknown[]) => Promise<unknown>;
  startWebLoginWithQr?: (...args: unknown[]) => Promise<unknown>;
  startWebLoginWithCode?: (...args: unknown[]) => Promise<unknown>;
  waitForWebLogin?: (...args: unknown[]) => Promise<unknown>;
  waitForWaConnection?: (sock: unknown, options: unknown) => Promise<void>;
};

/** Loads the web channel plugin's runtime API through the public-surface boundary. */
function loadWebChannelRuntimeApi(): WebChannelRuntimeApi {
  const registry = getPluginRegistryForContext();
  // An admitted runtime never falls back to installed bytes after disable or uninstall.
  const records = registry
    ? registry.plugins.filter((record) => record.status === "loaded")
    : readColdPluginRecords();
  const matches = records.flatMap((record) => {
    const pluginRoot = record.rootDir;
    if (!pluginRoot) {
      return [];
    }
    const resolve = (artifactBasename: string) =>
      resolvePluginRootPublicSurfacePath({
        pluginRoot,
        pluginId: record.id,
        entrySource: record.source,
        artifactBasename,
      });
    const modulePath = resolve("runtime-api.js");
    return modulePath && resolve("light-runtime-api.js")
      ? [{ record, modulePath, pluginRoot }]
      : [];
  });
  if (matches.length !== 1) {
    throw new Error(
      matches.length
        ? `plugin runtime boundary is ambiguous for entries [light-runtime-api, runtime-api]: ${matches.map(({ record }) => record.id).join(", ")}`
        : "web channel plugin runtime is unavailable: missing plugin that provides light-runtime-api and runtime-api",
    );
  }
  const { record, modulePath, pluginRoot } = matches[0]!;
  const owner = registry?.plugins.find((entry) => entry === record);
  const instance = owner ? getPluginInstance(owner) : undefined;
  if (owner && !instance) {
    throw new Error(`Plugin ${owner.id} has no runtime module owner`);
  }
  const loaded = loadFacadeModuleAtLocationSync<WebChannelRuntimeApi>({
    location: { modulePath, boundaryRoot: pluginRoot, pluginId: record.id },
    boundary: {
      boundaryLabel: "plugin root",
      rejectHardlinks: shouldRejectHardlinkedPluginFiles({
        origin: record.origin,
        rootDir: pluginRoot,
      }),
    },
  });
  return instance?.wrap(loaded) ?? loaded;
}

function requireRuntimeExport<K extends keyof WebChannelRuntimeApi>(
  name: K,
): NonNullable<WebChannelRuntimeApi[K]> {
  const fn = loadWebChannelRuntimeApi()[name];
  if (typeof fn !== "function") {
    throw new Error(`web channel plugin runtime does not provide ${String(name)}`);
  }
  return fn as NonNullable<WebChannelRuntimeApi[K]>;
}

/** Package-root embedding API; runtime instances and cold callers share the public-surface loader. */
export async function monitorWebChannel(...args: unknown[]): Promise<unknown> {
  return loadWebChannelRuntimeApi().monitorWebChannel(...args);
}

/** Clawku: inbox monitor through the same boundary. */
export async function monitorWebInbox(...args: unknown[]): Promise<unknown> {
  return requireRuntimeExport("monitorWebInbox")(...args);
}

/** Clawku: QR login through the same boundary. */
export async function startWebLoginWithQr(...args: unknown[]): Promise<unknown> {
  return requireRuntimeExport("startWebLoginWithQr")(...args);
}

/** Clawku: pairing-code login through the same boundary. */
export async function startWebLoginWithCode(...args: unknown[]): Promise<unknown> {
  return requireRuntimeExport("startWebLoginWithCode")(...args);
}

/** Clawku: wait for a pending login through the same boundary. */
export async function waitForWebLogin(...args: unknown[]): Promise<unknown> {
  return requireRuntimeExport("waitForWebLogin")(...args);
}

/** Clawku: wait for a socket connection through the same boundary. */
export async function waitForWebChannelConnection(sock: unknown, options: unknown): Promise<void> {
  return requireRuntimeExport("waitForWaConnection")(sock, options);
}
