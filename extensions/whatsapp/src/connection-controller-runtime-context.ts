// Whatsapp plugin module exposes live connection controllers through the channel runtime.
import type { WASocket } from "baileys";
import { getChannelRuntimeContext } from "openclaw/plugin-sdk/channel-runtime-context";
import type { WhatsAppSelfIdentity } from "./identity.js";
import type { ActiveWebListener } from "./inbound/types.js";
import { getOptionalWhatsAppChannelRuntime } from "./runtime.js";

export const WHATSAPP_CONNECTION_CONTROLLER_CAPABILITY = "connection-controller";
export const WHATSAPP_CONNECTION_OWNER_PENDING_CAPABILITY = "connection-owner-pending";

type WhatsAppConnectionControllerHandle = {
  getActiveListener(): ActiveWebListener | null;
  getCurrentSock(): WASocket | null;
  getSelfIdentity(): WhatsAppSelfIdentity | null;
};

// Clawku: platform-api runs WhatsApp monitors inside the plugin's module instance, while
// core paths (outbound delivery retries, cron sends) load this module in another instance
// whose channel runtime is empty, so they saw "No active WhatsApp Web listener". Live
// controllers are also kept in one process-wide map those paths can fall back to.
const PROCESS_CONTROLLERS_KEY = Symbol.for("clawku.whatsapp.connectionControllers");
function processControllers(): Map<string, WhatsAppConnectionControllerHandle> {
  const g = globalThis as unknown as Record<
    symbol,
    Map<string, WhatsAppConnectionControllerHandle>
  >;
  return (g[PROCESS_CONTROLLERS_KEY] ??= new Map());
}

export function publishProcessWhatsAppConnectionController(
  accountId: string,
  controller: WhatsAppConnectionControllerHandle,
): () => void {
  processControllers().set(accountId, controller);
  return () => {
    if (processControllers().get(accountId) === controller) {
      processControllers().delete(accountId);
    }
  };
}

export function getWhatsAppConnectionController(
  accountId: string,
): WhatsAppConnectionControllerHandle | null {
  const context = getChannelRuntimeContext({
    channelRuntime: getOptionalWhatsAppChannelRuntime() ?? undefined,
    channelId: "whatsapp",
    accountId,
    capability: WHATSAPP_CONNECTION_CONTROLLER_CAPABILITY,
  });
  return (
    (context as WhatsAppConnectionControllerHandle | undefined) ??
    processControllers().get(accountId) ??
    null
  );
}

export function hasPendingWhatsAppConnectionOwner(accountId: string): boolean {
  return Boolean(
    getChannelRuntimeContext({
      channelRuntime: getOptionalWhatsAppChannelRuntime() ?? undefined,
      channelId: "whatsapp",
      accountId,
      capability: WHATSAPP_CONNECTION_OWNER_PENDING_CAPABILITY,
    }),
  );
}
