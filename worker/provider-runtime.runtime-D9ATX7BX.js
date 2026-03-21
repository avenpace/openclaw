import {
  a as loadOpenClawPlugins,
  i as createPluginLoaderLogger,
} from "./command-detection-Dhx1e_hI.js";
import { St as normalizeProviderId } from "./config-Bbh7NwOk.js";
import "./send-D1nCQpeB.js";
import { O as createSubsystemLogger } from "./utils-DAQkyZZs.js";
import "./paths-eFexkPEh.js";
import "./retry-policy-BFw_Fo0d.js";
import "./paths-Cp7C2R7V.js";
import "./env-CvOd8P-q.js";
import "./github-copilot-token-Bk2nhhXX.js";
import "./send-4yD9YQxG.js";
import "./send-D5EzJST3.js";
import "./commands-registry-BHastMsb.js";
import "./tokens-DOs3E8YQ.js";
import "./deliver-C0GVkzkd.js";
import "./diagnostic-Do69szG1.js";
import "./pi-model-discovery-BcGL9lNf.js";
import "./image-BlKytQT6.js";
import "./audio-transcription-runner-DzIs4Ys-.js";
import "./fetch-DqmC9kLB.js";
import "./fetch-guard-ClBTIPsZ.js";
import "./api-key-rotation-pYV4CyLq.js";
import "./proxy-fetch-M9xSywjl.js";
import "./ir-B0Uaakfs.js";
import "./render-CypHTXnD.js";
import "./target-errors-CPMpm0UI.js";
import "./fetch-CwZxIBIg.js";
import "./skill-commands-Bu0xJ0TZ.js";
import "./tables-1ZdW1Az7.js";
import "./send-Bh0EaOi9.js";
import "./outbound-attachment-lnRT_Mn-.js";
import "./send-BwD-icdX2.js";
import "./fetch-BWingQe0.js";
import "./manager-BP8gZzOd.js";
import "./query-expansion-VmsaGYn-.js";
//#region src/plugins/providers.ts
const log = createSubsystemLogger("plugins");
function resolvePluginProviders(params) {
  return loadOpenClawPlugins({
    config: params.config,
    workspaceDir: params.workspaceDir,
    logger: createPluginLoaderLogger(log),
  }).providers.map((entry) => entry.provider);
}
//#endregion
//#region src/plugins/provider-runtime.ts
function matchesProviderId(provider, providerId) {
  const normalized = normalizeProviderId(providerId);
  if (!normalized) return false;
  if (normalizeProviderId(provider.id) === normalized) return true;
  return (provider.aliases ?? []).some((alias) => normalizeProviderId(alias) === normalized);
}
function resolveProviderPluginsForHooks(params) {
  return resolvePluginProviders(params);
}
function resolveProviderRuntimePlugin(params) {
  return resolveProviderPluginsForHooks(params).find((plugin) =>
    matchesProviderId(plugin, params.provider),
  );
}
function formatProviderAuthProfileApiKeyWithPlugin(params) {
  return resolveProviderRuntimePlugin(params)?.formatApiKey?.(params.context);
}
async function refreshProviderOAuthCredentialWithPlugin(params) {
  return await resolveProviderRuntimePlugin(params)?.refreshOAuth?.(params.context);
}
//#endregion
export { formatProviderAuthProfileApiKeyWithPlugin, refreshProviderOAuthCredentialWithPlugin };
