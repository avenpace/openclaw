import "./pi-model-discovery-Dp45s8R0.js";
import { $t as isSelfChatMode, B as chunkMarkdownTextWithMode, Bt as pickWebChannel, C as buildMentionRegexes, Ct as readChannelAllowFromStore, Dt as loadConfig, E as enqueueSystemEvent, Et as resolveWhatsAppAccount, F as formatInboundEnvelope, Ft as waitForWaConnection, Gt as buildGroupHistoryKey, H as resolveTextChunkLimit, Ht as webAuthExists, I as resolveEnvelopeFormatOptions, It as WA_WEB_AUTH_DIR, Jt as formatCliCommand, Kt as normalizeAgentId, L as loadWebMedia, Lt as getWebAuthAgeMs, Mt as createWaSocket, N as registerUnhandledRejectionHandler, Nt as formatError, P as finalizeInboundContext, R as getAgentScopedMediaLocalRoots, Rt as logWebSelfId, S as parseActivationCommand, St as monitorWebInbox, T as formatDurationPrecise, Ut as DEFAULT_MAIN_KEY, V as resolveChunkMode, Vt as readWebSelfId, Wt as buildAgentMainSessionKey, Xt as defaultRuntime, Yt as createSubsystemLogger, Zt as clamp, _ as resolveAgentRoute, a as computeBackoff, at as updateLastRoute, bt as resolveChannelGroupPolicy, c as resolveMentionGating, cn as shouldLogVerbose, d as recordPendingHistoryEntryIfEnabled, en as jidToE164, et as resolveIdentityNamePrefix, f as shouldAckReactionForWhatsApp, g as buildAgentSessionKey, i as setActiveWebListener, it as recordSessionMetaFromInbound, l as DEFAULT_GROUP_HISTORY_LIMIT, m as getReplyFromConfig, mn as resolveInboundDebounceMs, n as shouldComputeCommandAuthorized, nn as sleep, nt as loadSessionStore, o as sleepWithAbort, ot as resolveStorePath, p as dispatchReplyWithBufferedBlockDispatcher, pn as toLocationContext, rt as readSessionUpdatedAt, s as createReplyPrefixOptions, sn as logVerbose, st as resolveGroupSessionKey, t as hasControlCommand, tn as normalizeE164, tt as resolveMessagePrefix, u as buildHistoryContextFromEntries, un as getChildLogger, w as normalizeMentionText, x as normalizeGroupActivation, xt as resolveChannelGroupRequireMention, y as convertMarkdownTables, z as resolveMarkdownTableMode } from "./whatsapp-worker.js";
import { i as markdownToWhatsApp, n as sendMessageWhatsApp, r as sendReactionWhatsApp } from "./outbound-DVc4L1gl.js";
import { t as loginWeb } from "./login-CkD_DWkl.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

//#region src/web/auto-reply/constants.ts
const DEFAULT_WEB_MEDIA_BYTES = 5 * 1024 * 1024;

//#endregion
//#region src/web/reconnect.ts
const DEFAULT_HEARTBEAT_SECONDS = 60;
const DEFAULT_RECONNECT_POLICY = {
	initialMs: 2e3,
	maxMs: 3e4,
	factor: 1.8,
	jitter: .25,
	maxAttempts: 12
};
function resolveHeartbeatSeconds(cfg, overrideSeconds) {
	const candidate = overrideSeconds ?? cfg.web?.heartbeatSeconds;
	if (typeof candidate === "number" && candidate > 0) return candidate;
	return DEFAULT_HEARTBEAT_SECONDS;
}
function resolveReconnectPolicy(cfg, overrides) {
	const reconnectOverrides = cfg.web?.reconnect ?? {};
	const overrideConfig = overrides ?? {};
	const merged = {
		...DEFAULT_RECONNECT_POLICY,
		...reconnectOverrides,
		...overrideConfig
	};
	merged.initialMs = Math.max(250, merged.initialMs);
	merged.maxMs = Math.max(merged.initialMs, merged.maxMs);
	merged.factor = clamp(merged.factor, 1.1, 10);
	merged.jitter = clamp(merged.jitter, 0, 1);
	merged.maxAttempts = Math.max(0, Math.floor(merged.maxAttempts));
	return merged;
}
function newConnectionId() {
	return randomUUID();
}

//#endregion
//#region src/web/auto-reply/loggers.ts
const whatsappLog = createSubsystemLogger("gateway/channels/whatsapp");
const whatsappInboundLog = whatsappLog.child("inbound");
const whatsappOutboundLog = whatsappLog.child("outbound");
const whatsappHeartbeatLog = whatsappLog.child("heartbeat");

//#endregion
//#region src/cli/wait.ts
function waitForever() {
	setInterval(() => {}, 1e6).unref();
	return new Promise(() => {});
}

