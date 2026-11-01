// Runtime boundary for resolving provider auth choices from plugins.
import type { PluginInstallRecord } from "../config/types.plugins.js";
import { loadInstalledPluginIndexInstallRecordsSync } from "./installed-plugin-index-record-reader.js";
import { loadInstalledPluginIndexWithDiscovery } from "./installed-plugin-index.js";
import {
  resolveProviderPluginChoiceCore as resolveProviderPluginChoice,
  runProviderModelSelectedHookCore as runProviderModelSelectedHook,
} from "./provider-wizard.js";
import { resolvePluginProvidersCore as resolvePluginProvidersImpl } from "./providers.runtime.js";
import { resolvePluginSetupProviderCore as resolvePluginSetupProvider } from "./setup-registry.js";

type ResolvePluginProviders = typeof import("./providers.runtime.js").resolvePluginProvidersCore;

export { resolveProviderPluginChoice, runProviderModelSelectedHook, resolvePluginSetupProvider };

/** Runtime wrapper for registered model provider discovery. */
export function resolvePluginProviders(
  params: Parameters<ResolvePluginProviders>[0],
  preparedInstallRecords?: Record<string, PluginInstallRecord>,
): ReturnType<ResolvePluginProviders> {
  if (!preparedInstallRecords) {
    return resolvePluginProvidersImpl(params);
  }
  // The async auth owner supplies fresh installer facts and retains their cache through its consumer.
  const pluginMetadataSnapshot = loadInstalledPluginIndexWithDiscovery({
    config: params.config,
    workspaceDir: params.workspaceDir,
    env: params.env,
    installRecords: {
      ...loadInstalledPluginIndexInstallRecordsSync({ env: params.env }),
      ...preparedInstallRecords,
    },
  });
  return resolvePluginProvidersImpl({ ...params, pluginMetadataSnapshot });
}

// Running a provider's auth method from outside the CLI.
//
// These already exist in `provider-auth-choice.ts`, but only reach `dist`
// inside a content-hashed chunk whose name changes on every build. An embedder
// that pinned such a name would break silently on the next upgrade, so they are
// surfaced here, on a module path that survives.
//
// Re-exports only: behaviour stays owned by the module they point at.
export {
  applyProviderPluginAuthMethodResultConfig,
  prepareAuthChoiceLoadedPluginProvider,
  runProviderPluginAuthMethod,
} from "./provider-auth-choice.js";
export { runProviderPluginAuthMethodUnpersisted } from "./provider-auth-method.js";
