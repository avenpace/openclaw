import { Dt as loadConfig, Et as resolveWhatsAppAccount, Ft as waitForWaConnection, Ht as webAuthExists, Mt as createWaSocket, Nt as formatError, Pt as getStatusCode, Vt as readWebSelfId, Xt as defaultRuntime, an as danger, jt as logInfo, ln as success, on as info, zt as logoutWeb } from "./whatsapp-worker.js";
import { DisconnectReason } from "@whiskeysockets/baileys";
import { randomUUID } from "node:crypto";
import QRCodeModule from "qrcode-terminal/vendor/QRCode/index.js";
import QRErrorCorrectLevelModule from "qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel.js";
import { deflateSync } from "node:zlib";

//#region src/media/png-encode.ts
/**
* Minimal PNG encoder for generating simple RGBA images without native dependencies.
* Used for QR codes, live probes, and other programmatic image generation.
*/
const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i += 1) {
		let c = i;
		for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
})();
/** Compute CRC32 checksum for a buffer (used in PNG chunk encoding). */
function crc32(buf) {
	let crc = 4294967295;
	for (let i = 0; i < buf.length; i += 1) crc = CRC_TABLE[(crc ^ buf[i]) & 255] ^ crc >>> 8;
	return (crc ^ 4294967295) >>> 0;
}
/** Create a PNG chunk with type, data, and CRC. */
function pngChunk(type, data) {
	const typeBuf = Buffer.from(type, "ascii");
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const crc = crc32(Buffer.concat([typeBuf, data]));
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc, 0);
	return Buffer.concat([
		len,
		typeBuf,
		data,
		crcBuf
	]);
}
/** Write a pixel to an RGBA buffer. Ignores out-of-bounds writes. */
function fillPixel(buf, x, y, width, r, g, b, a = 255) {
	if (x < 0 || y < 0 || x >= width) return;
	const idx = (y * width + x) * 4;
	if (idx < 0 || idx + 3 >= buf.length) return;
	buf[idx] = r;
	buf[idx + 1] = g;
	buf[idx + 2] = b;
	buf[idx + 3] = a;
}
/** Encode an RGBA buffer as a PNG image. */
function encodePngRgba(buffer, width, height) {
	const stride = width * 4;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let row = 0; row < height; row += 1) {
		const rawOffset = row * (stride + 1);
		raw[rawOffset] = 0;
		buffer.copy(raw, rawOffset + 1, row * stride, row * stride + stride);
	}
	const compressed = deflateSync(raw);
	const signature = Buffer.from([
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;
	return Buffer.concat([
		signature,
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", compressed),
		pngChunk("IEND", Buffer.alloc(0))
	]);
}

//#endregion
//#region src/web/qr-image.ts
const QRCode = QRCodeModule;
const QRErrorCorrectLevel = QRErrorCorrectLevelModule;
function createQrMatrix(input) {
	const qr = new QRCode(-1, QRErrorCorrectLevel.L);
	qr.addData(input);
	qr.make();
	return qr;
}
async function renderQrPngBase64(input, opts = {}) {
	const { scale = 6, marginModules = 4 } = opts;
	const qr = createQrMatrix(input);
	const modules = qr.getModuleCount();
	const size = (modules + marginModules * 2) * scale;
	const buf = Buffer.alloc(size * size * 4, 255);
	for (let row = 0; row < modules; row += 1) for (let col = 0; col < modules; col += 1) {
		if (!qr.isDark(row, col)) continue;
		const startX = (col + marginModules) * scale;
		const startY = (row + marginModules) * scale;
		for (let y = 0; y < scale; y += 1) {
			const pixelY = startY + y;
			for (let x = 0; x < scale; x += 1) fillPixel(buf, startX + x, pixelY, size, 0, 0, 0, 255);
		}
	}
	return encodePngRgba(buf, size, size).toString("base64");
}

//#endregion
//#region src/web/login-qr.ts
const ACTIVE_LOGIN_TTL_MS = 3 * 6e4;
const activeLogins = /* @__PURE__ */ new Map();
function closeSocket(sock) {
	try {
		sock.ws?.close();
	} catch {}
}
async function resetActiveLogin(accountId, reason) {
	const login = activeLogins.get(accountId);
	if (login) {
		closeSocket(login.sock);
		activeLogins.delete(accountId);
	}
	if (reason) logInfo(reason);
}
function isLoginFresh(login) {
	return Date.now() - login.startedAt < ACTIVE_LOGIN_TTL_MS;
}
function attachLoginWaiter(accountId, login) {
	login.waitPromise = waitForWaConnection(login.sock).then(() => {
		const current = activeLogins.get(accountId);
		if (current?.id === login.id) current.connected = true;
	}).catch((err) => {
		const current = activeLogins.get(accountId);
		if (current?.id !== login.id) return;
		current.error = formatError(err);
		current.errorStatus = getStatusCode(err);
	});
}
async function restartLoginSocket(login, runtime) {
	if (login.restartAttempted) return false;
	login.restartAttempted = true;
	runtime.log(info("WhatsApp asked for a restart after pairing (code 515); retrying connection once…"));
	closeSocket(login.sock);
	try {
		login.sock = await createWaSocket(false, login.verbose, {
			authDir: login.authDir,
			encryptionKey: login.encryptionKey
		});
		login.connected = false;
		login.error = void 0;
		login.errorStatus = void 0;
		attachLoginWaiter(login.accountId, login);
		return true;
	} catch (err) {
		login.error = formatError(err);
		login.errorStatus = getStatusCode(err);
		return false;
	}
}
const MAX_CODE_RETRIES = 5;
/**
* Auto-retry pairing code when connection fails (like WhatsApp Web does).
* This handles the 428 "Precondition Required" error by requesting a fresh code.
*/
async function retryPairingCode(login) {
	if (!login.phoneNumber) return null;
	if (login.codeRetryCount >= MAX_CODE_RETRIES) {
		login.runtime?.log(danger(`[CodePairing] Max retries (${MAX_CODE_RETRIES}) reached, giving up`));
		return null;
	}
	login.codeRetryCount++;
	login.runtime?.log(info(`[CodePairing] Retrying pairing code (attempt ${login.codeRetryCount})...`));
	closeSocket(login.sock);
	let newSock;
	let socketReady = false;
	try {
		socketReady = await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject(/* @__PURE__ */ new Error("Timeout")), 3e4);
			newSock = void 0;
			createWaSocket(false, login.verbose, {
				authDir: login.authDir,
				encryptionKey: login.encryptionKey,
				onQr: () => {
					clearTimeout(timeout);
					resolve(true);
				}
			}).then((sock) => {
				newSock = sock;
				sock.ev.on("connection.update", (update) => {
					if (update.connection === "close") {
						clearTimeout(timeout);
						reject(update.lastDisconnect ?? /* @__PURE__ */ new Error("Connection closed"));
					}
				});
			}).catch((err) => {
				clearTimeout(timeout);
				reject(err);
			});
		});
	} catch (err) {
		login.runtime?.log(danger(`[CodePairing] Failed to create new socket: ${formatError(err)}`));
		return null;
	}
	if (!newSock || !socketReady) return null;
	try {
		const phoneDigits = login.phoneNumber.slice(1);
		const newCode = await newSock.requestPairingCode(phoneDigits);
		const formattedCode = newCode.length === 8 ? `${newCode.slice(0, 4)}-${newCode.slice(4)}` : newCode;
		login.runtime?.log(info(`[CodePairing] New pairing code: ${formattedCode}`));
		login.sock = newSock;
		login.pairingCode = formattedCode;
		login.error = void 0;
		login.errorStatus = void 0;
		attachLoginWaiter(login.accountId, login);
		setupCodePairingRetryHandler(login);
		return formattedCode;
	} catch (err) {
		closeSocket(newSock);
		login.runtime?.log(danger(`[CodePairing] Failed to get new pairing code: ${formatError(err)}`));
		return null;
	}
}
/**
* Set up the connection event handler that auto-retries on 428/close.
*/
function setupCodePairingRetryHandler(login) {
	login.sock.ev.on("connection.update", async (update) => {
		login.runtime?.log(info(`[CodePairing] connection.update: ${JSON.stringify(update)}`));
		if (update.connection === "close" && !login.connected) {
			const statusCode = getStatusCode(update.lastDisconnect);
			if (statusCode === 428 || !login.error) {
				login.runtime?.log(info(`[CodePairing] Connection closed (${statusCode}), auto-retrying with fresh code...`));
				if (!await retryPairingCode(login)) {
					login.error = "Failed to get new pairing code after retry";
					login.errorStatus = statusCode;
				}
			}
		}
	});
}
async function startWebLoginWithQr(opts = {}) {
	const runtime = opts.runtime ?? defaultRuntime;
	const resolvedAccount = resolveWhatsAppAccount({
		cfg: loadConfig(),
		accountId: opts.accountId
	});
	const account = opts.authDir ? {
		...resolvedAccount,
		authDir: opts.authDir
	} : resolvedAccount;
	const hasWeb = await webAuthExists(account.authDir);
	const selfId = readWebSelfId(account.authDir);
	if (hasWeb && !opts.force) return { message: `WhatsApp is already linked (${selfId.e164 ?? selfId.jid ?? "unknown"}). Say “relink” if you want a fresh QR.` };
	const existing = activeLogins.get(account.accountId);
	if (!opts.force && existing && isLoginFresh(existing) && existing.qrDataUrl) return {
		qrDataUrl: existing.qrDataUrl,
		message: "QR already active. Scan it in WhatsApp → Linked Devices."
	};
	await resetActiveLogin(account.accountId);
	let resolveQr = null;
	let rejectQr = null;
	const qrPromise = new Promise((resolve, reject) => {
		resolveQr = resolve;
		rejectQr = reject;
	});
	const qrTimer = setTimeout(() => {
		rejectQr?.(/* @__PURE__ */ new Error("Timed out waiting for WhatsApp QR"));
	}, Math.max(opts.timeoutMs ?? 3e4, 5e3));
	let sock;
	let pendingQr = null;
	try {
		sock = await createWaSocket(false, Boolean(opts.verbose), {
			authDir: account.authDir,
			encryptionKey: opts.encryptionKey,
			onQr: (qr) => {
				if (pendingQr) return;
				pendingQr = qr;
				const current = activeLogins.get(account.accountId);
				if (current && !current.qr) current.qr = qr;
				clearTimeout(qrTimer);
				runtime.log(info("WhatsApp QR received."));
				resolveQr?.(qr);
			}
		});
	} catch (err) {
		clearTimeout(qrTimer);
		await resetActiveLogin(account.accountId);
		return { message: `Failed to start WhatsApp login: ${String(err)}` };
	}
	const login = {
		accountId: account.accountId,
		authDir: account.authDir,
		isLegacyAuthDir: account.isLegacyAuthDir,
		id: randomUUID(),
		sock,
		startedAt: Date.now(),
		connected: false,
		waitPromise: Promise.resolve(),
		restartAttempted: false,
		verbose: Boolean(opts.verbose),
		encryptionKey: opts.encryptionKey,
		codeRetryCount: 0
	};
	activeLogins.set(account.accountId, login);
	if (pendingQr && !login.qr) login.qr = pendingQr;
	attachLoginWaiter(account.accountId, login);
	let qr;
	try {
		qr = await qrPromise;
	} catch (err) {
		clearTimeout(qrTimer);
		await resetActiveLogin(account.accountId);
		return { message: `Failed to get QR: ${String(err)}` };
	}
	login.qrDataUrl = `data:image/png;base64,${await renderQrPngBase64(qr)}`;
	return {
		qrDataUrl: login.qrDataUrl,
		message: "Scan this QR in WhatsApp → Linked Devices."
	};
}
async function waitForWebLogin(opts = {}) {
	const runtime = opts.runtime ?? defaultRuntime;
	const account = resolveWhatsAppAccount({
		cfg: loadConfig(),
		accountId: opts.accountId
	});
	const activeLogin = activeLogins.get(account.accountId);
	if (!activeLogin) return {
		connected: false,
		message: "No active WhatsApp login in progress."
	};
	const login = activeLogin;
	if (!isLoginFresh(login)) {
		await resetActiveLogin(account.accountId);
		return {
			connected: false,
			message: "The login QR expired. Ask me to generate a new one."
		};
	}
	const timeoutMs = Math.max(opts.timeoutMs ?? 12e4, 1e3);
	const deadline = Date.now() + timeoutMs;
	while (true) {
		const remaining = deadline - Date.now();
		if (remaining <= 0) return {
			connected: false,
			message: "Still waiting for the QR scan. Let me know when you’ve scanned it."
		};
		const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), remaining));
		if (await Promise.race([login.waitPromise.then(() => "done"), timeout]) === "timeout") return {
			connected: false,
			message: "Still waiting for the QR scan. Let me know when you’ve scanned it."
		};
		if (login.error) {
			if (login.errorStatus === DisconnectReason.loggedOut) {
				await logoutWeb({
					authDir: login.authDir,
					isLegacyAuthDir: login.isLegacyAuthDir,
					runtime
				});
				const message = "WhatsApp reported the session is logged out. Cleared cached web session; please scan a new QR.";
				await resetActiveLogin(account.accountId, message);
				runtime.log(danger(message));
				return {
					connected: false,
					message
				};
			}
			if (login.errorStatus === 515) {
				if (await restartLoginSocket(login, runtime) && isLoginFresh(login)) continue;
			}
			const message = `WhatsApp login failed: ${login.error}`;
			await resetActiveLogin(account.accountId, message);
			runtime.log(danger(message));
			return {
				connected: false,
				message
			};
		}
		if (login.connected) {
			const message = "✅ Linked! WhatsApp is ready.";
			runtime.log(success(message));
			await resetActiveLogin(account.accountId);
			return {
				connected: true,
				message
			};
		}
		return {
			connected: false,
			message: "Login ended without a connection."
		};
	}
}
/**
* Start WhatsApp login using phone number + pairing code (alternative to QR).
* User enters the returned 8-digit code in WhatsApp → Linked Devices → Link with phone number.
*/
async function startWebLoginWithCode(opts) {
	const runtime = opts.runtime ?? defaultRuntime;
	const resolvedAccount = resolveWhatsAppAccount({
		cfg: loadConfig(),
		accountId: opts.accountId
	});
	const account = opts.authDir ? {
		...resolvedAccount,
		authDir: opts.authDir
	} : resolvedAccount;
	const hasWeb = await webAuthExists(account.authDir);
	const selfId = readWebSelfId(account.authDir);
	if (hasWeb && !opts.force) return { message: `WhatsApp is already linked (${selfId.e164 ?? selfId.jid ?? "unknown"}). Use force=true for fresh pairing.` };
	await resetActiveLogin(account.accountId);
	const phoneNumber = opts.phoneNumber.replace(/\s+/g, "");
	if (!/^\+\d{10,15}$/.test(phoneNumber)) return { message: "Invalid phone number format. Use E.164 format: +6281234567890" };
	let sock;
	let socketReadyPromise;
	try {
		let resolveReady;
		let rejectReady;
		socketReadyPromise = new Promise((resolve, reject) => {
			resolveReady = resolve;
			rejectReady = reject;
		});
		const readyTimeout = setTimeout(() => {
			rejectReady(/* @__PURE__ */ new Error("Timeout waiting for WhatsApp connection"));
		}, Math.max(opts.timeoutMs ?? 3e4, 1e4));
		sock = await createWaSocket(false, Boolean(opts.verbose), {
			authDir: account.authDir,
			encryptionKey: opts.encryptionKey,
			onQr: () => {
				clearTimeout(readyTimeout);
				resolveReady(true);
			}
		});
		sock.ev.on("connection.update", (update) => {
			if (update.connection === "close") {
				clearTimeout(readyTimeout);
				rejectReady(update.lastDisconnect ?? /* @__PURE__ */ new Error("Connection closed before ready"));
			}
		});
	} catch (err) {
		return { message: `Failed to start WhatsApp connection: ${String(err)}` };
	}
	try {
		await socketReadyPromise;
		runtime.log(info("WhatsApp socket ready, requesting pairing code..."));
	} catch (err) {
		closeSocket(sock);
		return { message: `WhatsApp connection failed: ${formatError(err)}` };
	}
	let pairingCode;
	try {
		const phoneDigits = phoneNumber.slice(1);
		pairingCode = await sock.requestPairingCode(phoneDigits);
		runtime.log(info(`WhatsApp pairing code generated for ${phoneNumber}`));
	} catch (err) {
		closeSocket(sock);
		return { message: `Failed to get pairing code: ${formatError(err)}` };
	}
	const formattedCode = pairingCode.length === 8 ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` : pairingCode;
	const login = {
		accountId: account.accountId,
		authDir: account.authDir,
		isLegacyAuthDir: account.isLegacyAuthDir,
		id: randomUUID(),
		sock,
		startedAt: Date.now(),
		connected: false,
		waitPromise: Promise.resolve(),
		restartAttempted: false,
		verbose: Boolean(opts.verbose),
		encryptionKey: opts.encryptionKey,
		pairingCode: formattedCode,
		phoneNumber,
		codeRetryCount: 0,
		runtime
	};
	activeLogins.set(account.accountId, login);
	attachLoginWaiter(account.accountId, login);
	setupCodePairingRetryHandler(login);
	return {
		pairingCode: formattedCode,
		message: "Enter this code in WhatsApp → Linked Devices → Link with phone number."
	};
}
/**
* Get the current status of code-based pairing.
* Use this to poll for updated pairing codes (auto-retry generates new codes).
*/
function getCodePairingStatus(opts) {
	const account = resolveWhatsAppAccount({
		cfg: loadConfig(),
		accountId: opts.accountId
	});
	const login = activeLogins.get(account.accountId);
	if (!login || !login.pairingCode) return {
		active: false,
		connected: false,
		retryCount: 0
	};
	return {
		active: isLoginFresh(login),
		pairingCode: login.pairingCode,
		connected: login.connected,
		error: login.error,
		retryCount: login.codeRetryCount
	};
}

//#endregion
export { getCodePairingStatus, startWebLoginWithCode, startWebLoginWithQr, waitForWebLogin };