//#endregion
//#region src/web/inbound/monitor-worker.ts
let activeWorkers = 0;
const workerQueue = [];
const workerStatus = /* @__PURE__ */ new Map();
async function acquireWorkerSlot(maxWorkers) {
	if (!maxWorkers || maxWorkers <= 0) return () => {};
	if (activeWorkers < maxWorkers) {
		activeWorkers += 1;
		return () => releaseWorkerSlot();
	}
	await new Promise((resolve) => workerQueue.push(resolve));
	activeWorkers += 1;
	return () => releaseWorkerSlot();
}
function releaseWorkerSlot() {
	activeWorkers = Math.max(0, activeWorkers - 1);
	const next = workerQueue.shift();
	if (next) next();
}
function resolveWorkerEntry() {
	const override = process.env.OPENCLAW_WHATSAPP_WORKER_ENTRY?.trim();
	if (override) return { argv: [override] };
	const tsEntry = fileURLToPath(new URL("../worker/whatsapp-worker.ts", import.meta.url));
	const jsEntry = fileURLToPath(new URL("../worker/whatsapp-worker.js", import.meta.url));
	const entry = fs.existsSync(jsEntry) ? jsEntry : tsEntry;
	if (entry.endsWith(".ts")) return { argv: [
		"--import",
		"tsx",
		entry
	] };
	return { argv: [entry] };
}
function createProxyMessage(payload, call) {
	const replyTo = payload.from;
	const accountId = payload.accountId;
	return {
		...payload,
		sendComposing: async () => {
			await call("sendComposingTo", [replyTo]);
		},
		reply: async (text) => {
			await call("sendMessage", [
				replyTo,
				text,
				void 0,
				void 0,
				{ accountId }
			]);
		},
		sendMedia: async (content) => {
			const mapped = mapMediaContent(content);
			await call("sendMessage", [
				replyTo,
				mapped.text,
				mapped.mediaBuffer,
				mapped.mediaType,
				{
					accountId,
					fileName: mapped.fileName,
					gifPlayback: mapped.gifPlayback
				}
			]);
		}
	};
}
function mapMediaContent(content) {
	if ("image" in content && Buffer.isBuffer(content.image)) return {
		text: content.caption ?? "",
		mediaBuffer: content.image,
		mediaType: content.mimetype ?? "image/jpeg"
	};
	if ("audio" in content && Buffer.isBuffer(content.audio)) return {
		text: content.caption ?? "",
		mediaBuffer: content.audio,
		mediaType: content.mimetype ?? "audio/mpeg"
	};
	if ("video" in content && Buffer.isBuffer(content.video)) return {
		text: content.caption ?? "",
		mediaBuffer: content.video,
		mediaType: content.mimetype ?? "video/mp4",
		gifPlayback: Boolean(content.gifPlayback)
	};
	if ("document" in content && Buffer.isBuffer(content.document)) return {
		text: content.caption ?? "",
		mediaBuffer: content.document,
		mediaType: content.mimetype ?? "application/octet-stream",
		fileName: content.fileName
	};
	return { text: "" };
}
async function monitorWebInboxWorker(options) {
	const release = await acquireWorkerSlot(options.maxWorkers);
	const docker = options.docker;
	const useDocker = Boolean(docker?.enabled);
	let child;
	let containerName;
	if (useDocker) {
		const image = docker?.imageByAccount?.[options.accountId] ?? docker?.image;
		if (!image) {
			release();
			throw new Error("WhatsApp worker docker enabled but no image configured");
		}
		const authMountBase = docker?.authMountPath?.trim() || "/data/whatsapp";
		const safeAccount = options.accountId.replace(/[^a-zA-Z0-9_.-]/g, "-");
		containerName = `${docker?.containerNamePrefix?.trim() || "openclaw-wa-"}${safeAccount}`;
		const containerAuthDir = path.posix.join(authMountBase, safeAccount);
		const command = docker?.command?.length ? docker.command : ["node", docker?.workerEntry?.trim() || "/app/openclaw/dist/web/worker/whatsapp-worker.js"];
		const args = [
			"run",
			"--rm",
			"--name",
			containerName,
			"-i",
			"-e",
			"OPENCLAW_WHATSAPP_WORKER=1",
			"-e",
			"OPENCLAW_WHATSAPP_WORKER_TRANSPORT=stdio",
			"-e",
			`OPENCLAW_WHATSAPP_WORKER_AUTH_DIR=${containerAuthDir}`,
			"-v",
			`${options.authDir}:${containerAuthDir}`
		];
		if (docker?.network) args.push("--network", docker.network);
		for (const [key, val] of Object.entries(docker?.env ?? {})) args.push("-e", `${key}=${val}`);
		if (docker?.extraArgs?.length) args.push(...docker.extraArgs);
		args.push(image, ...command);
		child = spawn("docker", args, {
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			],
			cwd: process.cwd(),
			env: { ...process.env }
		});
		options = {
			...options,
			authDir: containerAuthDir
		};
	} else {
		const { argv } = resolveWorkerEntry();
		child = spawn(process.execPath, argv, {
			stdio: [
				"pipe",
				"pipe",
				"pipe",
				"ipc"
			],
			cwd: process.cwd(),
			env: {
				...process.env,
				OPENCLAW_WHATSAPP_WORKER: "1"
			}
		});
	}
	const pending = /* @__PURE__ */ new Map();
	let closeResolve = null;
	const onClose = new Promise((resolve) => {
		closeResolve = resolve;
	});
	const resolveClose = (reason) => {
		if (!closeResolve) return;
		const r = closeResolve;
		closeResolve = null;
		r(reason);
	};
	const call = (method, params) => new Promise((resolve, reject) => {
		const id = randomUUID();
		pending.set(id, {
			resolve,
			reject
		});
		const msg = {
			type: "call",
			id,
			method,
			params
		};
		if (child.send) child.send(msg);
		else if (child.stdin) child.stdin.write(`${JSON.stringify(msg)}\n`);
	});
	const handleWorkerMessage = (message) => {
		if (!message || typeof message !== "object") return;
		if (message.type === "result") {
			const entry = pending.get(message.id);
			if (!entry) return;
			pending.delete(message.id);
			if (message.ok) entry.resolve(message.result);
			else entry.reject(new Error(message.error));
			return;
		}
		if (message.type === "inbound") {
			const proxy = createProxyMessage(message.msg, call);
			options.onMessage(proxy);
			return;
		}
		if (message.type === "close") {
			resolveClose(message.reason);
			return;
		}
		if (message.type === "error") {
			resolveClose({
				status: void 0,
				isLoggedOut: false,
				error: message.error
			});
			return;
		}
	};
	if (!useDocker && typeof child.send === "function") child.on("message", (message) => handleWorkerMessage(message));
	else if (child.stdout) readline.createInterface({ input: child.stdout }).on("line", (line) => {
		try {
			handleWorkerMessage(JSON.parse(line));
		} catch {}
	});
	child.on("exit", (code, signal) => {
		resolveClose({
			status: void 0,
			isLoggedOut: false,
			error: `worker exited (${code ?? "null"}${signal ? `:${signal}` : ""})`
		});
		workerStatus.delete(options.accountId);
		release();
	});
	workerStatus.set(options.accountId, {
		accountId: options.accountId,
		pid: child.pid,
		startedAtMs: Date.now()
	});
	workerStatus.set(options.accountId, {
		accountId: options.accountId,
		pid: child.pid,
		startedAtMs: Date.now(),
		backend: useDocker ? "docker" : "child",
		containerName
	});
	const init = {
		type: "init",
		options: {
			verbose: options.verbose,
			accountId: options.accountId,
			authDir: options.authDir,
			mediaMaxMb: options.mediaMaxMb,
			sendReadReceipts: options.sendReadReceipts,
			debounceMs: options.debounceMs
		}
	};
	if (child.send) child.send(init);
	else if (child.stdin) child.stdin.write(`${JSON.stringify(init)}\n`);
	return {
		close: async () => {
			try {
				await call("close");
			} finally {
				child.kill();
				workerStatus.delete(options.accountId);
				release();
			}
		},
		onClose,
		signalClose: (reason) => {
			call("signalClose", [reason]);
		},
		sendMessage: async (to, text, mediaBuffer, mediaType, options) => call("sendMessage", [
			to,
			text,
			mediaBuffer,
			mediaType,
			options
		]),
		sendPoll: async (to, poll) => call("sendPoll", [to, poll]),
		sendReaction: async (chatJid, messageId, emoji, fromMe, participant) => call("sendReaction", [
			chatJid,
			messageId,
			emoji,
			fromMe,
			participant
		]),
		sendComposingTo: async (to) => call("sendComposingTo", [to])
	};
}

//#endregion
//#region src/web/auto-reply/mentions.ts
function buildMentionConfig(cfg, agentId) {
	return {
		mentionRegexes: buildMentionRegexes(cfg, agentId),
		allowFrom: cfg.channels?.whatsapp?.allowFrom
	};
}
function resolveMentionTargets(msg, authDir) {
	const jidOptions = authDir ? { authDir } : void 0;
	return {
		normalizedMentions: msg.mentionedJids?.length ? msg.mentionedJids.map((jid) => jidToE164(jid, jidOptions) ?? jid).filter(Boolean) : [],
		selfE164: msg.selfE164 ?? (msg.selfJid ? jidToE164(msg.selfJid, jidOptions) : null),
		selfJid: msg.selfJid ? msg.selfJid.replace(/:\\d+/, "") : null
	};
}
function isBotMentionedFromTargets(msg, mentionCfg, targets) {
	const clean = (text) => normalizeMentionText(text);
	const isSelfChat = isSelfChatMode(targets.selfE164, mentionCfg.allowFrom);
	const hasMentions = (msg.mentionedJids?.length ?? 0) > 0;
	if (hasMentions && !isSelfChat) {
		if (targets.selfE164 && targets.normalizedMentions.includes(targets.selfE164)) return true;
		if (targets.selfJid) {
			if (targets.normalizedMentions.includes(targets.selfJid)) return true;
		}
		return false;
	} else if (hasMentions && isSelfChat) {}
	const bodyClean = clean(msg.body);
	if (mentionCfg.mentionRegexes.some((re) => re.test(bodyClean))) return true;
	if (targets.selfE164) {
		const selfDigits = targets.selfE164.replace(/\D/g, "");
		if (selfDigits) {
			if (bodyClean.replace(/[^\d]/g, "").includes(selfDigits)) return true;
			const bodyNoSpace = msg.body.replace(/[\s-]/g, "");
			if (new RegExp(`\\+?${selfDigits}`, "i").test(bodyNoSpace)) return true;
		}
	}
	return false;
}
function debugMention(msg, mentionCfg, authDir) {
	const mentionTargets = resolveMentionTargets(msg, authDir);
	return {
		wasMentioned: isBotMentionedFromTargets(msg, mentionCfg, mentionTargets),
		details: {
			from: msg.from,
			body: msg.body,
			bodyClean: normalizeMentionText(msg.body),
			mentionedJids: msg.mentionedJids ?? null,
			normalizedMentionedJids: mentionTargets.normalizedMentions.length ? mentionTargets.normalizedMentions : null,
			selfJid: msg.selfJid ?? null,
			selfJidBare: mentionTargets.selfJid,
			selfE164: msg.selfE164 ?? null,
			resolvedSelfE164: mentionTargets.selfE164
		}
	};
}
function resolveOwnerList(mentionCfg, selfE164) {
	const allowFrom = mentionCfg.allowFrom;
	return (Array.isArray(allowFrom) && allowFrom.length > 0 ? allowFrom : selfE164 ? [selfE164] : []).filter((entry) => Boolean(entry && entry !== "*")).map((entry) => normalizeE164(entry)).filter((entry) => Boolean(entry));
}

