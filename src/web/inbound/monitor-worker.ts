import type { AnyMessageContent } from "@whiskeysockets/baileys";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import type { WebInboundMessage, WebListenerCloseReason } from "./types.js";

type WorkerCall = {
  type: "call";
  id: string;
  method: "sendMessage" | "sendPoll" | "sendReaction" | "sendComposingTo" | "close" | "signalClose";
  params?: unknown[];
};

type WorkerInit = {
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

type WorkerMessage =
  | { type: "ready" }
  | { type: "inbound"; msg: Omit<WebInboundMessage, "sendComposing" | "reply" | "sendMedia"> }
  | { type: "close"; reason: WebListenerCloseReason }
  | { type: "error"; error: string }
  | { type: "result"; id: string; ok: true; result?: unknown }
  | { type: "result"; id: string; ok: false; error: string };

type PendingCall = {
  resolve: (value?: unknown) => void;
  reject: (err: Error) => void;
};

function resolveWorkerEntry(): { argv: string[] } {
  const override = process.env.OPENCLAW_WHATSAPP_WORKER_ENTRY?.trim();
  if (override) {
    return { argv: [override] };
  }
  const tsEntry = fileURLToPath(new URL("../worker/whatsapp-worker.ts", import.meta.url));
  const jsEntry = fileURLToPath(new URL("../worker/whatsapp-worker.js", import.meta.url));
  const entry = fs.existsSync(jsEntry) ? jsEntry : tsEntry;
  if (entry.endsWith(".ts")) {
    return { argv: ["--import", "tsx", entry] };
  }
  return { argv: [entry] };
}

function createProxyMessage(
  payload: Omit<WebInboundMessage, "sendComposing" | "reply" | "sendMedia">,
  call: (method: WorkerCall["method"], params?: unknown[]) => Promise<unknown>,
): WebInboundMessage {
  const replyTo = payload.from;
  const accountId = payload.accountId;
  return {
    ...payload,
    sendComposing: async () => {
      await call("sendComposingTo", [replyTo]);
    },
    reply: async (text: string) => {
      await call("sendMessage", [replyTo, text, undefined, undefined, { accountId }]);
    },
    sendMedia: async (content: AnyMessageContent) => {
      const mapped = mapMediaContent(content);
      await call("sendMessage", [replyTo, mapped.text, mapped.mediaBuffer, mapped.mediaType, {
        accountId,
        fileName: mapped.fileName,
        gifPlayback: mapped.gifPlayback,
      }]);
    },
  };
}

function mapMediaContent(content: AnyMessageContent): {
  text: string;
  mediaBuffer?: Buffer;
  mediaType?: string;
  fileName?: string;
  gifPlayback?: boolean;
} {
  if ("image" in content && Buffer.isBuffer(content.image)) {
    return {
      text: (content as { caption?: string }).caption ?? "",
      mediaBuffer: content.image,
      mediaType: (content as { mimetype?: string }).mimetype ?? "image/jpeg",
    };
  }
  if ("audio" in content && Buffer.isBuffer(content.audio)) {
    return {
      text: (content as { caption?: string }).caption ?? "",
      mediaBuffer: content.audio,
      mediaType: (content as { mimetype?: string }).mimetype ?? "audio/mpeg",
    };
  }
  if ("video" in content && Buffer.isBuffer(content.video)) {
    return {
      text: (content as { caption?: string }).caption ?? "",
      mediaBuffer: content.video,
      mediaType: (content as { mimetype?: string }).mimetype ?? "video/mp4",
      gifPlayback: Boolean((content as { gifPlayback?: boolean }).gifPlayback),
    };
  }
  if ("document" in content && Buffer.isBuffer(content.document)) {
    return {
      text: (content as { caption?: string }).caption ?? "",
      mediaBuffer: content.document,
      mediaType: (content as { mimetype?: string }).mimetype ?? "application/octet-stream",
      fileName: (content as { fileName?: string }).fileName,
    };
  }
  return { text: "" };
}

export async function monitorWebInboxWorker(options: {
  verbose: boolean;
  accountId: string;
  authDir: string;
  onMessage: (msg: WebInboundMessage) => Promise<void>;
  mediaMaxMb?: number;
  sendReadReceipts?: boolean;
  debounceMs?: number;
  shouldDebounce?: (msg: WebInboundMessage) => boolean;
}) {
  const { argv } = resolveWorkerEntry();
  const child = spawn(process.execPath, argv, {
    stdio: ["pipe", "pipe", "pipe", "ipc"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      OPENCLAW_WHATSAPP_WORKER: "1",
    },
  });

  const pending = new Map<string, PendingCall>();
  let closeResolve: ((reason: WebListenerCloseReason) => void) | null = null;
  const onClose = new Promise<WebListenerCloseReason>((resolve) => {
    closeResolve = resolve;
  });
  const resolveClose = (reason: WebListenerCloseReason) => {
    if (!closeResolve) return;
    const r = closeResolve;
    closeResolve = null;
    r(reason);
  };

  const call = (method: WorkerCall["method"], params?: unknown[]) =>
    new Promise<unknown>((resolve, reject) => {
      const id = randomUUID();
      pending.set(id, { resolve, reject });
      const msg: WorkerCall = { type: "call", id, method, params };
      child.send?.(msg);
    });

  child.on("message", (message: WorkerMessage) => {
    if (!message || typeof message !== "object") return;
    if (message.type === "result") {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.ok) {
        entry.resolve(message.result);
      } else {
        entry.reject(new Error(message.error));
      }
      return;
    }
    if (message.type === "inbound") {
      const proxy = createProxyMessage(message.msg, call);
      void options.onMessage(proxy);
      return;
    }
    if (message.type === "close") {
      resolveClose(message.reason);
      return;
    }
    if (message.type === "error") {
      resolveClose({ status: undefined, isLoggedOut: false, error: message.error });
      return;
    }
  });

  child.on("exit", (code, signal) => {
    resolveClose({
      status: undefined,
      isLoggedOut: false,
      error: `worker exited (${code ?? "null"}${signal ? `:${signal}` : ""})`,
    });
  });

  const init: WorkerInit = {
    type: "init",
    options: {
      verbose: options.verbose,
      accountId: options.accountId,
      authDir: options.authDir,
      mediaMaxMb: options.mediaMaxMb,
      sendReadReceipts: options.sendReadReceipts,
      debounceMs: options.debounceMs,
    },
  };
  child.send?.(init);

  return {
    close: async () => {
      try {
        await call("close");
      } finally {
        child.kill();
      }
    },
    onClose,
    signalClose: (reason?: WebListenerCloseReason) => {
      void call("signalClose", [reason]);
    },
    sendMessage: async (
      to: string,
      text: string,
      mediaBuffer?: Buffer,
      mediaType?: string,
      options?: { accountId?: string; fileName?: string; gifPlayback?: boolean },
    ) => call("sendMessage", [to, text, mediaBuffer, mediaType, options]),
    sendPoll: async (to: string, poll: { question: string; options: string[]; maxSelections?: number }) =>
      call("sendPoll", [to, poll]),
    sendReaction: async (
      chatJid: string,
      messageId: string,
      emoji: string,
      fromMe: boolean,
      participant?: string,
    ) => call("sendReaction", [chatJid, messageId, emoji, fromMe, participant]),
    sendComposingTo: async (to: string) => call("sendComposingTo", [to]),
  } as const;
}

