import readline from "node:readline";
import {
  DisconnectReason,
  downloadMediaMessage,
  extractMessageContent,
  getContentType,
  isJidGroup,
  normalizeMessageContent,
} from "@whiskeysockets/baileys";
import {
  G as resolveDmGroupAccessWithLists,
  H as createDedupeCache,
  J as createInboundDebouncer,
  U as readStoreAllowFromForDmPolicy,
  q as issuePairingChallenge,
  t as hasControlCommand,
} from "./command-detection-DFQvPd9B.js";
import {
  Ti as resolveWhatsAppAccount,
  r as loadConfig,
  rc as saveMediaBuffer,
} from "./config-DU_NmThJ.js";
import "./paths-WDBH9p6f.js";
import { i as recordChannelActivity } from "./retry-policy-DXWiH-Sb.js";
import "./paths-CbQMaT4w.js";
import { nt as upsertChannelPairingRequest, st as formatLocationText } from "./send-DGdZl3lT.js";
import "./env-BdVuargf.js";
import "./github-copilot-token-CfhzmK0S.js";
import "./send-BrBnCq_1.js";
import {
  Mt as resolveOpenProviderRuntimeGroupPolicy,
  Nt as warnMissingProviderGroupPolicyFallbackOnce,
  jt as resolveDefaultGroupPolicy,
} from "./send-Dnmr_P9l.js";
import "./commands-registry-BcUpkBef.js";
import "./tokens-C8OT5B-B.js";
import "./deliver-BCBfls8-.js";
import "./diagnostic-C4_yv-RT.js";
import "./pi-model-discovery-BGWBlaXI.js";
import "./image-9mQg8jFr.js";
import "./audio-transcription-runner-CrDuQKDe.js";
import "./fetch-BOzzKyEg.js";
import "./fetch-guard-ngRT84WA.js";
import "./api-key-rotation-B4LKuL7B.js";
import "./proxy-fetch-Ds9gWJS1.js";
import "./ir-BO9afMew.js";
import "./render-CypHTXnD.js";
import "./target-errors-BSmnVx20.js";
import "./fetch-CwZxIBIg.js";
import "./skill-commands-CMy3jv0c.js";
import "./tables-DeXxIeVW.js";
import "./send-BKEM3QZX.js";
import "./outbound-attachment-DhIaAepq.js";
import "./send-8uT4u6ZZ2.js";
import "./fetch-BhAI44ad.js";
import "./manager-D8uTMzrK.js";
import "./query-expansion-Cxj2Ne5O.js";
import {
  i as waitForWaConnection,
  r as getStatusCode,
  t as createWaSocket,
} from "./session-BlBzajtQ.js";
import {
  B as shouldLogVerbose,
  K as getChildLogger,
  O as createSubsystemLogger,
  R as logVerbose,
  d as normalizeE164,
  l as isSelfChatMode,
  m as resolveJidToE164,
  u as jidToE164,
  x as toWhatsappJid,
} from "./utils-CGX1uqdh.js";
//#region src/web/inbound/access-control.ts
const PAIRING_REPLY_HISTORY_GRACE_MS = 3e4;
function resolveWhatsAppRuntimeGroupPolicy(params) {
  return resolveOpenProviderRuntimeGroupPolicy({
    providerConfigPresent: params.providerConfigPresent,
    groupPolicy: params.groupPolicy,
    defaultGroupPolicy: params.defaultGroupPolicy,
  });
}
async function checkInboundAccessControl(params) {
  const cfg = loadConfig();
  const account = resolveWhatsAppAccount({
    cfg,
    accountId: params.accountId,
  });
  const dmPolicy = params.dmPolicyOverride ?? account.dmPolicy ?? "pairing";
  const configuredAllowFrom = account.allowFrom ?? [];
  const storeAllowFrom = await readStoreAllowFromForDmPolicy({
    provider: "whatsapp",
    accountId: account.accountId,
    dmPolicy,
  });
  const defaultAllowFrom =
    configuredAllowFrom.length === 0 && params.selfE164 ? [params.selfE164] : [];
  const dmAllowFrom = configuredAllowFrom.length > 0 ? configuredAllowFrom : defaultAllowFrom;
  const isSamePhone = params.from === params.selfE164;
  const isSelfChat = account.selfChatMode ?? isSelfChatMode(params.selfE164, configuredAllowFrom);
  const pairingGraceMs =
    typeof params.pairingGraceMs === "number" && params.pairingGraceMs > 0
      ? params.pairingGraceMs
      : PAIRING_REPLY_HISTORY_GRACE_MS;
  const suppressPairingReply =
    typeof params.connectedAtMs === "number" &&
    typeof params.messageTimestampMs === "number" &&
    params.messageTimestampMs < params.connectedAtMs - pairingGraceMs;
  const defaultGroupPolicy = resolveDefaultGroupPolicy(cfg);
  const { groupPolicy, providerMissingFallbackApplied } = params.groupPolicyOverride
    ? {
        groupPolicy: params.groupPolicyOverride,
        providerMissingFallbackApplied: false,
      }
    : resolveWhatsAppRuntimeGroupPolicy({
        providerConfigPresent: cfg.channels?.whatsapp !== void 0,
        groupPolicy: account.groupPolicy,
        defaultGroupPolicy,
      });
  const groupAllowFrom =
    params.groupAllowFromOverride ??
    account.groupAllowFrom ??
    (configuredAllowFrom.length > 0 ? configuredAllowFrom : void 0);
  warnMissingProviderGroupPolicyFallbackOnce({
    providerMissingFallbackApplied,
    providerKey: "whatsapp",
    accountId: account.accountId,
    log: (message) => logVerbose(message),
  });
  const normalizedDmSender = normalizeE164(params.from);
  const normalizedGroupSender =
    typeof params.senderE164 === "string" ? normalizeE164(params.senderE164) : null;
  const access = resolveDmGroupAccessWithLists({
    isGroup: params.group,
    dmPolicy,
    groupPolicy,
    allowFrom: params.group ? configuredAllowFrom : dmAllowFrom,
    groupAllowFrom,
    storeAllowFrom,
    isSenderAllowed: (allowEntries) => {
      if (allowEntries.includes("*")) return true;
      const normalizedEntrySet = new Set(
        allowEntries.map((entry) => normalizeE164(String(entry))).filter((entry) => Boolean(entry)),
      );
      if (!params.group && isSamePhone) return true;
      return params.group
        ? Boolean(normalizedGroupSender && normalizedEntrySet.has(normalizedGroupSender))
        : normalizedEntrySet.has(normalizedDmSender);
    },
  });
  if (params.group && access.decision !== "allow") {
    if (access.reason === "groupPolicy=disabled")
      logVerbose("Blocked group message (groupPolicy: disabled)");
    else if (access.reason === "groupPolicy=allowlist (empty allowlist)")
      logVerbose("Blocked group message (groupPolicy: allowlist, no groupAllowFrom)");
    else
      logVerbose(
        `Blocked group message from ${params.senderE164 ?? "unknown sender"} (groupPolicy: allowlist)`,
      );
    return {
      allowed: false,
      shouldMarkRead: false,
      isSelfChat,
      resolvedAccountId: account.accountId,
    };
  }
  if (!params.group) {
    if (params.isFromMe && !isSamePhone) {
      logVerbose("Skipping outbound DM (fromMe); no pairing reply needed.");
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat,
        resolvedAccountId: account.accountId,
      };
    }
    if (access.decision === "block" && access.reason === "dmPolicy=disabled") {
      logVerbose("Blocked dm (dmPolicy: disabled)");
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat,
        resolvedAccountId: account.accountId,
      };
    }
    if (access.decision === "pairing" && !isSamePhone) {
      const candidate = params.from;
      if (suppressPairingReply)
        logVerbose(`Skipping pairing reply for historical DM from ${candidate}.`);
      else
        await issuePairingChallenge({
          channel: "whatsapp",
          senderId: candidate,
          senderIdLine: `Your WhatsApp phone number: ${candidate}`,
          meta: { name: (params.pushName ?? "").trim() || void 0 },
          upsertPairingRequest: async ({ id, meta }) =>
            await upsertChannelPairingRequest({
              channel: "whatsapp",
              id,
              accountId: account.accountId,
              meta,
            }),
          onCreated: () => {
            logVerbose(
              `whatsapp pairing request sender=${candidate} name=${params.pushName ?? "unknown"}`,
            );
          },
          sendPairingReply: async (text) => {
            await params.sock.sendMessage(params.remoteJid, { text });
          },
          onReplyError: (err) => {
            logVerbose(`whatsapp pairing reply failed for ${candidate}: ${String(err)}`);
          },
        });
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat,
        resolvedAccountId: account.accountId,
      };
    }
    if (access.decision !== "allow") {
      logVerbose(`Blocked unauthorized sender ${params.from} (dmPolicy=${dmPolicy})`);
      return {
        allowed: false,
        shouldMarkRead: false,
        isSelfChat,
        resolvedAccountId: account.accountId,
      };
    }
  }
  return {
    allowed: true,
    shouldMarkRead: true,
    isSelfChat,
    resolvedAccountId: account.accountId,
  };
}
//#endregion
//#region src/web/inbound/dedupe.ts
const recentInboundMessages = createDedupeCache({
  ttlMs: 20 * 6e4,
  maxSize: 5e3,
});
function isRecentInboundMessage(key) {
  return recentInboundMessages.check(key);
}
//#endregion
//#region src/web/vcard.ts
const ALLOWED_VCARD_KEYS = new Set(["FN", "N", "TEL"]);
function parseVcard(vcard) {
  if (!vcard) return { phones: [] };
  const lines = vcard.split(/\r?\n/);
  let nameFromN;
  let nameFromFn;
  const phones = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).toUpperCase();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (!rawValue) continue;
    const baseKey = normalizeVcardKey(key);
    if (!baseKey || !ALLOWED_VCARD_KEYS.has(baseKey)) continue;
    const value = cleanVcardValue(rawValue);
    if (!value) continue;
    if (baseKey === "FN" && !nameFromFn) {
      nameFromFn = normalizeVcardName(value);
      continue;
    }
    if (baseKey === "N" && !nameFromN) {
      nameFromN = normalizeVcardName(value);
      continue;
    }
    if (baseKey === "TEL") {
      const phone = normalizeVcardPhone(value);
      if (phone) phones.push(phone);
    }
  }
  return {
    name: nameFromFn ?? nameFromN,
    phones,
  };
}
function normalizeVcardKey(key) {
  const [primary] = key.split(";");
  if (!primary) return;
  const segments = primary.split(".");
  return segments[segments.length - 1] || void 0;
}
function cleanVcardValue(value) {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
}
function normalizeVcardName(value) {
  return value.replace(/;/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeVcardPhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("tel:")) return trimmed.slice(4).trim();
  return trimmed;
}
//#endregion
//#region src/web/inbound/extract.ts
function unwrapMessage$1(message) {
  return normalizeMessageContent(message);
}
function extractContextInfo(message) {
  if (!message) return;
  const contentType = getContentType(message);
  const candidate = contentType ? message[contentType] : void 0;
  const contextInfo =
    candidate && typeof candidate === "object" && "contextInfo" in candidate
      ? candidate.contextInfo
      : void 0;
  if (contextInfo) return contextInfo;
  const fallback =
    message.extendedTextMessage?.contextInfo ??
    message.imageMessage?.contextInfo ??
    message.videoMessage?.contextInfo ??
    message.documentMessage?.contextInfo ??
    message.audioMessage?.contextInfo ??
    message.stickerMessage?.contextInfo ??
    message.buttonsResponseMessage?.contextInfo ??
    message.listResponseMessage?.contextInfo ??
    message.templateButtonReplyMessage?.contextInfo ??
    message.interactiveResponseMessage?.contextInfo ??
    message.buttonsMessage?.contextInfo ??
    message.listMessage?.contextInfo;
  if (fallback) return fallback;
  for (const value of Object.values(message)) {
    if (!value || typeof value !== "object") continue;
    if (!("contextInfo" in value)) continue;
    const candidateContext = value.contextInfo;
    if (candidateContext) return candidateContext;
  }
}
function extractMentionedJids(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return;
  const flattened = [
    message.extendedTextMessage?.contextInfo?.mentionedJid,
    message.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.contextInfo
      ?.mentionedJid,
    message.imageMessage?.contextInfo?.mentionedJid,
    message.videoMessage?.contextInfo?.mentionedJid,
    message.documentMessage?.contextInfo?.mentionedJid,
    message.audioMessage?.contextInfo?.mentionedJid,
    message.stickerMessage?.contextInfo?.mentionedJid,
    message.buttonsResponseMessage?.contextInfo?.mentionedJid,
    message.listResponseMessage?.contextInfo?.mentionedJid,
  ]
    .flatMap((arr) => arr ?? [])
    .filter(Boolean);
  if (flattened.length === 0) return;
  return Array.from(new Set(flattened));
}
function extractText(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return;
  const extracted = extractMessageContent(message);
  const candidates = [message, extracted && extracted !== message ? extracted : void 0];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate.conversation === "string" && candidate.conversation.trim())
      return candidate.conversation.trim();
    const extended = candidate.extendedTextMessage?.text;
    if (extended?.trim()) return extended.trim();
    const caption =
      candidate.imageMessage?.caption ??
      candidate.videoMessage?.caption ??
      candidate.documentMessage?.caption;
    if (caption?.trim()) return caption.trim();
  }
  const contactPlaceholder =
    extractContactPlaceholder(message) ??
    (extracted && extracted !== message ? extractContactPlaceholder(extracted) : void 0);
  if (contactPlaceholder) return contactPlaceholder;
}
function extractMediaPlaceholder(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return;
  if (message.imageMessage) return "<media:image>";
  if (message.videoMessage) return "<media:video>";
  if (message.audioMessage) return "<media:audio>";
  if (message.documentMessage) return "<media:document>";
  if (message.stickerMessage) return "<media:sticker>";
}
function extractContactPlaceholder(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return;
  const contact = message.contactMessage ?? void 0;
  if (contact) {
    const { name, phones } = describeContact({
      displayName: contact.displayName,
      vcard: contact.vcard,
    });
    return formatContactPlaceholder(name, phones);
  }
  const contactsArray = message.contactsArrayMessage?.contacts ?? void 0;
  if (!contactsArray || contactsArray.length === 0) return;
  return formatContactsPlaceholder(
    contactsArray
      .map((entry) =>
        describeContact({
          displayName: entry.displayName,
          vcard: entry.vcard,
        }),
      )
      .map((entry) => formatContactLabel(entry.name, entry.phones))
      .filter((value) => Boolean(value)),
    contactsArray.length,
  );
}
function describeContact(input) {
  const displayName = (input.displayName ?? "").trim();
  const parsed = parseVcard(input.vcard ?? void 0);
  return {
    name: displayName || parsed.name,
    phones: parsed.phones,
  };
}
function formatContactPlaceholder(name, phones) {
  const label = formatContactLabel(name, phones);
  if (!label) return "<contact>";
  return `<contact: ${label}>`;
}
function formatContactsPlaceholder(labels, total) {
  const cleaned = labels.map((label) => label.trim()).filter(Boolean);
  if (cleaned.length === 0) return `<contacts: ${total} ${total === 1 ? "contact" : "contacts"}>`;
  const remaining = Math.max(total - cleaned.length, 0);
  const suffix = remaining > 0 ? ` +${remaining} more` : "";
  return `<contacts: ${cleaned.join(", ")}${suffix}>`;
}
function formatContactLabel(name, phones) {
  const parts = [name, formatPhoneList(phones)].filter((value) => Boolean(value));
  if (parts.length === 0) return;
  return parts.join(", ");
}
function formatPhoneList(phones) {
  const cleaned = phones?.map((phone) => phone.trim()).filter(Boolean) ?? [];
  if (cleaned.length === 0) return;
  const { shown, remaining } = summarizeList(cleaned, cleaned.length, 1);
  const [primary] = shown;
  if (!primary) return;
  if (remaining === 0) return primary;
  return `${primary} (+${remaining} more)`;
}
function summarizeList(values, total, maxShown) {
  const shown = values.slice(0, maxShown);
  return {
    shown,
    remaining: Math.max(total - shown.length, 0),
  };
}
function extractLocationData(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return null;
  const live = message.liveLocationMessage ?? void 0;
  if (live) {
    const latitudeRaw = live.degreesLatitude;
    const longitudeRaw = live.degreesLongitude;
    if (latitudeRaw != null && longitudeRaw != null) {
      const latitude = Number(latitudeRaw);
      const longitude = Number(longitudeRaw);
      if (Number.isFinite(latitude) && Number.isFinite(longitude))
        return {
          latitude,
          longitude,
          accuracy: live.accuracyInMeters ?? void 0,
          caption: live.caption ?? void 0,
          source: "live",
          isLive: true,
        };
    }
  }
  const location = message.locationMessage ?? void 0;
  if (location) {
    const latitudeRaw = location.degreesLatitude;
    const longitudeRaw = location.degreesLongitude;
    if (latitudeRaw != null && longitudeRaw != null) {
      const latitude = Number(latitudeRaw);
      const longitude = Number(longitudeRaw);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        const isLive = Boolean(location.isLive);
        return {
          latitude,
          longitude,
          accuracy: location.accuracyInMeters ?? void 0,
          name: location.name ?? void 0,
          address: location.address ?? void 0,
          caption: location.comment ?? void 0,
          source: isLive ? "live" : location.name || location.address ? "place" : "pin",
          isLive,
        };
      }
    }
  }
  return null;
}
function describeReplyContext(rawMessage) {
  const message = unwrapMessage$1(rawMessage);
  if (!message) return null;
  const contextInfo = extractContextInfo(message);
  const quoted = normalizeMessageContent(contextInfo?.quotedMessage);
  if (!quoted) return null;
  const location = extractLocationData(quoted);
  const locationText = location ? formatLocationText(location) : void 0;
  let body = [extractText(quoted), locationText].filter(Boolean).join("\n").trim();
  if (!body) body = extractMediaPlaceholder(quoted);
  if (!body) {
    const quotedType = quoted ? getContentType(quoted) : void 0;
    logVerbose(
      `Quoted message missing extractable body${quotedType ? ` (type ${quotedType})` : ""}`,
    );
    return null;
  }
  const senderJid = contextInfo?.participant ?? void 0;
  const senderE164 = senderJid ? (jidToE164(senderJid) ?? senderJid) : void 0;
  const sender = senderE164 ?? "unknown sender";
  return {
    id: contextInfo?.stanzaId ? String(contextInfo.stanzaId) : void 0,
    body,
    sender,
    senderJid,
    senderE164,
  };
}
//#endregion
//#region src/web/inbound/media.ts
function unwrapMessage(message) {
  return normalizeMessageContent(message);
}
/**
 * Resolve the MIME type for an inbound media message.
 * Falls back to WhatsApp's standard formats when Baileys omits the MIME.
 */