//#endregion
//#region src/web/auto-reply/monitor/echo.ts
function createEchoTracker(params) {
	const recentlySent = /* @__PURE__ */ new Set();
	const maxItems = Math.max(1, params.maxItems ?? 100);
	const buildCombinedKey = (p) => `combined:${p.sessionKey}:${p.combinedBody}`;
	const trim = () => {
		while (recentlySent.size > maxItems) {
			const firstKey = recentlySent.values().next().value;
			if (!firstKey) break;
			recentlySent.delete(firstKey);
		}
	};
	const rememberText = (text, opts) => {
		if (!text) return;
		recentlySent.add(text);
		if (opts.combinedBody && opts.combinedBodySessionKey) recentlySent.add(buildCombinedKey({
			sessionKey: opts.combinedBodySessionKey,
			combinedBody: opts.combinedBody
		}));
		if (opts.logVerboseMessage) params.logVerbose?.(`Added to echo detection set (size now: ${recentlySent.size}): ${text.substring(0, 50)}...`);
		trim();
	};
	return {
		rememberText,
		has: (key) => recentlySent.has(key),
		forget: (key) => {
			recentlySent.delete(key);
		},
		buildCombinedKey
	};
}

//#endregion
//#region src/web/auto-reply/monitor/broadcast.ts
async function maybeBroadcastMessage(params) {
	const broadcastAgents = params.cfg.broadcast?.[params.peerId];
	if (!broadcastAgents || !Array.isArray(broadcastAgents)) return false;
	if (broadcastAgents.length === 0) return false;
	const strategy = params.cfg.broadcast?.strategy || "parallel";
	whatsappInboundLog.info(`Broadcasting message to ${broadcastAgents.length} agents (${strategy})`);
	const agentIds = params.cfg.agents?.list?.map((agent) => normalizeAgentId(agent.id));
	const hasKnownAgents = (agentIds?.length ?? 0) > 0;
	const groupHistorySnapshot = params.msg.chatType === "group" ? params.groupHistories.get(params.groupHistoryKey) ?? [] : void 0;
	const processForAgent = async (agentId) => {
		const normalizedAgentId = normalizeAgentId(agentId);
		if (hasKnownAgents && !agentIds?.includes(normalizedAgentId)) {
			whatsappInboundLog.warn(`Broadcast agent ${agentId} not found in agents.list; skipping`);
			return false;
		}
		const agentRoute = {
			...params.route,
			agentId: normalizedAgentId,
			sessionKey: buildAgentSessionKey({
				agentId: normalizedAgentId,
				channel: "whatsapp",
				accountId: params.route.accountId,
				peer: {
					kind: params.msg.chatType === "group" ? "group" : "direct",
					id: params.peerId
				},
				dmScope: params.cfg.session?.dmScope,
				identityLinks: params.cfg.session?.identityLinks
			}),
			mainSessionKey: buildAgentMainSessionKey({
				agentId: normalizedAgentId,
				mainKey: DEFAULT_MAIN_KEY
			})
		};
		try {
			return await params.processMessage(params.msg, agentRoute, params.groupHistoryKey, {
				groupHistory: groupHistorySnapshot,
				suppressGroupHistoryClear: true
			});
		} catch (err) {
			whatsappInboundLog.error(`Broadcast agent ${agentId} failed: ${formatError(err)}`);
			return false;
		}
	};
	if (strategy === "sequential") for (const agentId of broadcastAgents) await processForAgent(agentId);
	else await Promise.allSettled(broadcastAgents.map(processForAgent));
	if (params.msg.chatType === "group") params.groupHistories.set(params.groupHistoryKey, []);
	return true;
}

//#endregion
//#region src/web/auto-reply/monitor/commands.ts
function stripMentionsForCommand(text, mentionRegexes, selfE164) {
	let result = text;
	for (const re of mentionRegexes) result = result.replace(re, " ");
	if (selfE164) {
		const digits = selfE164.replace(/\D/g, "");
		if (digits) {
			const pattern = new RegExp(`\\+?${digits}`, "g");
			result = result.replace(pattern, " ");
		}
	}
	return result.replace(/\s+/g, " ").trim();
}

//#endregion
//#region src/web/auto-reply/monitor/group-activation.ts
function resolveGroupPolicyFor(cfg, conversationId) {
	const groupId = resolveGroupSessionKey({
		From: conversationId,
		ChatType: "group",
		Provider: "whatsapp"
	})?.id;
	const whatsappCfg = cfg.channels?.whatsapp;
	const hasGroupAllowFrom = Boolean(whatsappCfg?.groupAllowFrom?.length || whatsappCfg?.allowFrom?.length);
	return resolveChannelGroupPolicy({
		cfg,
		channel: "whatsapp",
		groupId: groupId ?? conversationId,
		hasGroupAllowFrom
	});
}
function resolveGroupRequireMentionFor(cfg, conversationId) {
	const groupId = resolveGroupSessionKey({
		From: conversationId,
		ChatType: "group",
		Provider: "whatsapp"
	})?.id;
	return resolveChannelGroupRequireMention({
		cfg,
		channel: "whatsapp",
		groupId: groupId ?? conversationId
	});
}
function resolveGroupActivationFor(params) {
	const entry = loadSessionStore(resolveStorePath(params.cfg.session?.store, { agentId: params.agentId }))[params.sessionKey];
	const defaultActivation = !resolveGroupRequireMentionFor(params.cfg, params.conversationId) ? "always" : "mention";
	return normalizeGroupActivation(entry?.groupActivation) ?? defaultActivation;
}

//#endregion
//#region src/web/auto-reply/monitor/group-members.ts
function appendNormalizedUnique(entries, seen, ordered) {
	for (const entry of entries) {
		const normalized = normalizeE164(entry) ?? entry;
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		ordered.push(normalized);
	}
}
function noteGroupMember(groupMemberNames, conversationId, e164, name) {
	if (!e164 || !name) return;
	const key = normalizeE164(e164) ?? e164;
	if (!key) return;
	let roster = groupMemberNames.get(conversationId);
	if (!roster) {
		roster = /* @__PURE__ */ new Map();
		groupMemberNames.set(conversationId, roster);
	}
	roster.set(key, name);
}
function formatGroupMembers(params) {
	const { participants, roster, fallbackE164 } = params;
	const seen = /* @__PURE__ */ new Set();
	const ordered = [];
	if (participants?.length) appendNormalizedUnique(participants, seen, ordered);
	if (roster) appendNormalizedUnique(roster.keys(), seen, ordered);
	if (ordered.length === 0 && fallbackE164) {
		const normalized = normalizeE164(fallbackE164) ?? fallbackE164;
		if (normalized) ordered.push(normalized);
	}
	if (ordered.length === 0) return;
	return ordered.map((entry) => {
		const name = roster?.get(entry);
		return name ? `${name} (${entry})` : entry;
	}).join(", ");
}

