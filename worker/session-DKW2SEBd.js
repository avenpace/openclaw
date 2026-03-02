import { kn as VERSION } from "./config-5NZVrebk.js";
import { X as danger, k as ensureDir, lt as toPinoLikeLogger, nt as success, st as getChildLogger, z as resolveUserPath } from "./subsystem-CZjf--pX.js";
import { r as formatCliCommand } from "./env-Cm5puq-Z.js";
import { c as maybeRestoreCredsFromBackup, f as resolveDefaultWebAuthDir, m as resolveWebCredsPath, p as resolveWebCredsBackupPath, u as readCredsJsonRaw } from "./accounts-DT0m_BMj.js";
import { Browsers, DisconnectReason, fetchLatestBaileysVersion, initAuthCreds, makeCacheableSignalKeyStore, makeWASocket, proto, useMultiFileAuthState } from "@whiskeysockets/baileys";
import fs from "node:fs";
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import fs$1 from "node:fs/promises";
import qrcode from "qrcode-terminal";

//#region src/web/encrypted-auth-state.ts
/**
* Encrypted Multi-File Auth State for Baileys
*
* Provides transparent AES-256-GCM encryption for WhatsApp credentials.
* Drop-in replacement for useMultiFileAuthState when encryption key is provided.
*/
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_EXTENSION = ".enc";
const DEBUG = false;
const log = (...args) => DEBUG;
const logError = (...args) => DEBUG;
/**
* Encrypt data using AES-256-GCM
*/
function encrypt(data, key) {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
	const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return Buffer.concat([
		iv,
		authTag,
		encrypted
	]);
}
/**
* Decrypt data using AES-256-GCM
*/
function decrypt(encryptedData, key) {
	if (encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH) {throw new Error("Invalid encrypted data: too short");}
	const iv = encryptedData.subarray(0, IV_LENGTH);
	const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const data = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
	const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(data), decipher.final()]);
}
/**
* Read and decrypt a JSON file
*/
async function readEncryptedJson(filePath, key) {
	const encPath = filePath + ENCRYPTED_EXTENSION;
	const fileName = filePath.split("/").pop();
	if (fs.existsSync(encPath)) {try {
		const encryptedData = await fs$1.readFile(encPath);
		log(`[EncryptedAuthState] Reading encrypted file: ${fileName}.enc (${encryptedData.length} bytes)`);
		const decrypted = decrypt(encryptedData, key);
		log(`[EncryptedAuthState] Decrypted ${fileName}: ${decrypted.length} bytes`);
		const parsed = JSON.parse(decrypted.toString("utf-8"), BufferJSON.reviver);
		log(`[EncryptedAuthState] Parsed ${fileName}: ${typeof parsed === "object" ? Object.keys(parsed).slice(0, 5).join(", ") + "..." : typeof parsed}`);
		return parsed;
	} catch (err) {
		logError(`[EncryptedAuthState] Failed to read/decrypt ${fileName}.enc:`, err);
		return null;
	}}
	if (fs.existsSync(filePath)) {try {
		log(`[EncryptedAuthState] Reading plain file (migration): ${fileName}`);
		const data = await fs$1.readFile(filePath, "utf-8");
		return JSON.parse(data, BufferJSON.reviver);
	} catch (err) {
		logError(`[EncryptedAuthState] Failed to read plain ${fileName}:`, err);
		return null;
	}}
	log(`[EncryptedAuthState] File not found: ${fileName} (neither .enc nor plain)`);
	return null;
}
/**
* Encrypt and write a JSON file
*/
async function writeEncryptedJson(filePath, data, key) {
	const jsonData = JSON.stringify(data, BufferJSON.replacer);
	const encrypted = encrypt(Buffer.from(jsonData, "utf-8"), key);
	const encPath = filePath + ENCRYPTED_EXTENSION;
	await fs$1.writeFile(encPath, encrypted);
	try {
		await fs$1.chmod(encPath, 384);
	} catch {}
	if (fs.existsSync(filePath)) {try {
		await fs$1.unlink(filePath);
	} catch {}}
}
/**
* Remove an encrypted file
*/
async function removeEncryptedFile(filePath) {
	const encPath = filePath + ENCRYPTED_EXTENSION;
	try {
		await fs$1.unlink(encPath);
	} catch {}
	try {
		await fs$1.unlink(filePath);
	} catch {}
}
const BufferJSON = {
	replacer: (_key, value) => {
		if (Buffer.isBuffer(value) || value instanceof Uint8Array || value && typeof value === "object" && value.type === "Buffer") {
			const bufValue = value;
			const data = bufValue.data ?? bufValue;
			return {
				type: "Buffer",
				data: Buffer.from(data).toString("base64")
			};
		}
		return value;
	},
	reviver: (_key, value) => {
		if (value && typeof value === "object" && (value.type === "Buffer" || value.buffer === true)) {
			const data = value.data;
			if (typeof data === "string") {return Buffer.from(data, "base64");}
			return Buffer.from(data || []);
		}
		return value;
	}
};
/**
* Create an encrypted multi-file auth state
* Drop-in replacement for useMultiFileAuthState with encryption support
*/
async function useEncryptedMultiFileAuthState(authDir, encryptionKey) {
	log(`[EncryptedAuthState] Using encrypted auth state for: ${authDir}`);
	await fs$1.mkdir(authDir, { recursive: true });
	const credsPath = path.join(authDir, "creds.json");
	let creds = await readEncryptedJson(credsPath, encryptionKey);
	if (!creds) {
		log(`[EncryptedAuthState] No existing creds, initializing fresh credentials`);
		creds = initAuthCreds();
	} else {log(`[EncryptedAuthState] Loaded existing creds, me.id: ${creds.me?.id ?? "not set"}`);}
	log(`[EncryptedAuthState] Creds validation: noiseKey=${!!creds.noiseKey}, signedIdentityKey=${!!creds.signedIdentityKey}, registrationId=${creds.registrationId}`);
	const saveCreds = async () => {
		log(`[EncryptedAuthState] Writing encrypted file: ${credsPath}.enc`);
		await writeEncryptedJson(credsPath, creds, encryptionKey);
	};
	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					const data = {};
					await Promise.all(ids.map(async (id) => {
						const value = await readEncryptedJson(path.join(authDir, `${type}-${id}.json`), encryptionKey);
						if (type === "app-state-sync-key" && value) {data[id] = proto.Message.AppStateSyncKeyData.fromObject(value);}
						else if (value !== null) {data[id] = value;}
					}));
					return data;
				},
				set: async (data) => {
					const tasks = [];
					for (const category in data) {
						const categoryData = data[category];
						if (!categoryData) {continue;}
						for (const id in categoryData) {
							const value = categoryData[id];
							const filePath = path.join(authDir, `${category}-${id}.json`);
							if (value) {tasks.push(writeEncryptedJson(filePath, value, encryptionKey));}
							else {tasks.push(removeEncryptedFile(filePath));}
						}
					}
					await Promise.all(tasks);
				}
			}
		},
		saveCreds
	};
}

