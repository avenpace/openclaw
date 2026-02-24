import express from "express";
import { isLoopbackHost } from "../gateway/net.js";
import { deleteBridgeAuthForPort, setBridgeAuthForPort } from "./bridge-auth-registry.js";
import { registerBrowserRoutes } from "./routes/index.js";
import { createBrowserRouteContext, } from "./server-context.js";
import { installBrowserAuthMiddleware, installBrowserCommonMiddleware, } from "./server-middleware.js";
export async function startBrowserBridgeServer(params) {
    const host = params.host ?? "127.0.0.1";
    if (!isLoopbackHost(host)) {
        throw new Error(`bridge server must bind to loopback host (got ${host})`);
    }
    const port = params.port ?? 0;
    const app = express();
    installBrowserCommonMiddleware(app);
    if (params.resolveSandboxNoVncToken) {
        app.get("/sandbox/novnc", (req, res) => {
            const rawToken = typeof req.query?.token === "string" ? req.query.token.trim() : "";
            if (!rawToken) {
                res.status(400).send("Missing token");
                return;
            }
            const redirectUrl = params.resolveSandboxNoVncToken?.(rawToken);
            if (!redirectUrl) {
                res.status(404).send("Invalid or expired token");
                return;
            }
            res.setHeader("Cache-Control", "no-store");
            res.redirect(302, redirectUrl);
        });
    }
    const authToken = params.authToken?.trim() || undefined;
    const authPassword = params.authPassword?.trim() || undefined;
    if (!authToken && !authPassword) {
        throw new Error("bridge server requires auth (authToken/authPassword missing)");
    }
    installBrowserAuthMiddleware(app, { token: authToken, password: authPassword });
    const state = {
        server: null,
        port,
        resolved: params.resolved,
        profiles: new Map(),
    };
    const ctx = createBrowserRouteContext({
        getState: () => state,
        onEnsureAttachTarget: params.onEnsureAttachTarget,
    });
    registerBrowserRoutes(app, ctx);
    const server = await new Promise((resolve, reject) => {
        const s = app.listen(port, host, () => resolve(s));
        s.once("error", reject);
    });
    const address = server.address();
    const resolvedPort = address?.port ?? port;
    state.server = server;
    state.port = resolvedPort;
    state.resolved.controlPort = resolvedPort;
    setBridgeAuthForPort(resolvedPort, { token: authToken, password: authPassword });
    const baseUrl = `http://${host}:${resolvedPort}`;
    return { server, port: resolvedPort, baseUrl, state };
}
export async function stopBrowserBridgeServer(server) {
    try {
        const address = server.address();
        if (address?.port) {
            deleteBridgeAuthForPort(address.port);
        }
    }
    catch {
        // ignore
    }
    await new Promise((resolve) => {
        server.close(() => resolve());
    });
}
//# sourceMappingURL=bridge-server.js.map