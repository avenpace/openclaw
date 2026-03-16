import type { AuthProfileCredential, OAuthCredential } from "../agents/auth-profiles/types.js";
import { normalizeProviderId } from "../agents/model-selection.js";
import type { OpenClawConfig } from "../config/config.js";
import { resolvePluginProviders } from "./providers.js";
import type { ProviderPlugin } from "./types.js";

function matchesProviderId(provider: ProviderPlugin, providerId: string): boolean {
  const normalized = normalizeProviderId(providerId);
  if (!normalized) {
    return false;
  }
  if (normalizeProviderId(provider.id) === normalized) {
    return true;
  }
  return (provider.aliases ?? []).some((alias) => normalizeProviderId(alias) === normalized);
}

function resolveProviderPluginsForHooks(params: {
  config?: OpenClawConfig;
  workspaceDir?: string;
}): ProviderPlugin[] {
  return resolvePluginProviders(params);
}

export function resolveProviderRuntimePlugin(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
}): ProviderPlugin | undefined {
  return resolveProviderPluginsForHooks(params).find((plugin) =>
    matchesProviderId(plugin, params.provider),
  );
}

export function formatProviderAuthProfileApiKeyWithPlugin(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  context: AuthProfileCredential;
}): string | undefined {
  return resolveProviderRuntimePlugin(params)?.formatApiKey?.(params.context);
}

export async function refreshProviderOAuthCredentialWithPlugin(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  context: OAuthCredential;
}): Promise<OAuthCredential | undefined> {
  return await resolveProviderRuntimePlugin(params)?.refreshOAuth?.(params.context);
}