//#endregion
//#region src/web/session.ts
let credsSaveQueue = Promise.resolve();
function enqueueSaveCreds(authDir, saveCreds, logger) {
	credsSaveQueue = credsSaveQueue.then(() => safeSaveCreds(authDir, saveCreds, logger)).catch((err) => {
		logger.warn({ error: String(err) }, "WhatsApp creds save queue error");
	});
}
async function safeSaveCreds(authDir, saveCreds, logger) {
	try {
		const credsPath = resolveWebCredsPath(authDir);
		const backupPath = resolveWebCredsBackupPath(authDir);
		const raw = readCredsJsonRaw(credsPath);
		if (raw) {try {
			JSON.parse(raw);
			fs.copyFileSync(credsPath, backupPath);
			try {
				fs.chmodSync(backupPath, 384);
			} catch {}
		} catch {}}
	} catch {}
	try {
		await Promise.resolve(saveCreds());
		try {
			fs.chmodSync(resolveWebCredsPath(authDir), 384);
		} catch {}
	} catch (err) {
		logger.warn({ error: String(err) }, "failed saving WhatsApp creds");
	}
}
/**
* Create a Baileys socket backed by the multi-file auth store we keep on disk.
* Consumers can opt into QR printing for interactive login flows.
* When encryptionKey is provided, credentials are encrypted at rest using AES-256-GCM.
*/
async function createWaSocket(printQr, verbose, opts = {}) {
	const logger = toPinoLikeLogger(getChildLogger({ module: "baileys" }, { level: verbose ? "info" : "silent" }), verbose ? "info" : "silent");
	const authDir = resolveUserPath(opts.authDir ?? resolveDefaultWebAuthDir());
	await ensureDir(authDir);
	const sessionLogger = getChildLogger({ module: "web-session" });
	let state;
	let saveCreds;
	if (opts.encryptionKey) {
		const encResult = await useEncryptedMultiFileAuthState(authDir, opts.encryptionKey);
		state = encResult.state;
		saveCreds = encResult.saveCreds;
	} else {
		maybeRestoreCredsFromBackup(authDir);
		const plainResult = await useMultiFileAuthState(authDir);
		state = plainResult.state;
		saveCreds = plainResult.saveCreds;
	}
	const { version } = await fetchLatestBaileysVersion();
	const browserConfig = opts.codePairing ? Browsers.windows("Edge") : [
		"openclaw",
		"cli",
		VERSION
	];
	if (opts.codePairing) {
		console.log(`[CodePairing:Socket] Using browser config:`, JSON.stringify(browserConfig));
		console.log(`[CodePairing:Socket] Baileys version:`, version);
	}
	const sock = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		version,
		logger,
		printQRInTerminal: false,
		browser: browserConfig,
		syncFullHistory: false,
		markOnlineOnConnect: false
	});
	sock.ev.on("creds.update", () => enqueueSaveCreds(authDir, saveCreds, sessionLogger));
	sock.ev.on("connection.update", (update) => {
		try {
			const { connection, lastDisconnect, qr } = update;
			if (opts.codePairing) {console.log(`[CodePairing:Socket] connection.update: connection=${connection}, qr=${!!qr}, lastDisconnect=${JSON.stringify(lastDisconnect)}`);}
			if (qr) {
				opts.onQr?.(qr);
				if (printQr) {
					console.log("Scan this QR in WhatsApp (Linked Devices):");
					qrcode.generate(qr, { small: true });
				}
			}
			if (connection === "close") {
				if (getStatusCode(lastDisconnect?.error) === DisconnectReason.loggedOut) {console.error(danger(`WhatsApp session logged out. Run: ${formatCliCommand("openclaw channels login")}`));}
			}
			if (connection === "open") {
				if (opts.codePairing) {console.log(success("[CodePairing:Socket] CONNECTION OPEN - Pairing successful!"));}
				else if (verbose) {console.log(success("WhatsApp Web connected."));}
			}
		} catch (err) {
			sessionLogger.error({ error: String(err) }, "connection.update handler error");
		}
	});
	if (sock.ws && typeof sock.ws.on === "function") {sock.ws.on("error", (err) => {
		sessionLogger.error({ error: String(err) }, "WebSocket error");
	});}
	return sock;
}
async function waitForWaConnection(sock) {
	return new Promise((resolve, reject) => {
		const evWithOff = sock.ev;
		const handler = (...args) => {
			const update = args[0] ?? {};
			if (update.connection === "open") {
				evWithOff.off?.("connection.update", handler);
				resolve();
			}
			if (update.connection === "close") {
				evWithOff.off?.("connection.update", handler);
				reject(update.lastDisconnect ?? /* @__PURE__ */ new Error("Connection closed"));
			}
		};
		sock.ev.on("connection.update", handler);
	});
}
function getStatusCode(err) {
	const directStatus = err?.output?.statusCode ?? err?.status;
	if (directStatus !== void 0) {return directStatus;}
	const nestedErr = err?.error;
	if (nestedErr) {return nestedErr?.output?.statusCode ?? nestedErr?.status;}
}
function safeStringify(value, limit = 800) {
	try {
		const seen = /* @__PURE__ */ new WeakSet();
		const raw = JSON.stringify(value, (_key, v) => {
			if (typeof v === "bigint") {return v.toString();}
			if (typeof v === "function") {
				const maybeName = v.name;
				return `[Function ${typeof maybeName === "string" && maybeName.length > 0 ? maybeName : "anonymous"}]`;
			}
			if (typeof v === "object" && v) {
				if (seen.has(v)) {return "[Circular]";}
				seen.add(v);
			}
			return v;
		}, 2);
		if (!raw) {return String(value);}
		return raw.length > limit ? `${raw.slice(0, limit)}…` : raw;
	} catch {
		return String(value);
	}
}
function extractBoomDetails(err) {
	if (!err || typeof err !== "object") {return null;}
	const output = err?.output;
	if (!output || typeof output !== "object") {return null;}
	const payload = output.payload;
	const statusCode = typeof output.statusCode === "number" ? output.statusCode : typeof payload?.statusCode === "number" ? payload.statusCode : void 0;
	const error = typeof payload?.error === "string" ? payload.error : void 0;
	const message = typeof payload?.message === "string" ? payload.message : void 0;
	if (!statusCode && !error && !message) {return null;}
	return {
		statusCode,
		error,
		message
	};
}
function formatError(err) {
	if (err instanceof Error) {return err.message;}
	if (typeof err === "string") {return err;}
	if (!err || typeof err !== "object") {return String(err);}
	const boom = extractBoomDetails(err) ?? extractBoomDetails(err?.error) ?? extractBoomDetails(err?.lastDisconnect?.error);
	const status = boom?.statusCode ?? getStatusCode(err);
	const code = err?.code;
	const codeText = typeof code === "string" || typeof code === "number" ? String(code) : void 0;
	const message = [
		boom?.message,
		typeof err?.message === "string" ? err.message : void 0,
		typeof err?.error?.message === "string" ? err.error?.message : void 0
	].filter((v) => Boolean(v && v.trim().length > 0))[0];
	const pieces = [];
	if (typeof status === "number") {pieces.push(`status=${status}`);}
	if (boom?.error) {pieces.push(boom.error);}
	if (message) {pieces.push(message);}
	if (codeText) {pieces.push(`code=${codeText}`);}
	if (pieces.length > 0) {return pieces.join(" ");}
	return safeStringify(err);
}

//#endregion
export { waitForWaConnection as i, formatError as n, getStatusCode as r, createWaSocket as t };