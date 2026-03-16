import { DEFAULT_PROVIDER } from "../agents/defaults.js";
import { parseModelRef } from "../agents/model-selection.js";
import { normalizeProviderId } from "../agents/model-selection.js";
import type { OpenClawConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { resolvePluginProviders } from "./providers.js";
import type { ProviderAuthMethod, ProviderPlugin } from "./types.js";

export const PROVIDER_PLUGIN_CHOICE_PREFIX = "provider-plugin:";

export type ProviderWizardOption = {
  value: string;
  label: string;
  hint?: string;
  groupId: string;
  groupLabel: string;
  groupHint?: string;
};

export type ProviderModelPickerEntry = {
  value: string;
  label: string;
  hint?: string;
};

function resolveMethodById(
  provider: ProviderPlugin,
  methodId?: string,
): ProviderAuthMethod | undefined {
  const normalizedMethodId = methodId?.trim().toLowerCase();
  if (!normalizedMethodId) {
    return provider.auth[0];
  }
  return provider.auth.find((method) => method.id.trim().toLowerCase() === normalizedMethodId);
}

export function buildProviderPluginMethodChoice(providerId: string, methodId: string): string {
  return `${PROVIDER_PLUGIN_CHOICE_PREFIX}${providerId.trim()}:${methodId.trim()}`;
}

export function resolveProviderPluginChoice(params: {
  providers: ProviderPlugin[];
  choice: string;
}): { provider: ProviderPlugin; method: ProviderAuthMethod } | null {
  const choice = params.choice.trim();
  if (!choice) {
    return null;
  }

  if (choice.startsWith(PROVIDER_PLUGIN_CHOICE_PREFIX)) {
    const payload = choice.slice(PROVIDER_PLUGIN_CHOICE_PREFIX.length);
    const separator = payload.indexOf(":");
    const providerId = separator >= 0 ? payload.slice(0, separator) : payload;
    const methodId = separator >= 0 ? payload.slice(separator + 1) : undefined;
    const provider = params.providers.find(
      (entry) => normalizeProviderId(entry.id) === normalizeProviderId(providerId),
    );
    if (!provider) {
      return null;
    }
    const method = resolveMethodById(provider, methodId);
    return method ? { provider, method } : null;
  }

  for (const provider of params.providers) {
    if (
      normalizeProviderId(provider.id) === normalizeProviderId(choice) &&
      provider.auth.length > 0
    ) {
      return { provider, method: provider.auth[0] };
    }
  }

  return null;
}

export async function runProviderModelSelectedHook(params: {
  config: OpenClawConfig;
  model: string;
  prompter: WizardPrompter;
  agentDir?: string;
  workspaceDir?: string;
}): Promise<void> {
  const parsed = parseModelRef(params.model, DEFAULT_PROVIDER);
  if (!parsed) {
    return;
  }

  const providers = resolvePluginProviders({
    config: params.config,
    workspaceDir: params.workspaceDir,
  });
  const provider = providers.find(
    (entry) => normalizeProviderId(entry.id) === normalizeProviderId(parsed.provider),
  );
  if (!provider?.onModelSelected) {
    return;
  }

  await provider.onModelSelected({
    config: params.config,
    model: params.model,
    prompter: params.prompter,
    agentDir: params.agentDir,
    workspaceDir: params.workspaceDir,
  });
}
