import { monitorWebInbox } from "../inbound/monitor.js";
import type { WebInboundMessage, WebListenerCloseReason } from "../inbound/types.js";

type InitMessage = {
  type: "init";
  options: {
    verbose: boolean;
    accountId: string;
    authDir: string;
    mediaMaxMb?: number;
    sendReadReceipts?: boolean;
    debounceMs?: number;
  };
};

type CallMessage = {
  type: "call";
  id: string;
  method: "sendMessage" | "sendPoll" | "sendReaction" | "sendComposingTo" | "close" | "signalClose";
  params?: unknown;
};

type ParentMessage = InitMessage | CallMessage;

type WorkerEvent =
  | { type: "ready" }
  | { type: "inbound"; msg: Omit<WebInboundMessage, "sendComposing" | "reply" | "sendMedia"> }
  | { type: "close"; reason: WebListenerCloseReason }
  | { type: "error"; error: string }
  | { type: "result"; id: string; ok: true; result?: unknown }
  | { type: "result"; id: string; ok: false; error: string };

let listener: Awaited<ReturnType<typeof monitorWebInbox>> | null = null;

function send(event: WorkerEvent) {
  if (process.send) {
    process.send(event);
  }
}

function encodeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function handleInit(msg: InitMessage) {
  try {
    listener = await monitorWebInbox({
      verbose: msg.options.verbose,
      accountId: msg.options.accountId,
      authDir: msg.options.authDir,
      mediaMaxMb: msg.options.mediaMaxMb,
      sendReadReceipts: msg.options.sendReadReceipts,
      debounceMs: msg.options.debounceMs,
      onMessage: async (m) => {
        const { sendComposing, reply, sendMedia, ...payload } = m;
        send({ type: "inbound", msg: payload });
      },
    });

    listener.onClose.then((reason) => {
      send({ type: "close", reason });
    }).catch((err) => {
      send({ type: "error", error: encodeError(err) });
    });

    send({ type: "ready" });
  } catch (err) {
    send({ type: "error", error: encodeError(err) });
  }
}

async function handleCall(msg: CallMessage) {
  if (!listener) {
    send({ type: "result", id: msg.id, ok: false, error: "WhatsApp worker not initialized" });
    return;
  }
  try {
    if (msg.method === "close") {
      await listener.close?.();
      send({ type: "result", id: msg.id, ok: true });
      return;
    }
    if (msg.method === "signalClose") {
      listener.signalClose?.(msg.params as WebListenerCloseReason | undefined);
      send({ type: "result", id: msg.id, ok: true });
      return;
    }
    const method = (listener as any)[msg.method];
    if (typeof method !== "function") {
      send({ type: "result", id: msg.id, ok: false, error: `Unknown method: ${msg.method}` });
      return;
    }
    const result = await method(...((msg.params as unknown[]) ?? []));
    send({ type: "result", id: msg.id, ok: true, result });
  } catch (err) {
    send({ type: "result", id: msg.id, ok: false, error: encodeError(err) });
  }
}

process.on("message", (message: ParentMessage) => {
  if (!message || typeof message !== "object") return;
  if (message.type === "init") {
    void handleInit(message);
    return;
  }
  if (message.type === "call") {
    void handleCall(message);
  }
});

process.on("SIGTERM", () => {
  listener?.signalClose?.({ status: 0, isLoggedOut: false, error: "SIGTERM" });
  process.exit(0);
});
