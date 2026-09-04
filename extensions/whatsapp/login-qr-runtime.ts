import { createLazyRuntimeModule } from "openclaw/plugin-sdk/lazy-runtime";
// Whatsapp plugin module implements login qr runtime behavior.
type StartWebLoginWithQr = typeof import("./src/login-qr.js").startWebLoginWithQr;
type StartWebLoginWithCode = typeof import("./src/login-qr.js").startWebLoginWithCode;
type WaitForWebLogin = typeof import("./src/login-qr.js").waitForWebLogin;

const loadLoginQrModule = createLazyRuntimeModule(() => import("./src/login-qr.js"));

export async function startWebLoginWithQr(
  ...args: Parameters<StartWebLoginWithQr>
): ReturnType<StartWebLoginWithQr> {
  const { startWebLoginWithQr: startWebLoginWithQrLocal } = await loadLoginQrModule();
  return await startWebLoginWithQrLocal(...args);
}

export async function startWebLoginWithCode(
  ...args: Parameters<StartWebLoginWithCode>
): ReturnType<StartWebLoginWithCode> {
  const { startWebLoginWithCode: startWebLoginWithCodeLocal } = await loadLoginQrModule();
  return await startWebLoginWithCodeLocal(...args);
}

export async function waitForWebLogin(
  ...args: Parameters<WaitForWebLogin>
): ReturnType<WaitForWebLogin> {
  const { waitForWebLogin: waitForWebLoginLocal } = await loadLoginQrModule();
  return await waitForWebLoginLocal(...args);
}
