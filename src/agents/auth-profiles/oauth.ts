import {
  getOAuthApiKey,
  getOAuthProvider,
  getOAuthProviders,
  type OAuthCredentials,
  type OAuthProvider,
} from "@mariozechner/pi-ai/oauth";
import { loadConfig, type OpenClawConfig } from "../../config/config.js";
import { coerceSecretRef } from "../../config/types.secrets.js";
import { withFileLock } from "../../infra/file-lock.js";
import { resolveSecretRefString, type SecretRefResolveCache } from "../../secrets/resolve.js";
import { refreshChutesTokens } from "../chutes-oauth.js";
import { AUTH_STORE_LOCK_OPTIONS, log } from "./constants.js";
import { resolveTokenExpiryState } from "./credential-state.js";
import { formatAuthDoctorHint } from "./doctor.js";
import { ensureAuthStoreFile, resolveAuthStorePath } from "./paths.js";
import { suggestOAuthProfileIdForLegacyDefault } from "./repair.js";
import { ensureAuthProfileStore, saveAuthProfileStore } from "./store.js";
import type { AuthProfileStore, OAuthCredential } from "./types.js";

const OAUTH_PROVIDER_IDS = new Set<string>(getOAuthProviders().map((provider) => provider.id));

let providerRuntimePromise:
  | Promise<typeof import("../../plugins/provider-runtime.runtime.js")>
  | undefined;

function loadProviderRuntime() {
  providerRuntimePromise ??= import("../../plugins/provider-runtime.runtime.js");
  return providerRuntimePromise;
}

const isOAuthProvider = (provider: string): provider is OAuthProvider =>
  OAUTH_PROVIDER_IDS.has(provider);

const resolveOAuthProvider = (provider: string): OAuthProvider | null =>
  isOAuthProvider(provider) ? provider : null;

/** Bearer-token auth modes that are interchangeable (oauth tokens and raw tokens). */
const BEARER_AUTH_MODES = new Set(["oauth", "token"]);

const isCompatibleModeType = (mode: string | undefined, type: string | undefined): boolean => {
  if (!mode || !type) {
    return false;
  }
  if (mode === type) {
    return true;
  }
  // Both token and oauth represent bearer-token auth paths — allow bidirectional compat.
  return BEARER_AUTH_MODES.has(mode) && BEARER_AUTH_MODES.has(type);
};

function isProfileConfigCompatible(params: {
  cfg?: OpenClawConfig;
  profileId: string;
  provider: string;
  mode: "api_key" | "token" | "oauth";
  allowOAuthTokenCompatibility?: boolean;
}): boolean {
  const profileConfig = params.cfg?.auth?.profiles?.[params.profileId];
  if (profileConfig && profileConfig.provider !== params.provider) {
    return false;
  }
  if (profileConfig && !isCompatibleModeType(profileConfig.mode, params.mode)) {
    return false;
  }
  return true;
}

async function buildOAuthApiKey(provider: string, credentials: OAuthCredential): Promise<string> {
  const { formatProviderAuthProfileApiKeyWithPlugin } = await loadProviderRuntime();
  const formatted = formatProviderAuthProfileApiKeyWithPlugin({
    provider,
    context: credentials,
  });
  if (typeof formatted === "string" && formatted.length > 0) {
    return formatted;
  }
  // Fall back to pi-ai's provider getApiKey if available
  const piProvider = getOAuthProvider(provider);
  if (piProvider?.getApiKey) {
    return piProvider.getApiKey(credentials);
  }
  return credentials.access;
}

function buildApiKeyProfileResult(params: { apiKey: string; provider: string; email?: string }) {
  return {
    apiKey: params.apiKey,
    provider: params.provider,
    email: params.email,
  };
}