function resolveMediaMimetype(message) {
  const explicit =
    message.imageMessage?.mimetype ??
    message.videoMessage?.mimetype ??
    message.documentMessage?.mimetype ??
    message.audioMessage?.mimetype ??
    message.stickerMessage?.mimetype ??
    void 0;
  if (explicit) return explicit;
  if (message.audioMessage) return "audio/ogg; codecs=opus";
  if (message.imageMessage) return "image/jpeg";
  if (message.videoMessage) return "video/mp4";
  if (message.stickerMessage) return "image/webp";
}
async function downloadInboundMedia(msg, sock) {
  const message = unwrapMessage(msg.message);
  if (!message) return;
  const mimetype = resolveMediaMimetype(message);
  const fileName = message.documentMessage?.fileName ?? void 0;
  if (
    !message.imageMessage &&
    !message.videoMessage &&
    !message.documentMessage &&
    !message.audioMessage &&
    !message.stickerMessage
  )
    return;
  try {
    return {
      buffer: await downloadMediaMessage(
        msg,
        "buffer",
        {},
        {
          reuploadRequest: sock.updateMediaMessage,
          logger: sock.logger,
        },
      ),
      mimetype,
      fileName,
    };
  } catch (err) {
    logVerbose(`downloadMediaMessage failed: ${String(err)}`);
    return;
  }
}
//#endregion
//#region src/web/inbound/send-api.ts
function recordWhatsAppOutbound(accountId) {
  recordChannelActivity({
    channel: "whatsapp",
    accountId,
    direction: "outbound",
  });
}
function resolveOutboundMessageId(result) {
  return typeof result === "object" && result && "key" in result
    ? String(result.key?.id ?? "unknown")
    : "unknown";
}
function createWebSendApi(params) {
  return {
    sendMessage: async (to, text, mediaBuffer, mediaType, sendOptions) => {
      const jid = toWhatsappJid(to);
      let payload;
      if (mediaBuffer && mediaType)
        if (mediaType.startsWith("image/"))
          payload = {
            image: mediaBuffer,
            caption: text || void 0,
            mimetype: mediaType,
          };
        else if (mediaType.startsWith("audio/"))
          payload = {
            audio: mediaBuffer,
            ptt: true,
            mimetype: mediaType,
          };
        else if (mediaType.startsWith("video/")) {
          const gifPlayback = sendOptions?.gifPlayback;
          payload = {
            video: mediaBuffer,
            caption: text || void 0,
            mimetype: mediaType,
            ...(gifPlayback ? { gifPlayback: true } : {}),
          };
        } else
          payload = {
            document: mediaBuffer,
            fileName: sendOptions?.fileName?.trim() || "file",
            caption: text || void 0,
            mimetype: mediaType,
          };
      else payload = { text };
      const result = await params.sock.sendMessage(jid, payload);
      recordWhatsAppOutbound(sendOptions?.accountId ?? params.defaultAccountId);
      return { messageId: resolveOutboundMessageId(result) };
    },
    sendPoll: async (to, poll) => {
      const jid = toWhatsappJid(to);
      const result = await params.sock.sendMessage(jid, {
        poll: {
          name: poll.question,
          values: poll.options,
          selectableCount: poll.maxSelections ?? 1,
        },
      });
      recordWhatsAppOutbound(params.defaultAccountId);
      return { messageId: resolveOutboundMessageId(result) };
    },
    sendReaction: async (chatJid, messageId, emoji, fromMe, participant) => {
      const jid = toWhatsappJid(chatJid);
      await params.sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: {
            remoteJid: jid,
            id: messageId,
            fromMe,
            participant: participant ? toWhatsappJid(participant) : void 0,
          },
        },
      });
    },
    sendComposingTo: async (to) => {
      const jid = toWhatsappJid(to);
      await params.sock.sendPresenceUpdate("composing", jid);
    },
  };
}
//#endregion
//#region src/web/inbound/monitor.ts
async function monitorWebInbox(options) {
  const inboundLogger = getChildLogger({ module: "web-inbound" });
  const inboundConsoleLog = createSubsystemLogger("gateway/channels/whatsapp").child("inbound");
  const sock = await createWaSocket(false, options.verbose, {
    authDir: options.authDir,
    encryptionKey: options.encryptionKey,
  });
  await waitForWaConnection(sock);
  const connectedAtMs = Date.now();
  let onCloseResolve = null;
  const onClose = new Promise((resolve) => {
    onCloseResolve = resolve;
  });
  const resolveClose = (reason) => {
    if (!onCloseResolve) return;
    const resolver = onCloseResolve;
    onCloseResolve = null;
    resolver(reason);
  };
  try {
    await sock.sendPresenceUpdate("available");
    if (shouldLogVerbose()) logVerbose("Sent global 'available' presence on connect");
  } catch (err) {
    logVerbose(`Failed to send 'available' presence on connect: ${String(err)}`);
  }
  const selfJid = sock.user?.id;
  const selfE164 = selfJid ? jidToE164(selfJid) : null;
  const debouncer = createInboundDebouncer({
    debounceMs: options.debounceMs ?? 0,
    buildKey: (msg) => {
      const senderKey =
        msg.chatType === "group"
          ? (msg.senderJid ?? msg.senderE164 ?? msg.senderName ?? msg.from)
          : msg.from;
      if (!senderKey) return null;
      const conversationKey = msg.chatType === "group" ? msg.chatId : msg.from;
      return `${msg.accountId}:${conversationKey}:${senderKey}`;
    },
    shouldDebounce: options.shouldDebounce,
    onFlush: async (entries) => {
      const last = entries.at(-1);
      if (!last) return;
      if (entries.length === 1) {
        await options.onMessage(last);
        return;
      }
      const mentioned = /* @__PURE__ */ new Set();
      for (const entry of entries) for (const jid of entry.mentionedJids ?? []) mentioned.add(jid);
      const combinedBody = entries
        .map((entry) => entry.body)
        .filter(Boolean)
        .join("\n");
      const combinedMessage = {
        ...last,
        body: combinedBody,
        mentionedJids: mentioned.size > 0 ? Array.from(mentioned) : void 0,
      };
      await options.onMessage(combinedMessage);
    },
    onError: (err) => {
      inboundLogger.error({ error: String(err) }, "failed handling inbound web message");
      inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
    },
  });
  const groupMetaCache = /* @__PURE__ */ new Map();
  const GROUP_META_TTL_MS = 300 * 1e3;
  const lidLookup = sock.signalRepository?.lidMapping;
  const resolveInboundJid = async (jid) =>
    resolveJidToE164(jid, {
      authDir: options.authDir,
      lidLookup,
    });
  const getGroupMeta = async (jid) => {
    const cached = groupMetaCache.get(jid);
    if (cached && cached.expires > Date.now()) return cached;
    try {
      const meta = await sock.groupMetadata(jid);
      const participants =
        (
          await Promise.all(
            meta.participants?.map(async (p) => {
              return (await resolveInboundJid(p.id)) ?? p.id;
            }) ?? [],
          )
        ).filter(Boolean) ?? [];
      const entry = {
        subject: meta.subject,
        participants,
        expires: Date.now() + GROUP_META_TTL_MS,
      };
      groupMetaCache.set(jid, entry);
      return entry;
    } catch (err) {
      logVerbose(`Failed to fetch group metadata for ${jid}: ${String(err)}`);
      return { expires: Date.now() + GROUP_META_TTL_MS };
    }
  };
  const normalizeInboundMessage = async (msg) => {
    const id = msg.key?.id ?? void 0;
    const remoteJid = msg.key?.remoteJid;
    if (!remoteJid) return null;
    if (remoteJid.endsWith("@status") || remoteJid.endsWith("@broadcast")) return null;
    const group = isJidGroup(remoteJid) === true;
    if (id) {
      if (isRecentInboundMessage(`${options.accountId}:${remoteJid}:${id}`)) return null;
    }
    const participantJid = msg.key?.participant ?? void 0;
    const from = group ? remoteJid : await resolveInboundJid(remoteJid);
    if (!from) return null;
    const senderE164 = group
      ? participantJid
        ? await resolveInboundJid(participantJid)
        : null
      : from;
    let groupSubject;
    let groupParticipants;
    if (group) {
      const meta = await getGroupMeta(remoteJid);
      groupSubject = meta.subject;
      groupParticipants = meta.participants;
    }
    const messageTimestampMs = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1e3 : void 0;
    const access = await checkInboundAccessControl({
      accountId: options.accountId,
      from,
      selfE164,
      senderE164,
      group,
      pushName: msg.pushName ?? void 0,
      isFromMe: Boolean(msg.key?.fromMe),
      messageTimestampMs,
      connectedAtMs,
      sock: { sendMessage: (jid, content) => sock.sendMessage(jid, content) },
      remoteJid,
      dmPolicyOverride: options.dmPolicy,
      groupPolicyOverride: options.groupPolicy,
      groupAllowFromOverride: options.groupAllowFrom,
      groupsOverride: options.groups,
    });
    if (!access.allowed) return null;
    return {
      id,
      remoteJid,
      group,
      participantJid,
      from,
      senderE164,
      groupSubject,
      groupParticipants,
      messageTimestampMs,
      access,
    };
  };
  const maybeMarkInboundAsRead = async (inbound) => {
    const { id, remoteJid, participantJid, access } = inbound;
    if (id && !access.isSelfChat && options.sendReadReceipts !== false)
      try {
        await sock.readMessages([
          {
            remoteJid,
            id,
            participant: participantJid,
            fromMe: false,
          },
        ]);
        if (shouldLogVerbose())
          logVerbose(
            `Marked message ${id} as read for ${remoteJid}${participantJid ? ` (participant ${participantJid})` : ""}`,
          );
      } catch (err) {
        logVerbose(`Failed to mark message ${id} read: ${String(err)}`);
      }
    else if (id && access.isSelfChat && shouldLogVerbose())
      logVerbose(`Self-chat mode: skipping read receipt for ${id}`);
  };
  const enrichInboundMessage = async (msg) => {
    const location = extractLocationData(msg.message ?? void 0);
    const locationText = location ? formatLocationText(location) : void 0;
    let body = extractText(msg.message ?? void 0);
    if (locationText) body = [body, locationText].filter(Boolean).join("\n").trim();
    if (!body) {
      body = extractMediaPlaceholder(msg.message ?? void 0);
      if (!body) return null;
    }
    const replyContext = describeReplyContext(msg.message);
    let mediaPath;
    let mediaType;
    let mediaFileName;
    try {
      const inboundMedia = await downloadInboundMedia(msg, sock);
      if (inboundMedia) {
        const maxBytes =
          (typeof options.mediaMaxMb === "number" && options.mediaMaxMb > 0
            ? options.mediaMaxMb
            : 50) *
          1024 *
          1024;
        mediaPath = (
          await saveMediaBuffer(
            inboundMedia.buffer,
            inboundMedia.mimetype,
            "inbound",
            maxBytes,
            inboundMedia.fileName,
            options.mediaRootDir,
          )
        ).path;
        mediaType = inboundMedia.mimetype;
        mediaFileName = inboundMedia.fileName;
      }
    } catch (err) {
      logVerbose(`Inbound media download failed: ${String(err)}`);
    }
    return {
      body,
      location: location ?? void 0,
      replyContext,
      mediaPath,
      mediaType,
      mediaFileName,
    };
  };
  const enqueueInboundMessage = async (msg, inbound, enriched) => {
    const chatJid = inbound.remoteJid;
    const sendComposing = async () => {
      try {
        await sock.sendPresenceUpdate("composing", chatJid);
      } catch (err) {
        logVerbose(`Presence update failed: ${String(err)}`);
      }
    };
    const reply = async (text) => {
      await sock.sendMessage(chatJid, { text });
    };
    const sendMedia = async (payload) => {
      await sock.sendMessage(chatJid, payload);
    };
    const timestamp = inbound.messageTimestampMs;
    const rawMentionedJids = extractMentionedJids(msg.message);
    const mentionedJids = rawMentionedJids
      ? await Promise.all(
          rawMentionedJids.map(async (jid) => (await resolveInboundJid(jid)) ?? jid),
        )
      : void 0;
    const senderName = msg.pushName ?? void 0;
    inboundLogger.info(
      {
        from: inbound.from,
        to: selfE164 ?? "me",
        body: enriched.body,
        mediaPath: enriched.mediaPath,
        mediaType: enriched.mediaType,
        mediaFileName: enriched.mediaFileName,
        timestamp,
      },
      "inbound message",
    );
    const inboundMessage = {
      id: inbound.id,
      from: inbound.from,
      conversationId: inbound.from,
      to: selfE164 ?? "me",
      accountId: inbound.access.resolvedAccountId,
      body: enriched.body,
      pushName: senderName,
      timestamp,
      chatType: inbound.group ? "group" : "direct",
      chatId: inbound.remoteJid,
      senderJid: inbound.participantJid,
      senderE164: inbound.senderE164 ?? void 0,
      senderName,
      replyToId: enriched.replyContext?.id,
      replyToBody: enriched.replyContext?.body,
      replyToSender: enriched.replyContext?.sender,
      replyToSenderJid: enriched.replyContext?.senderJid,
      replyToSenderE164: enriched.replyContext?.senderE164,
      groupSubject: inbound.groupSubject,
      groupParticipants: inbound.groupParticipants,
      mentionedJids: mentionedJids ?? void 0,
      selfJid,
      selfE164,
      fromMe: Boolean(msg.key?.fromMe),
      location: enriched.location ?? void 0,
      sendComposing,
      reply,
      sendMedia,
      mediaPath: enriched.mediaPath,
      mediaType: enriched.mediaType,
      mediaFileName: enriched.mediaFileName,
    };
    try {
      Promise.resolve(debouncer.enqueue(inboundMessage)).catch((err) => {
        inboundLogger.error({ error: String(err) }, "failed handling inbound web message");
        inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
      });
    } catch (err) {
      inboundLogger.error({ error: String(err) }, "failed handling inbound web message");
      inboundConsoleLog.error(`Failed handling inbound web message: ${String(err)}`);
    }
  };
  const handleMessagesUpsert = async (upsert) => {
    if (upsert.type !== "notify" && upsert.type !== "append") return;
    for (const msg of upsert.messages ?? []) {
      recordChannelActivity({
        channel: "whatsapp",
        accountId: options.accountId,
        direction: "inbound",
      });
      const inbound = await normalizeInboundMessage(msg);
      if (!inbound) continue;
      await maybeMarkInboundAsRead(inbound);
      if (upsert.type === "append") continue;
      const enriched = await enrichInboundMessage(msg);
      if (!enriched) continue;
      await enqueueInboundMessage(msg, inbound, enriched);
    }
  };
  sock.ev.on("messages.upsert", handleMessagesUpsert);
  const handleConnectionUpdate = (update) => {
    try {
      if (update.connection === "close") {
        const status = getStatusCode(update.lastDisconnect?.error);
        resolveClose({
          status,
          isLoggedOut: status === DisconnectReason.loggedOut,
          error: update.lastDisconnect?.error,
        });
      }
    } catch (err) {
      inboundLogger.error({ error: String(err) }, "connection.update handler error");
      resolveClose({
        status: void 0,
        isLoggedOut: false,
        error: err,
      });
    }
  };
  sock.ev.on("connection.update", handleConnectionUpdate);
  return {
    selfE164,
    close: async () => {
      try {
        const ev = sock.ev;
        const messagesUpsertHandler = handleMessagesUpsert;
        const connectionUpdateHandler = handleConnectionUpdate;
        if (typeof ev.off === "function") {
          ev.off("messages.upsert", messagesUpsertHandler);
          ev.off("connection.update", connectionUpdateHandler);
        } else if (typeof ev.removeListener === "function") {
          ev.removeListener("messages.upsert", messagesUpsertHandler);
          ev.removeListener("connection.update", connectionUpdateHandler);
        }
        sock.ws?.close();
      } catch (err) {
        logVerbose(`Socket close failed: ${String(err)}`);
      }
    },
    onClose,
    signalClose: (reason) => {
      resolveClose(
        reason ?? {
          status: void 0,
          isLoggedOut: false,
          error: "closed",
        },
      );
    },
    ...createWebSendApi({
      sock: {
        sendMessage: (jid, content) => sock.sendMessage(jid, content),
        sendPresenceUpdate: (presence, jid) => sock.sendPresenceUpdate(presence, jid),
      },
      defaultAccountId: options.accountId,
    }),
  };
}
//#endregion
//#region src/web/worker/whatsapp-worker.ts
let listener = null;
function send(event) {
  if (process.send) {
    process.send(event);
    return;
  }
  process.stdout.write(`${JSON.stringify(event)}\n`);
}
function encodeError(err) {
  if (err instanceof Error) return err.message;
  return String(err);
}
async function handleInit(msg) {
  try {
    const cfg = loadConfig();
    const shouldDebounce = (m) => {
      if (m.mediaPath || m.mediaType) return false;
      if (m.location) return false;
      if (m.replyToId || m.replyToBody) return false;
      return !hasControlCommand(m.body, cfg);
    };
    listener = await monitorWebInbox({
      verbose: msg.options.verbose,
      accountId: msg.options.accountId,
      authDir: msg.options.authDir,
      mediaMaxMb: msg.options.mediaMaxMb,
      sendReadReceipts: msg.options.sendReadReceipts,
      debounceMs: msg.options.debounceMs,
      shouldDebounce,
      onMessage: async (m) => {
        const { sendComposing, reply, sendMedia, ...payload } = m;
        send({
          type: "inbound",
          msg: payload,
        });
      },
    });
    listener.onClose
      .then((reason) => {
        send({
          type: "close",
          reason,
        });
      })
      .catch((err) => {
        send({
          type: "error",
          error: encodeError(err),
        });
      });
    send({ type: "ready" });
  } catch (err) {
    send({
      type: "error",
      error: encodeError(err),
    });
  }
}
async function handleCall(msg) {
  if (!listener) {
    send({
      type: "result",
      id: msg.id,
      ok: false,
      error: "WhatsApp worker not initialized",
    });
    return;
  }
  try {
    if (msg.method === "close") {
      await listener.close?.();
      send({
        type: "result",
        id: msg.id,
        ok: true,
      });
      return;
    }
    if (msg.method === "signalClose") {
      listener.signalClose?.(msg.params);
      send({
        type: "result",
        id: msg.id,
        ok: true,
      });
      return;
    }
    const method = listener[msg.method];
    if (typeof method !== "function") {
      send({
        type: "result",
        id: msg.id,
        ok: false,
        error: `Unknown method: ${msg.method}`,
      });
      return;
    }
    const result = await method(...(msg.params ?? []));
    send({
      type: "result",
      id: msg.id,
      ok: true,
      result,
    });
  } catch (err) {
    send({
      type: "result",
      id: msg.id,
      ok: false,
      error: encodeError(err),
    });
  }
}
function handleInboundMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "init") {
    handleInit(message);
    return;
  }
  if (message.type === "call") handleCall(message);
}
if (process.send)
  process.on("message", (message) => {
    handleInboundMessage(message);
  });
else
  readline.createInterface({ input: process.stdin }).on("line", (line) => {
    try {
      handleInboundMessage(JSON.parse(line));
    } catch {}
  });
process.on("SIGTERM", () => {
  listener?.signalClose?.({
    status: 0,
    isLoggedOut: false,
    error: "SIGTERM",
  });
  process.exit(0);
});
//#endregion
export { monitorWebInbox as t };