//#endregion
//#region src/web/auto-reply/monitor/group-gating.ts
function isOwnerSender(baseMentionConfig, msg) {
	const sender = normalizeE164(msg.senderE164 ?? "");
	if (!sender) return false;
	return resolveOwnerList(baseMentionConfig, msg.selfE164 ?? void 0).includes(sender);
}
function recordPendingGroupHistoryEntry(params) {
	const sender = params.msg.senderName && params.msg.senderE164 ? `${params.msg.senderName} (${params.msg.senderE164})` : params.msg.senderName ?? params.msg.senderE164 ?? "Unknown";
	recordPendingHistoryEntryIfEnabled({
		historyMap: params.groupHistories,
		historyKey: params.groupHistoryKey,
		limit: params.groupHistoryLimit,
		entry: {
			sender,
			body: params.msg.body,
			timestamp: params.msg.timestamp,
			id: params.msg.id,
			senderJid: params.msg.senderJid
		}
	});
}
function skipGroupMessageAndStoreHistory(params, verboseMessage) {
	params.logVerbose(verboseMessage);
	recordPendingGroupHistoryEntry({
		msg: params.msg,
		groupHistories: params.groupHistories,
		groupHistoryKey: params.groupHistoryKey,
		groupHistoryLimit: params.groupHistoryLimit
	});
	return { shouldProcess: false };
}
function applyGroupGating(params) {
	const groupPolicy = resolveGroupPolicyFor(params.cfg, params.conversationId);
	if (groupPolicy.allowlistEnabled && !groupPolicy.allowed) {
		params.logVerbose(`Skipping group message ${params.conversationId} (not in allowlist)`);
		return { shouldProcess: false };
	}
	noteGroupMember(params.groupMemberNames, params.groupHistoryKey, params.msg.senderE164, params.msg.senderName);
	const mentionConfig = buildMentionConfig(params.cfg, params.agentId);
	const commandBody = stripMentionsForCommand(params.msg.body, mentionConfig.mentionRegexes, params.msg.selfE164);
	const activationCommand = parseActivationCommand(commandBody);
	const owner = isOwnerSender(params.baseMentionConfig, params.msg);
	const shouldBypassMention = owner && hasControlCommand(commandBody, params.cfg);
	if (activationCommand.hasCommand && !owner) return skipGroupMessageAndStoreHistory(params, `Ignoring /activation from non-owner in group ${params.conversationId}`);
	const mentionDebug = debugMention(params.msg, mentionConfig, params.authDir);
	params.replyLogger.debug({
		conversationId: params.conversationId,
		wasMentioned: mentionDebug.wasMentioned,
		...mentionDebug.details
	}, "group mention debug");
	const wasMentioned = mentionDebug.wasMentioned;
	const requireMention = resolveGroupActivationFor({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		conversationId: params.conversationId
	}) !== "always";
	const selfJid = params.msg.selfJid?.replace(/:\\d+/, "");
	const replySenderJid = params.msg.replyToSenderJid?.replace(/:\\d+/, "");
	const selfE164 = params.msg.selfE164 ? normalizeE164(params.msg.selfE164) : null;
	const replySenderE164 = params.msg.replyToSenderE164 ? normalizeE164(params.msg.replyToSenderE164) : null;
	const mentionGate = resolveMentionGating({
		requireMention,
		canDetectMention: true,
		wasMentioned,
		implicitMention: Boolean(selfJid && replySenderJid && selfJid === replySenderJid || selfE164 && replySenderE164 && selfE164 === replySenderE164),
		shouldBypassMention
	});
	params.msg.wasMentioned = mentionGate.effectiveWasMentioned;
	if (!shouldBypassMention && requireMention && mentionGate.shouldSkip) return skipGroupMessageAndStoreHistory(params, `Group message stored for context (no mention detected) in ${params.conversationId}: ${params.msg.body}`);
	return { shouldProcess: true };
}

//#endregion
//#region src/web/auto-reply/monitor/last-route.ts
function trackBackgroundTask(backgroundTasks, task) {
	backgroundTasks.add(task);
	task.finally(() => {
		backgroundTasks.delete(task);
	});
}
function updateLastRouteInBackground(params) {
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId: params.storeAgentId });
	const task = updateLastRoute({
		storePath,
		sessionKey: params.sessionKey,
		deliveryContext: {
			channel: params.channel,
			to: params.to,
			accountId: params.accountId
		},
		ctx: params.ctx
	}).catch((err) => {
		params.warn({
			error: formatError(err),
			storePath,
			sessionKey: params.sessionKey,
			to: params.to
		}, "failed updating last route");
	});
	trackBackgroundTask(params.backgroundTasks, task);
}

//#endregion
//#region src/web/auto-reply/monitor/peer.ts
function resolvePeerId(msg) {
	if (msg.chatType === "group") return msg.conversationId ?? msg.from;
	if (msg.senderE164) return normalizeE164(msg.senderE164) ?? msg.senderE164;
	if (msg.from.includes("@")) return jidToE164(msg.from) ?? msg.from;
	return normalizeE164(msg.from) ?? msg.from;
}