async function buildOAuthProfileResult(params: {
  provider: string;
  credentials: OAuthCredential;
  email?: string;
}) {
  return buildApiKeyProfileResult({
    apiKey: await buildOAuthApiKey(params.provider, params.credentials),
    provider: params.provider,
    email: params.email,
  });
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type ResolveApiKeyForProfileParams = {
  cfg?: OpenClawConfig;
  store: AuthProfileStore;
  profileId: string;
  agentDir?: string;
};

type SecretDefaults = NonNullable<OpenClawConfig["secrets"]>["defaults"];

async function refreshOAuthTokenWithLock(params: {
  agentDir: string;
  profileId: string;
  cred: OAuthCredential;
}): Promise<{ apiKey: string; newCredentials: OAuthCredential } | null> {
  const lockPath = resolveAuthStorePath(params.agentDir);
  const { release } = await withFileLock(lockPath, AUTH_STORE_LOCK_OPTIONS);

  try {
    const storePath = resolveAuthStorePath(params.agentDir);
    const store = ensureAuthStoreFile(storePath);

    const cred = store.profiles[params.profileId];
    if (!cred || cred.type !== "oauth") {
      return null;
    }

    if (Date.now() < cred.expires) {
      return {
        apiKey: await buildOAuthApiKey(cred.provider, cred),
        newCredentials: cred,
      };
    }

    const { refreshProviderOAuthCredentialWithPlugin } = await loadProviderRuntime();
    const pluginRefreshed = await refreshProviderOAuthCredentialWithPlugin({
      provider: cred.provider,
      context: cred,
    });
    if (pluginRefreshed) {
      return {
        apiKey: await buildOAuthApiKey(cred.provider, pluginRefreshed),
        newCredentials: pluginRefreshed,
      };
    }

    const oauthCreds: Record<string, OAuthCredentials> = { [cred.provider]: cred };
    const result =
      String(cred.provider) === "chutes"
        ? await (async () => {
            const newCredentials = await refreshChutesTokens({
              credential: cred,
            });
            return { apiKey: newCredentials.access, newCredentials };
          })()
        : await (async () => {
            const oauthProvider = resolveOAuthProvider(cred.provider);
            if (!oauthProvider) {
              return null;
            }
            return await getOAuthApiKey(oauthProvider, oauthCreds);
          })();
    if (!result) {
      return null;
    }

    const updatedCred = {
      ...cred,
      ...result.newCredentials,
    };
    store.profiles[params.profileId] = updatedCred;
    await saveAuthProfileStore(store, storePath);

    return {
      apiKey: result.apiKey,
      newCredentials: updatedCred,
    };
  } finally {
    await release();
  }
}

async function tryResolveOAuthProfile(
  params: ResolveApiKeyForProfileParams,
): Promise<{ apiKey: string; provider: string; email?: string } | null> {
  const { cfg, store, profileId } = params;
  const cred = store.profiles[profileId];
  if (!cred || cred.type !== "oauth") {
    return null;
  }
  if (
    !isProfileConfigCompatible({
      cfg,
      profileId,
      provider: cred.provider,
      mode: cred.type,
    })
  ) {
    return null;
  }

  if (Date.now() < cred.expires) {
    return await buildOAuthProfileResult({
      provider: cred.provider,
      credentials: cred,
      email: cred.email,
    });
  }

  if (!params.agentDir) {
    return null;
  }

  const refreshed = await refreshOAuthTokenWithLock({
    agentDir: params.agentDir,
    profileId,
    cred,
  });
  if (!refreshed) {
    return null;
  }

  return buildApiKeyProfileResult({
    apiKey: refreshed.apiKey,
    provider: cred.provider,
    email: refreshed.newCredentials.email ?? cred.email,
  });
}

async function resolveProfileSecretString(params: {
  profileId: string;
  provider: string;
  value: string | undefined;
  valueRef: unknown;
  refDefaults: SecretDefaults | undefined;
  configForRefResolution: OpenClawConfig;
  cache: SecretRefResolveCache;
  inlineFailureMessage: string;
  refFailureMessage: string;
}): Promise<string | undefined> {
  let resolvedValue = params.value?.trim();
  if (resolvedValue) {
    const inlineRef = coerceSecretRef(resolvedValue, params.refDefaults);
    if (inlineRef) {
      try {
        resolvedValue = await resolveSecretRefString(inlineRef, {
          config: params.configForRefResolution,
          env: process.env,
          cache: params.cache,
        });
      } catch (err) {
        log.debug(params.inlineFailureMessage, {
          profileId: params.profileId,
          provider: params.provider,
          error: extractErrorMessage(err),
        });
      }
    }
  }

  const explicitRef = coerceSecretRef(params.valueRef, params.refDefaults);
  if (!resolvedValue && explicitRef) {
    try {
      resolvedValue = await resolveSecretRefString(explicitRef, {
        config: params.configForRefResolution,
        env: process.env,
        cache: params.cache,
      });
    } catch (err) {
      log.debug(params.refFailureMessage, {
        profileId: params.profileId,
        provider: params.provider,
        error: extractErrorMessage(err),
      });
    }
  }

  return resolvedValue;
}

export async function resolveApiKeyForProfile(
  params: ResolveApiKeyForProfileParams,
): Promise<{ apiKey: string; provider: string; email?: string } | null> {
  const { cfg, store, profileId } = params;
  const cred = store.profiles[profileId];
  if (!cred) {
    return null;
  }
  if (
    !isProfileConfigCompatible({
      cfg,
      profileId,
      provider: cred.provider,
      mode: cred.type,
      // Compatibility: treat "oauth" config as compatible with stored token profiles.
      allowOAuthTokenCompatibility: true,
    })
  ) {
    return null;
  }

  const refResolveCache: SecretRefResolveCache = {};
  const configForRefResolution = cfg ?? loadConfig();
  const refDefaults = configForRefResolution.secrets?.defaults;

  if (cred.type === "api_key") {
    const key = await resolveProfileSecretString({
      profileId,
      provider: cred.provider,
      value: cred.key,
      valueRef: cred.keyRef,
      refDefaults,
      configForRefResolution,
      cache: refResolveCache,
      inlineFailureMessage: "failed to resolve inline auth profile api_key ref",
      refFailureMessage: "failed to resolve auth profile api_key ref",
    });
    if (!key) {
      return null;
    }
    return buildApiKeyProfileResult({ apiKey: key, provider: cred.provider, email: cred.email });
  }
  if (cred.type === "token") {
    const expiryState = resolveTokenExpiryState(cred.expires);
    if (expiryState === "expired" || expiryState === "invalid_expires") {
      return null;
    }
    const token = await resolveProfileSecretString({
      profileId,
      provider: cred.provider,
      value: cred.token,
      valueRef: cred.tokenRef,
      refDefaults,
      configForRefResolution,
      cache: refResolveCache,
      inlineFailureMessage: "failed to resolve inline auth profile token ref",
      refFailureMessage: "failed to resolve auth profile token ref",
    });
    if (!token) {
      return null;
    }
    return buildApiKeyProfileResult({ apiKey: token, provider: cred.provider, email: cred.email });
  }

  // OAuth token path
  const oauthResult = await tryResolveOAuthProfile(params);
  if (oauthResult) {
    return oauthResult;
  }

  // Refresh OAuth token if expired
  if (!params.agentDir) {
    return null;
  }

  const refreshedStore = ensureAuthProfileStore(params.agentDir);
  const refreshed = refreshedStore.profiles[profileId];
  if (refreshed?.type === "oauth" && Date.now() < refreshed.expires) {
    return await buildOAuthProfileResult({
      provider: refreshed.provider,
      credentials: refreshed,
      email: refreshed.email ?? cred.email,
    });
  }

  if (refreshed?.type !== "oauth") {
    return null;
  }

  const mainCred = refreshed;
  if (Date.now() < mainCred.expires) {
    return await buildOAuthProfileResult({
      provider: mainCred.provider,
      credentials: mainCred,
      email: mainCred.email,
    });
  }

  // Attempt refresh with lock
  try {
    const refreshResult = await refreshOAuthTokenWithLock({
      agentDir: params.agentDir,
      profileId,
      cred: mainCred,
    });
    if (!refreshResult) {
      throw new Error("Failed to refresh OAuth token");
    }

    return buildApiKeyProfileResult({
      apiKey: refreshResult.apiKey,
      provider: mainCred.provider,
      email: refreshResult.newCredentials.email ?? mainCred.email,
    });
  } catch (error) {
    const refreshedStore = ensureAuthProfileStore(params.agentDir);
    const message = extractErrorMessage(error);
    const hint = await formatAuthDoctorHint({
      cfg,
      store: refreshedStore,
      provider: cred.provider,
      profileId,
    });
    throw new Error(
      `OAuth token refresh failed for ${cred.provider}: ${message}. ` +
        "Please try again or re-authenticate." +
        (hint ? `\n\n${hint}` : ""),
      { cause: error },
    );
  }
}