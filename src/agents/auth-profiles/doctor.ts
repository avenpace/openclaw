import type { OpenClawConfig } from "../../config/types.openclaw.js";
import { buildProviderAuthDoctorHintWithPlugin } from "../../plugins/provider-runtime.runtime.js";
import { normalizeProviderId } from "../provider-id.js";
import type { AuthProfileStore } from "./types.js";

/**
 * Migration hints for deprecated/removed OAuth providers.
 * Users with stale credentials should be guided to migrate.
 */
const DEPRECATED_PROVIDER_MIGRATION_HINTS: Record<string, string> = {
  "qwen-portal":
    "Qwen OAuth via portal.qwen.ai has been deprecated. Please migrate to Qwen Cloud Coding Plan. Run: openclaw onboard --auth-choice qwen-api-key (or qwen-api-key-cn for the China endpoint). Legacy modelstudio auth-choice ids still work.",
};

export function formatAuthDoctorHint(params: {
  cfg?: OpenClawConfig;
  store: AuthProfileStore;
  provider: string;
  profileId?: string;
}): string {
  const providerKey = normalizeProviderId(params.provider);
  if (providerKey !== "anthropic") {
    return "";
  }
}
