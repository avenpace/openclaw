import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
let activeWorkers = 0;
const workerQueue = [];
const workerStatus = new Map();
async function acquireWorkerSlot(maxWorkers) {
    if (!maxWorkers || maxWorkers <= 0) {
        return () => { };
    }
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
    if (next) {
        next();
    }
}
export function getWhatsAppWorkerStatus() {
    return {
        active: activeWorkers,
        workers: Array.from(workerStatus.values()),
    };
}
function resolveWorkerEntry() {
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
function createProxyMessage(payload, call) {
    const replyTo = payload.from;
    const accountId = payload.accountId;
    return {
        ...payload,
        sendComposing: async () => {
            await call("sendComposingTo", [replyTo]);
        },
        reply: async (text) => {
            await call("sendMessage", [replyTo, text, undefined, undefined, { accountId }]);
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
                    gifPlayback: mapped.gifPlayback,
                },
            ]);
        },
    };
}
function mapMediaContent(content) {
    if ("image" in content && Buffer.isBuffer(content.image)) {
        return {
            text: content.caption ?? "",
            mediaBuffer: content.image,
            mediaType: content.mimetype ?? "image/jpeg",
        };
    }
    if ("audio" in content && Buffer.isBuffer(content.audio)) {
        return {
            text: content.caption ?? "",
            mediaBuffer: content.audio,
            mediaType: content.mimetype ?? "audio/mpeg",
        };
    }
    if ("video" in content && Buffer.isBuffer(content.video)) {
        return {
            text: content.caption ?? "",
            mediaBuffer: content.video,
            mediaType: content.mimetype ?? "video/mp4",
            gifPlayback: Boolean(content.gifPlayback),
        };
    }
    if ("document" in content && Buffer.isBuffer(content.document)) {
        return {
            text: content.caption ?? "",
            mediaBuffer: content.document,
            mediaType: content.mimetype ?? "application/octet-stream",
            fileName: content.fileName,
        };
    }
    return { text: "" };
}
export async function monitorWebInboxWorker(options) {
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
        const namePrefix = docker?.containerNamePrefix?.trim() || "openclaw-wa-";
        containerName = `${namePrefix}${safeAccount}`;
        const containerAuthDir = path.posix.join(authMountBase, safeAccount);
        const command = docker?.command?.length
            ? docker.command
            : ["node", docker?.workerEntry?.trim() || "/app/openclaw/dist/web/worker/whatsapp-worker.js"];
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
            `${options.authDir}:${containerAuthDir}`,
        ];
        if (docker?.network) {
            args.push("--network", docker.network);
        }
        for (const [key, val] of Object.entries(docker?.env ?? {})) {
            args.push("-e", `${key}=${val}`);
        }
        if (docker?.extraArgs?.length) {
            args.push(...docker.extraArgs);
        }
        args.push(image, ...command);
        child = spawn("docker", args, {
            stdio: ["pipe", "pipe", "pipe"],
            cwd: process.cwd(),
            env: { ...process.env },
        });
        // Override authDir for worker init to container path
        options = { ...options, authDir: containerAuthDir };
    }
    else {
        const { argv } = resolveWorkerEntry();
        child = spawn(process.execPath, argv, {
            stdio: ["pipe", "pipe", "pipe", "ipc"],
            cwd: process.cwd(),
            env: {
                ...process.env,
                OPENCLAW_WHATSAPP_WORKER: "1",
            },
        });
    }
    const pending = new Map();
    let closeResolve = null;
    const onClose = new Promise((resolve) => {
        closeResolve = resolve;
    });
    const resolveClose = (reason) => {
        if (!closeResolve) {
            return;
        }
        const r = closeResolve;
        closeResolve = null;
        r(reason);
    };
    const call = (method, params) => new Promise((resolve, reject) => {
        const id = randomUUID();
        pending.set(id, { resolve, reject });
        const msg = { type: "call", id, method, params };
        if (child.send) {
            child.send(msg);
        }
        else if (child.stdin) {
            child.stdin.write(`${JSON.stringify(msg)}\n`);
        }
    });
    const handleWorkerMessage = (message) => {
        if (!message || typeof message !== "object") {
            return;
        }
        if (message.type === "result") {
            const entry = pending.get(message.id);
            if (!entry) {
                return;
            }
            pending.delete(message.id);
            if (message.ok) {
                entry.resolve(message.result);
            }
            else {
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
    };
    if (!useDocker && typeof child.send === "function") {
        child.on("message", (message) => handleWorkerMessage(message));
    }
    else if (child.stdout) {
        const rl = readline.createInterface({ input: child.stdout });
        rl.on("line", (line) => {
            try {
                const msg = JSON.parse(line);
                handleWorkerMessage(msg);
            }
            catch {
                // ignore malformed lines
            }
        });
    }
    child.on("exit", (code, signal) => {
        resolveClose({
            status: undefined,
            isLoggedOut: false,
            error: `worker exited (${code ?? "null"}${signal ? `:${signal}` : ""})`,
        });
        workerStatus.delete(options.accountId);
        release();
    });
    workerStatus.set(options.accountId, {
        accountId: options.accountId,
        pid: child.pid,
        startedAtMs: Date.now(),
    });
    workerStatus.set(options.accountId, {
        accountId: options.accountId,
        pid: child.pid,
        startedAtMs: Date.now(),
        backend: useDocker ? "docker" : "child",
        containerName,
    });
    const init = {
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
    if (child.send) {
        child.send(init);
    }
    else if (child.stdin) {
        child.stdin.write(`${JSON.stringify(init)}\n`);
    }
    return {
        close: async () => {
            try {
                await call("close");
            }
            finally {
                child.kill();
                workerStatus.delete(options.accountId);
                release();
            }
        },
        onClose,
        signalClose: (reason) => {
            void call("signalClose", [reason]);
        },
        sendMessage: async (to, text, mediaBuffer, mediaType, options) => call("sendMessage", [to, text, mediaBuffer, mediaType, options]),
        sendPoll: async (to, poll) => call("sendPoll", [to, poll]),
        sendReaction: async (chatJid, messageId, emoji, fromMe, participant) => call("sendReaction", [chatJid, messageId, emoji, fromMe, participant]),
        sendComposingTo: async (to) => call("sendComposingTo", [to]),
    };
}
//# sourceMappingURL=monitor-worker.js.map