//#endregion
//#region src/web/auto-reply/util.ts
function elide(text, limit = 400) {
	if (!text) return text;
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}… (truncated ${text.length - limit} chars)`;
}
function isLikelyWhatsAppCryptoError(reason) {
	const formatReason = (value) => {
		if (value == null) return "";
		if (typeof value === "string") return value;
		if (value instanceof Error) return `${value.message}\n${value.stack ?? ""}`;
		if (typeof value === "object") try {
			return JSON.stringify(value);
		} catch {
			return Object.prototype.toString.call(value);
		}
		if (typeof value === "number") return String(value);
		if (typeof value === "boolean") return String(value);
		if (typeof value === "bigint") return String(value);
		if (typeof value === "symbol") return value.description ?? value.toString();
		if (typeof value === "function") return value.name ? `[function ${value.name}]` : "[function]";
		return Object.prototype.toString.call(value);
	};
	const haystack = (reason instanceof Error ? `${reason.message}\n${reason.stack ?? ""}` : formatReason(reason)).toLowerCase();
	if (!(haystack.includes("unsupported state or unable to authenticate data") || haystack.includes("bad mac"))) return false;
	return haystack.includes("@whiskeysockets/baileys") || haystack.includes("baileys") || haystack.includes("noise-handler") || haystack.includes("aesdecryptgcm");
}

//#endregion
//#region src/web/auto-reply/deliver-reply.ts
async function deliverWebReply(params) {
	const { replyResult, msg, maxMediaBytes, textLimit, replyLogger, connectionId, skipLog } = params;
	const replyStarted = Date.now();
	const tableMode = params.tableMode ?? "code";
	const chunkMode = params.chunkMode ?? "length";
	const textChunks = chunkMarkdownTextWithMode(markdownToWhatsApp(convertMarkdownTables(replyResult.text || "", tableMode)), textLimit, chunkMode);
	const mediaList = replyResult.mediaUrls?.length ? replyResult.mediaUrls : replyResult.mediaUrl ? [replyResult.mediaUrl] : [];
	const sendWithRetry = async (fn, label, maxAttempts = 3) => {
		let lastErr;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) try {
			return await fn();
		} catch (err) {
			lastErr = err;
			const errText = formatError(err);
			const isLast = attempt === maxAttempts;
			if (!/closed|reset|timed\s*out|disconnect/i.test(errText) || isLast) throw err;
			const backoffMs = 500 * attempt;
			logVerbose(`Retrying ${label} to ${msg.from} after failure (${attempt}/${maxAttempts - 1}) in ${backoffMs}ms: ${errText}`);
			await sleep(backoffMs);
		}
		throw lastErr;
	};
	if (mediaList.length === 0 && textChunks.length) {
		const totalChunks = textChunks.length;
		for (const [index, chunk] of textChunks.entries()) {
			const chunkStarted = Date.now();
			await sendWithRetry(() => msg.reply(chunk), "text");
			if (!skipLog) {
				const durationMs = Date.now() - chunkStarted;
				whatsappOutboundLog.debug(`Sent chunk ${index + 1}/${totalChunks} to ${msg.from} (${durationMs.toFixed(0)}ms)`);
			}
		}
		replyLogger.info({
			correlationId: msg.id ?? newConnectionId(),
			connectionId: connectionId ?? null,
			to: msg.from,
			from: msg.to,
			text: elide(replyResult.text, 240),
			mediaUrl: null,
			mediaSizeBytes: null,
			mediaKind: null,
			durationMs: Date.now() - replyStarted
		}, "auto-reply sent (text)");
		return;
	}
	const remainingText = [...textChunks];
	for (const [index, mediaUrl] of mediaList.entries()) {
		const caption = index === 0 ? remainingText.shift() || void 0 : void 0;
		try {
			const media = await loadWebMedia(mediaUrl, {
				maxBytes: maxMediaBytes,
				localRoots: params.mediaLocalRoots
			});
			if (shouldLogVerbose()) {
				logVerbose(`Web auto-reply media size: ${(media.buffer.length / (1024 * 1024)).toFixed(2)}MB`);
				logVerbose(`Web auto-reply media source: ${mediaUrl} (kind ${media.kind})`);
			}
			if (media.kind === "image") await sendWithRetry(() => msg.sendMedia({
				image: media.buffer,
				caption,
				mimetype: media.contentType
			}), "media:image");
			else if (media.kind === "audio") await sendWithRetry(() => msg.sendMedia({
				audio: media.buffer,
				ptt: true,
				mimetype: media.contentType,
				caption
			}), "media:audio");
			else if (media.kind === "video") await sendWithRetry(() => msg.sendMedia({
				video: media.buffer,
				caption,
				mimetype: media.contentType
			}), "media:video");
			else {
				const fileName = media.fileName ?? mediaUrl.split("/").pop() ?? "file";
				const mimetype = media.contentType ?? "application/octet-stream";
				await sendWithRetry(() => msg.sendMedia({
					document: media.buffer,
					fileName,
					caption,
					mimetype
				}), "media:document");
			}
			whatsappOutboundLog.info(`Sent media reply to ${msg.from} (${(media.buffer.length / (1024 * 1024)).toFixed(2)}MB)`);
			replyLogger.info({
				correlationId: msg.id ?? newConnectionId(),
				connectionId: connectionId ?? null,
				to: msg.from,
				from: msg.to,
				text: caption ?? null,
				mediaUrl,
				mediaSizeBytes: media.buffer.length,
				mediaKind: media.kind,
				durationMs: Date.now() - replyStarted
			}, "auto-reply sent (media)");
		} catch (err) {
			whatsappOutboundLog.error(`Failed sending web media to ${msg.from}: ${formatError(err)}`);
			replyLogger.warn({
				err,
				mediaUrl
			}, "failed to send web media reply");
			if (index === 0) {
				const warning = err instanceof Error ? `⚠️ Media failed: ${err.message}` : "⚠️ Media failed.";
				const fallbackText = [remainingText.shift() ?? caption ?? "", warning].filter(Boolean).join("\n");
				if (fallbackText) {
					whatsappOutboundLog.warn(`Media skipped; sent text-only to ${msg.from}`);
					await msg.reply(fallbackText);
				}
			}
		}
	}
	for (const chunk of remainingText) await msg.reply(chunk);
}

//#endregion
//#region src/web/auto-reply/monitor/ack-reaction.ts
function maybeSendAckReaction(params) {
	if (!params.msg.id) return;
	const ackConfig = params.cfg.channels?.whatsapp?.ackReaction;
	const emoji = (ackConfig?.emoji ?? "").trim();
	const directEnabled = ackConfig?.direct ?? true;
	const groupMode = ackConfig?.group ?? "mentions";
	const conversationIdForCheck = params.msg.conversationId ?? params.msg.from;
	const activation = params.msg.chatType === "group" ? resolveGroupActivationFor({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		conversationId: conversationIdForCheck
	}) : null;
	const shouldSendReaction = () => shouldAckReactionForWhatsApp({
		emoji,
		isDirect: params.msg.chatType === "direct",
		isGroup: params.msg.chatType === "group",
		directEnabled,
		groupMode,
		wasMentioned: params.msg.wasMentioned === true,
		groupActivated: activation === "always"
	});
	if (!shouldSendReaction()) return;
	params.info({
		chatId: params.msg.chatId,
		messageId: params.msg.id,
		emoji
	}, "sending ack reaction");
	sendReactionWhatsApp(params.msg.chatId, params.msg.id, emoji, {
		verbose: params.verbose,
		fromMe: false,
		participant: params.msg.senderJid,
		accountId: params.accountId
	}).catch((err) => {
		params.warn({
			error: formatError(err),
			chatId: params.msg.chatId,
			messageId: params.msg.id
		}, "failed to send ack reaction");
		logVerbose(`WhatsApp ack reaction failed for chat ${params.msg.chatId}: ${formatError(err)}`);
	});
}

//#endregion
//#region src/web/auto-reply/monitor/message-line.ts
function formatReplyContext(msg) {
	if (!msg.replyToBody) return null;
	return `[Replying to ${msg.replyToSender ?? "unknown sender"}${msg.replyToId ? ` id:${msg.replyToId}` : ""}]\n${msg.replyToBody}\n[/Replying]`;
}
function buildInboundLine(params) {
	const { cfg, msg, agentId, previousTimestamp, envelope } = params;
	const messagePrefix = resolveMessagePrefix(cfg, agentId, {
		configured: cfg.channels?.whatsapp?.messagePrefix,
		hasAllowFrom: (cfg.channels?.whatsapp?.allowFrom?.length ?? 0) > 0
	});
	const prefixStr = messagePrefix ? `${messagePrefix} ` : "";
	const replyContext = formatReplyContext(msg);
	const baseLine = `${prefixStr}${msg.body}${replyContext ? `\n\n${replyContext}` : ""}`;
	return formatInboundEnvelope({
		channel: "WhatsApp",
		from: msg.chatType === "group" ? msg.from : msg.from?.replace(/^whatsapp:/, ""),
		timestamp: msg.timestamp,
		body: baseLine,
		chatType: msg.chatType,
		sender: {
			name: msg.senderName,
			e164: msg.senderE164,
			id: msg.senderJid
		},
		previousTimestamp,
		envelope
	});
}

//#endregion
//#region src/web/auto-reply/monitor/process-message.ts
function normalizeAllowFromE164(values) {
	return (Array.isArray(values) ? values : []).map((entry) => String(entry).trim()).filter((entry) => entry && entry !== "*").map((entry) => normalizeE164(entry)).filter((entry) => Boolean(entry));
}
async function resolveWhatsAppCommandAuthorized(params) {
	if (!(params.cfg.commands?.useAccessGroups !== false)) return true;
	const isGroup = params.msg.chatType === "group";
	const senderE164 = normalizeE164(isGroup ? params.msg.senderE164 ?? "" : params.msg.senderE164 ?? params.msg.from ?? "");
	if (!senderE164) return false;
	const account = resolveWhatsAppAccount({
		cfg: params.cfg,
		accountId: params.msg.accountId
	});
	const dmPolicy = account.dmPolicy ?? "pairing";
	const configuredAllowFrom = account.allowFrom ?? [];
	const configuredGroupAllowFrom = account.groupAllowFrom ?? (configuredAllowFrom.length > 0 ? configuredAllowFrom : void 0);
	if (isGroup) {
		if (!configuredGroupAllowFrom || configuredGroupAllowFrom.length === 0) return false;
		if (configuredGroupAllowFrom.some((v) => String(v).trim() === "*")) return true;
		return normalizeAllowFromE164(configuredGroupAllowFrom).includes(senderE164);
	}
	const storeAllowFrom = dmPolicy === "allowlist" ? [] : await readChannelAllowFromStore("whatsapp", process.env, params.msg.accountId).catch(() => []);
	const combinedAllowFrom = Array.from(new Set([...configuredAllowFrom ?? [], ...storeAllowFrom]));
	const allowFrom = combinedAllowFrom.length > 0 ? combinedAllowFrom : params.msg.selfE164 ? [params.msg.selfE164] : [];
	if (allowFrom.some((v) => String(v).trim() === "*")) return true;
	return normalizeAllowFromE164(allowFrom).includes(senderE164);
}
async function processMessage(params) {
	const conversationId = params.msg.conversationId ?? params.msg.from;
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId: params.route.agentId });
	const envelopeOptions = resolveEnvelopeFormatOptions(params.cfg);
	const previousTimestamp = readSessionUpdatedAt({
		storePath,
		sessionKey: params.route.sessionKey
	});
	let combinedBody = buildInboundLine({
		cfg: params.cfg,
		msg: params.msg,
		agentId: params.route.agentId,
		previousTimestamp,
		envelope: envelopeOptions
	});
	let shouldClearGroupHistory = false;
	if (params.msg.chatType === "group") {
		const history = params.groupHistory ?? params.groupHistories.get(params.groupHistoryKey) ?? [];
		if (history.length > 0) combinedBody = buildHistoryContextFromEntries({
			entries: history.map((m) => ({
				sender: m.sender,
				body: m.body,
				timestamp: m.timestamp
			})),
			currentMessage: combinedBody,
			excludeLast: false,
			formatEntry: (entry) => {
				return formatInboundEnvelope({
					channel: "WhatsApp",
					from: conversationId,
					timestamp: entry.timestamp,
					body: entry.body,
					chatType: "group",
					senderLabel: entry.sender,
					envelope: envelopeOptions
				});
			}
		});
		shouldClearGroupHistory = !(params.suppressGroupHistoryClear ?? false);
	}
	const combinedEchoKey = params.buildCombinedEchoKey({
		sessionKey: params.route.sessionKey,
		combinedBody
	});
	if (params.echoHas(combinedEchoKey)) {
		logVerbose("Skipping auto-reply: detected echo for combined message");
		params.echoForget(combinedEchoKey);
		return false;
	}
	maybeSendAckReaction({
		cfg: params.cfg,
		msg: params.msg,
		agentId: params.route.agentId,
		sessionKey: params.route.sessionKey,
		conversationId,
		verbose: params.verbose,
		accountId: params.route.accountId,
		info: params.replyLogger.info.bind(params.replyLogger),
		warn: params.replyLogger.warn.bind(params.replyLogger)
	});
	const correlationId = params.msg.id ?? newConnectionId();
	params.replyLogger.info({
		connectionId: params.connectionId,
		correlationId,
		from: params.msg.chatType === "group" ? conversationId : params.msg.from,
		to: params.msg.to,
		body: elide(combinedBody, 240),
		mediaType: params.msg.mediaType ?? null,
		mediaPath: params.msg.mediaPath ?? null
	}, "inbound web message");
	const fromDisplay = params.msg.chatType === "group" ? conversationId : params.msg.from;
	const kindLabel = params.msg.mediaType ? `, ${params.msg.mediaType}` : "";
	whatsappInboundLog.info(`Inbound message ${fromDisplay} -> ${params.msg.to} (${params.msg.chatType}${kindLabel}, ${combinedBody.length} chars)`);
	if (shouldLogVerbose()) whatsappInboundLog.debug(`Inbound body: ${elide(combinedBody, 400)}`);
	const dmRouteTarget = params.msg.chatType !== "group" ? (() => {
		if (params.msg.senderE164) return normalizeE164(params.msg.senderE164);
		if (params.msg.from.includes("@")) return jidToE164(params.msg.from);
		return normalizeE164(params.msg.from);
	})() : void 0;
	const textLimit = params.maxMediaTextChunkLimit ?? resolveTextChunkLimit(params.cfg, "whatsapp");
	const chunkMode = resolveChunkMode(params.cfg, "whatsapp", params.route.accountId);
	const tableMode = resolveMarkdownTableMode({
		cfg: params.cfg,
		channel: "whatsapp",
		accountId: params.route.accountId
	});
	const mediaLocalRoots = getAgentScopedMediaLocalRoots(params.cfg, params.route.agentId);
	let didLogHeartbeatStrip = false;
	let didSendReply = false;
	const commandAuthorized = shouldComputeCommandAuthorized(params.msg.body, params.cfg) ? await resolveWhatsAppCommandAuthorized({
		cfg: params.cfg,
		msg: params.msg
	}) : void 0;
	const configuredResponsePrefix = params.cfg.messages?.responsePrefix;
	const { onModelSelected, ...prefixOptions } = createReplyPrefixOptions({
		cfg: params.cfg,
		agentId: params.route.agentId,
		channel: "whatsapp",
		accountId: params.route.accountId
	});
	const isSelfChat = params.msg.chatType !== "group" && Boolean(params.msg.selfE164) && normalizeE164(params.msg.from) === normalizeE164(params.msg.selfE164 ?? "");
	const responsePrefix = prefixOptions.responsePrefix ?? (configuredResponsePrefix === void 0 && isSelfChat ? resolveIdentityNamePrefix(params.cfg, params.route.agentId) ?? "[openclaw]" : void 0);
	const inboundHistory = params.msg.chatType === "group" ? (params.groupHistory ?? params.groupHistories.get(params.groupHistoryKey) ?? []).map((entry) => ({
		sender: entry.sender,
		body: entry.body,
		timestamp: entry.timestamp
	})) : void 0;
	const ctxPayload = finalizeInboundContext({
		Body: combinedBody,
		BodyForAgent: params.msg.body,
		InboundHistory: inboundHistory,
		RawBody: params.msg.body,
		CommandBody: params.msg.body,
		From: params.msg.from,
		To: params.msg.to,
		SessionKey: params.route.sessionKey,
		AccountId: params.route.accountId,
		MessageSid: params.msg.id,
		ReplyToId: params.msg.replyToId,
		ReplyToBody: params.msg.replyToBody,
		ReplyToSender: params.msg.replyToSender,
		MediaPath: params.msg.mediaPath,
		MediaUrl: params.msg.mediaUrl,
		MediaType: params.msg.mediaType,
		ChatType: params.msg.chatType,
		ConversationLabel: params.msg.chatType === "group" ? conversationId : params.msg.from,
		GroupSubject: params.msg.groupSubject,
		GroupMembers: formatGroupMembers({
			participants: params.msg.groupParticipants,
			roster: params.groupMemberNames.get(params.groupHistoryKey),
			fallbackE164: params.msg.senderE164
		}),
		SenderName: params.msg.senderName,
		SenderId: params.msg.senderJid?.trim() || params.msg.senderE164,
		SenderE164: params.msg.senderE164,
		CommandAuthorized: commandAuthorized,
		WasMentioned: params.msg.wasMentioned,
		...params.msg.location ? toLocationContext(params.msg.location) : {},
		Provider: "whatsapp",
		Surface: "whatsapp",
		OriginatingChannel: "whatsapp",
		OriginatingTo: params.msg.from
	});
	if (dmRouteTarget && params.route.sessionKey === params.route.mainSessionKey) updateLastRouteInBackground({
		cfg: params.cfg,
		backgroundTasks: params.backgroundTasks,
		storeAgentId: params.route.agentId,
		sessionKey: params.route.mainSessionKey,
		channel: "whatsapp",
		to: dmRouteTarget,
		accountId: params.route.accountId,
		ctx: ctxPayload,
		warn: params.replyLogger.warn.bind(params.replyLogger)
	});
	const metaTask = recordSessionMetaFromInbound({
		storePath,
		sessionKey: params.route.sessionKey,
		ctx: ctxPayload
	}).catch((err) => {
		params.replyLogger.warn({
			error: formatError(err),
			storePath,
			sessionKey: params.route.sessionKey
		}, "failed updating session meta");
	});
	trackBackgroundTask(params.backgroundTasks, metaTask);
	const { queuedFinal } = await dispatchReplyWithBufferedBlockDispatcher({
		ctx: ctxPayload,
		cfg: params.cfg,
		replyResolver: params.replyResolver,
		dispatcherOptions: {
			...prefixOptions,
			responsePrefix,
			onHeartbeatStrip: () => {
				if (!didLogHeartbeatStrip) {
					didLogHeartbeatStrip = true;
					logVerbose("Stripped stray HEARTBEAT_OK token from web reply");
				}
			},
			deliver: async (payload, info) => {
				if (info.kind !== "final") return;
				await deliverWebReply({
					replyResult: payload,
					msg: params.msg,
					mediaLocalRoots,
					maxMediaBytes: params.maxMediaBytes,
					textLimit,
					chunkMode,
					replyLogger: params.replyLogger,
					connectionId: params.connectionId,
					skipLog: false,
					tableMode
				});
				didSendReply = true;
				const shouldLog = payload.text ? true : void 0;
				params.rememberSentText(payload.text, {
					combinedBody,
					combinedBodySessionKey: params.route.sessionKey,
					logVerboseMessage: shouldLog
				});
				const fromDisplay = params.msg.chatType === "group" ? conversationId : params.msg.from ?? "unknown";
				const hasMedia = Boolean(payload.mediaUrl || payload.mediaUrls?.length);
				whatsappOutboundLog.info(`Auto-replied to ${fromDisplay}${hasMedia ? " (media)" : ""}`);
				if (shouldLogVerbose()) {
					const preview = payload.text != null ? elide(payload.text, 400) : "<media>";
					whatsappOutboundLog.debug(`Reply body: ${preview}${hasMedia ? " (media)" : ""}`);
				}
			},
			onError: (err, info) => {
				const label = info.kind === "tool" ? "tool update" : info.kind === "block" ? "block update" : "auto-reply";
				whatsappOutboundLog.error(`Failed sending web ${label} to ${params.msg.from ?? conversationId}: ${formatError(err)}`);
			},
			onReplyStart: params.msg.sendComposing
		},
		replyOptions: {
			disableBlockStreaming: true,
			onModelSelected
		}
	});
	if (!queuedFinal) {
		if (shouldClearGroupHistory) params.groupHistories.set(params.groupHistoryKey, []);
		logVerbose("Skipping auto-reply: silent token or no text/media returned from resolver");
		return false;
	}
	if (shouldClearGroupHistory) params.groupHistories.set(params.groupHistoryKey, []);
	return didSendReply;
}

//#endregion
//#region src/web/auto-reply/monitor/on-message.ts
function createWebOnMessageHandler(params) {
	const processForRoute = async (msg, route, groupHistoryKey, opts) => processMessage({
		cfg: params.cfg,
		msg,
		route,
		groupHistoryKey,
		groupHistories: params.groupHistories,
		groupMemberNames: params.groupMemberNames,
		connectionId: params.connectionId,
		verbose: params.verbose,
		maxMediaBytes: params.maxMediaBytes,
		replyResolver: params.replyResolver,
		replyLogger: params.replyLogger,
		backgroundTasks: params.backgroundTasks,
		rememberSentText: params.echoTracker.rememberText,
		echoHas: params.echoTracker.has,
		echoForget: params.echoTracker.forget,
		buildCombinedEchoKey: params.echoTracker.buildCombinedKey,
		groupHistory: opts?.groupHistory,
		suppressGroupHistoryClear: opts?.suppressGroupHistoryClear
	});
	return async (msg) => {
		const conversationId = msg.conversationId ?? msg.from;
		const peerId = resolvePeerId(msg);
		const route = resolveAgentRoute({
			cfg: loadConfig(),
			channel: "whatsapp",
			accountId: msg.accountId,
			peer: {
				kind: msg.chatType === "group" ? "group" : "direct",
				id: peerId
			}
		});
		const groupHistoryKey = msg.chatType === "group" ? buildGroupHistoryKey({
			channel: "whatsapp",
			accountId: route.accountId,
			peerKind: "group",
			peerId
		}) : route.sessionKey;
		if (msg.from === msg.to) logVerbose(`📱 Same-phone mode detected (from === to: ${msg.from})`);
		if (params.echoTracker.has(msg.body)) {
			logVerbose("Skipping auto-reply: detected echo (message matches recently sent text)");
			params.echoTracker.forget(msg.body);
			return;
		}
		if (msg.chatType === "group") {
			const metaCtx = {
				From: msg.from,
				To: msg.to,
				SessionKey: route.sessionKey,
				AccountId: route.accountId,
				ChatType: msg.chatType,
				ConversationLabel: conversationId,
				GroupSubject: msg.groupSubject,
				SenderName: msg.senderName,
				SenderId: msg.senderJid?.trim() || msg.senderE164,
				SenderE164: msg.senderE164,
				Provider: "whatsapp",
				Surface: "whatsapp",
				OriginatingChannel: "whatsapp",
				OriginatingTo: conversationId
			};
			updateLastRouteInBackground({
				cfg: params.cfg,
				backgroundTasks: params.backgroundTasks,
				storeAgentId: route.agentId,
				sessionKey: route.sessionKey,
				channel: "whatsapp",
				to: conversationId,
				accountId: route.accountId,
				ctx: metaCtx,
				warn: params.replyLogger.warn.bind(params.replyLogger)
			});
			if (!applyGroupGating({
				cfg: params.cfg,
				msg,
				conversationId,
				groupHistoryKey,
				agentId: route.agentId,
				sessionKey: route.sessionKey,
				baseMentionConfig: params.baseMentionConfig,
				authDir: params.account.authDir,
				groupHistories: params.groupHistories,
				groupHistoryLimit: params.groupHistoryLimit,
				groupMemberNames: params.groupMemberNames,
				logVerbose,
				replyLogger: params.replyLogger
			}).shouldProcess) return;
		} else if (!msg.senderE164 && peerId && peerId.startsWith("+")) msg.senderE164 = normalizeE164(peerId) ?? msg.senderE164;
		if (await maybeBroadcastMessage({
			cfg: params.cfg,
			msg,
			peerId,
			route,
			groupHistoryKey,
			groupHistories: params.groupHistories,
			processMessage: processForRoute
		})) return;
		await processForRoute(msg, route, groupHistoryKey);
	};
}

//#endregion
//#region src/web/auto-reply/monitor.ts
async function monitorWebChannel(verbose, listenerFactory = monitorWebInbox, keepAlive = true, replyResolver = getReplyFromConfig, runtime = defaultRuntime, abortSignal, tuning = {}) {
	const runId = newConnectionId();
	const replyLogger = getChildLogger({
		module: "web-auto-reply",
		runId
	});
	const heartbeatLogger = getChildLogger({
		module: "web-heartbeat",
		runId
	});
	const reconnectLogger = getChildLogger({
		module: "web-reconnect",
		runId
	});
	const status = {
		running: true,
		connected: false,
		reconnectAttempts: 0,
		lastConnectedAt: null,
		lastDisconnect: null,
		lastMessageAt: null,
		lastEventAt: null,
		lastError: null
	};
	const emitStatus = () => {
		tuning.statusSink?.({
			...status,
			lastDisconnect: status.lastDisconnect ? { ...status.lastDisconnect } : null
		});
	};
	emitStatus();
	const baseCfg = loadConfig();
	const useWorker = typeof tuning.useWorker === "boolean" ? tuning.useWorker : baseCfg.channels?.whatsapp?.mode === "worker";
	const workerCfg = tuning.worker ?? baseCfg.channels?.whatsapp?.worker;
	const account = resolveWhatsAppAccount({
		cfg: baseCfg,
		accountId: tuning.accountId
	});
	const cfg = {
		...baseCfg,
		channels: {
			...baseCfg.channels,
			whatsapp: {
				...baseCfg.channels?.whatsapp,
				ackReaction: account.ackReaction,
				messagePrefix: account.messagePrefix,
				allowFrom: account.allowFrom,
				groupAllowFrom: account.groupAllowFrom,
				groupPolicy: account.groupPolicy,
				textChunkLimit: account.textChunkLimit,
				chunkMode: account.chunkMode,
				mediaMaxMb: account.mediaMaxMb,
				blockStreaming: account.blockStreaming,
				groups: account.groups
			}
		}
	};
	const configuredMaxMb = cfg.agents?.defaults?.mediaMaxMb;
	const maxMediaBytes = typeof configuredMaxMb === "number" && configuredMaxMb > 0 ? configuredMaxMb * 1024 * 1024 : DEFAULT_WEB_MEDIA_BYTES;
	const heartbeatSeconds = resolveHeartbeatSeconds(cfg, tuning.heartbeatSeconds);
	const reconnectPolicy = resolveReconnectPolicy(cfg, tuning.reconnect);
	const baseMentionConfig = buildMentionConfig(cfg);
	const groupHistoryLimit = cfg.channels?.whatsapp?.accounts?.[tuning.accountId ?? ""]?.historyLimit ?? cfg.channels?.whatsapp?.historyLimit ?? cfg.messages?.groupChat?.historyLimit ?? DEFAULT_GROUP_HISTORY_LIMIT;
	const groupHistories = /* @__PURE__ */ new Map();
	const groupMemberNames = /* @__PURE__ */ new Map();
	const echoTracker = createEchoTracker({
		maxItems: 100,
		logVerbose
	});
	const sleep = tuning.sleep ?? ((ms, signal) => sleepWithAbort(ms, signal ?? abortSignal));
	const stopRequested = () => abortSignal?.aborted === true;
	const abortPromise = abortSignal && new Promise((resolve) => abortSignal.addEventListener("abort", () => resolve("aborted"), { once: true }));
	const currentMaxListeners = process.getMaxListeners?.() ?? 10;
	if (process.setMaxListeners && currentMaxListeners < 50) process.setMaxListeners(50);
	let sigintStop = false;
	const handleSigint = () => {
		sigintStop = true;
	};
	process.once("SIGINT", handleSigint);
	let reconnectAttempts = 0;
	while (true) {
		if (stopRequested()) break;
		const connectionId = newConnectionId();
		const startedAt = Date.now();
		let heartbeat = null;
		let watchdogTimer = null;
		let lastMessageAt = null;
		let handledMessages = 0;
		let unregisterUnhandled = null;
		const MESSAGE_TIMEOUT_MS = tuning.messageTimeoutMs ?? 1800 * 1e3;
		const WATCHDOG_CHECK_MS = tuning.watchdogCheckMs ?? 60 * 1e3;
		const backgroundTasks = /* @__PURE__ */ new Set();
		const onMessage = createWebOnMessageHandler({
			cfg,
			verbose,
			connectionId,
			maxMediaBytes,
			groupHistoryLimit,
			groupHistories,
			groupMemberNames,
			echoTracker,
			backgroundTasks,
			replyResolver: replyResolver ?? getReplyFromConfig,
			replyLogger,
			baseMentionConfig,
			account
		});
		const inboundDebounceMs = resolveInboundDebounceMs({
			cfg,
			channel: "whatsapp"
		});
		const shouldDebounce = (msg) => {
			if (msg.mediaPath || msg.mediaType) return false;
			if (msg.location) return false;
			if (msg.replyToId || msg.replyToBody) return false;
			return !hasControlCommand(msg.body, cfg);
		};
		const listener = await (useWorker ? monitorWebInboxWorker : listenerFactory ?? monitorWebInbox)({
			verbose,
			accountId: account.accountId,
			authDir: account.authDir,
			mediaMaxMb: account.mediaMaxMb,
			sendReadReceipts: account.sendReadReceipts,
			debounceMs: inboundDebounceMs,
			maxWorkers: workerCfg?.maxWorkers,
			docker: workerCfg?.docker,
			shouldDebounce,
			onMessage: async (msg) => {
				handledMessages += 1;
				lastMessageAt = Date.now();
				status.lastMessageAt = lastMessageAt;
				status.lastEventAt = lastMessageAt;
				emitStatus();
				await onMessage(msg);
			}
		});
		status.connected = true;
		status.lastConnectedAt = Date.now();
		status.lastEventAt = status.lastConnectedAt;
		status.lastError = null;
		emitStatus();
		const { e164: selfE164 } = readWebSelfId(account.authDir);
		const connectRoute = resolveAgentRoute({
			cfg,
			channel: "whatsapp",
			accountId: account.accountId
		});
		enqueueSystemEvent(`WhatsApp gateway connected${selfE164 ? ` as ${selfE164}` : ""}.`, { sessionKey: connectRoute.sessionKey });
		setActiveWebListener(account.accountId, listener);
		unregisterUnhandled = registerUnhandledRejectionHandler((reason) => {
			if (!isLikelyWhatsAppCryptoError(reason)) return false;
			const errorStr = formatError(reason);
			reconnectLogger.warn({
				connectionId,
				error: errorStr
			}, "web reconnect: unhandled rejection from WhatsApp socket; forcing reconnect");
			listener.signalClose?.({
				status: 499,
				isLoggedOut: false,
				error: reason
			});
			return true;
		});
		const closeListener = async () => {
			setActiveWebListener(account.accountId, null);
			if (unregisterUnhandled) {
				unregisterUnhandled();
				unregisterUnhandled = null;
			}
			if (heartbeat) clearInterval(heartbeat);
			if (watchdogTimer) clearInterval(watchdogTimer);
			if (backgroundTasks.size > 0) {
				await Promise.allSettled(backgroundTasks);
				backgroundTasks.clear();
			}
			try {
				await listener.close();
			} catch (err) {
				logVerbose(`Socket close failed: ${formatError(err)}`);
			}
		};
		if (keepAlive) {
			heartbeat = setInterval(() => {
				const authAgeMs = getWebAuthAgeMs(account.authDir);
				const minutesSinceLastMessage = lastMessageAt ? Math.floor((Date.now() - lastMessageAt) / 6e4) : null;
				const logData = {
					connectionId,
					reconnectAttempts,
					messagesHandled: handledMessages,
					lastMessageAt,
					authAgeMs,
					uptimeMs: Date.now() - startedAt,
					...minutesSinceLastMessage !== null && minutesSinceLastMessage > 30 ? { minutesSinceLastMessage } : {}
				};
				if (minutesSinceLastMessage && minutesSinceLastMessage > 30) heartbeatLogger.warn(logData, "⚠️ web gateway heartbeat - no messages in 30+ minutes");
				else heartbeatLogger.info(logData, "web gateway heartbeat");
			}, heartbeatSeconds * 1e3);
			watchdogTimer = setInterval(() => {
				if (!lastMessageAt) return;
				const timeSinceLastMessage = Date.now() - lastMessageAt;
				if (timeSinceLastMessage <= MESSAGE_TIMEOUT_MS) return;
				const minutesSinceLastMessage = Math.floor(timeSinceLastMessage / 6e4);
				heartbeatLogger.warn({
					connectionId,
					minutesSinceLastMessage,
					lastMessageAt: new Date(lastMessageAt),
					messagesHandled: handledMessages
				}, "Message timeout detected - forcing reconnect");
				whatsappHeartbeatLog.warn(`No messages received in ${minutesSinceLastMessage}m - restarting connection`);
				closeListener().catch((err) => {
					logVerbose(`Close listener failed: ${formatError(err)}`);
				});
				listener.signalClose?.({
					status: 499,
					isLoggedOut: false,
					error: "watchdog-timeout"
				});
			}, WATCHDOG_CHECK_MS);
		}
		whatsappLog.info("Listening for personal WhatsApp inbound messages.");
		if (process.stdout.isTTY || process.stderr.isTTY) whatsappLog.raw("Ctrl+C to stop.");
		if (!keepAlive) {
			await closeListener();
			process.removeListener("SIGINT", handleSigint);
			return;
		}
		const reason = await Promise.race([listener.onClose?.catch((err) => {
			reconnectLogger.error({ error: formatError(err) }, "listener.onClose rejected");
			return {
				status: 500,
				isLoggedOut: false,
				error: err
			};
		}) ?? waitForever(), abortPromise ?? waitForever()]);
		if (Date.now() - startedAt > heartbeatSeconds * 1e3) reconnectAttempts = 0;
		status.reconnectAttempts = reconnectAttempts;
		emitStatus();
		if (stopRequested() || sigintStop || reason === "aborted") {
			await closeListener();
			break;
		}
		const statusCode = (typeof reason === "object" && reason && "status" in reason ? reason.status : void 0) ?? "unknown";
		const loggedOut = typeof reason === "object" && reason && "isLoggedOut" in reason && reason.isLoggedOut;
		const errorStr = formatError(reason);
		status.connected = false;
		status.lastEventAt = Date.now();
		status.lastDisconnect = {
			at: status.lastEventAt,
			status: typeof statusCode === "number" ? statusCode : void 0,
			error: errorStr,
			loggedOut: Boolean(loggedOut)
		};
		status.lastError = errorStr;
		status.reconnectAttempts = reconnectAttempts;
		emitStatus();
		reconnectLogger.info({
			connectionId,
			status: statusCode,
			loggedOut,
			reconnectAttempts,
			error: errorStr
		}, "web reconnect: connection closed");
		enqueueSystemEvent(`WhatsApp gateway disconnected (status ${statusCode ?? "unknown"})`, { sessionKey: connectRoute.sessionKey });
		if (loggedOut) {
			runtime.error(`WhatsApp session logged out. Run \`${formatCliCommand("openclaw channels login --channel web")}\` to relink.`);
			await closeListener();
			break;
		}
		reconnectAttempts += 1;
		status.reconnectAttempts = reconnectAttempts;
		emitStatus();
		if (reconnectPolicy.maxAttempts > 0 && reconnectAttempts >= reconnectPolicy.maxAttempts) {
			reconnectLogger.warn({
				connectionId,
				status: statusCode,
				reconnectAttempts,
				maxAttempts: reconnectPolicy.maxAttempts
			}, "web reconnect: max attempts reached; continuing in degraded mode");
			runtime.error(`WhatsApp Web reconnect: max attempts reached (${reconnectAttempts}/${reconnectPolicy.maxAttempts}). Stopping web monitoring.`);
			await closeListener();
			break;
		}
		const delay = computeBackoff(reconnectPolicy, reconnectAttempts);
		reconnectLogger.info({
			connectionId,
			status: statusCode,
			reconnectAttempts,
			maxAttempts: reconnectPolicy.maxAttempts || "unlimited",
			delayMs: delay
		}, "web reconnect: scheduling retry");
		runtime.error(`WhatsApp Web connection closed (status ${statusCode}). Retry ${reconnectAttempts}/${reconnectPolicy.maxAttempts || "∞"} in ${formatDurationPrecise(delay)}… (${errorStr})`);
		await closeListener();
		try {
			await sleep(delay, abortSignal);
		} catch {
			break;
		}
	}
	status.running = false;
	status.connected = false;
	status.lastEventAt = Date.now();
	emitStatus();
	process.removeListener("SIGINT", handleSigint);
}

//#endregion
export { WA_WEB_AUTH_DIR, createWaSocket, logWebSelfId, loginWeb, monitorWebChannel, monitorWebInbox, pickWebChannel, sendMessageWhatsApp, waitForWaConnection, webAuthExists };