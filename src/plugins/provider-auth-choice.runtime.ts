// Runtime boundary for resolving provider auth choices from plugins.
import {
  resolveProviderPluginChoiceCore as resolveProviderPluginChoiceImpl,
  runProviderModelSelectedHookCore as runProviderModelSelectedHookImpl,
} from "./provider-wizard.js";
import { resolvePluginProvidersCore as resolvePluginProvidersImpl } from "./providers.runtime.js";
import { resolvePluginSetupProviderCore as resolvePluginSetupProviderImpl } from "./setup-registry.js";

type ResolveProviderPluginChoice =
  typeof import("./provider-wizard.js").resolveProviderPluginChoiceCore;
type RunProviderModelSelectedHook =
  typeof import("./provider-wizard.js").runProviderModelSelectedHookCore;
type ResolvePluginProviders = typeof import("./providers.runtime.js").resolvePluginProvidersCore;
type ResolvePluginSetupProvider =
  typeof import("./setup-registry.js").resolvePluginSetupProviderCore;

/** Runtime wrapper for provider plugin wizard choice resolution. */
export function resolveProviderPluginChoice(
  ...args: Parameters<ResolveProviderPluginChoice>
): ReturnType<ResolveProviderPluginChoice> {
  return resolveProviderPluginChoiceImpl(...args);
}

/** Runtime wrapper for provider model-selected hook dispatch. */
export function runProviderModelSelectedHook(
  ...args: Parameters<RunProviderModelSelectedHook>
): ReturnType<RunProviderModelSelectedHook> {
  return runProviderModelSelectedHookImpl(...args);
}

/** Runtime wrapper for registered model provider discovery. */
export function resolvePluginProviders(
  ...args: Parameters<ResolvePluginProviders>
): ReturnType<ResolvePluginProviders> {
  return resolvePluginProvidersImpl(...args);
}

/** Runtime wrapper for plugin setup-provider discovery. */
export function resolvePluginSetupProvider(
  ...args: Parameters<ResolvePluginSetupProvider>
): ReturnType<ResolvePluginSetupProvider> {
  return resolvePluginSetupProviderImpl(...args);
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
  runProviderPluginAuthMethodUnpersisted,
} from "./provider-auth-choice.js";
