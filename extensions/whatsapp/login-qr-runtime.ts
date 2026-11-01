type StartWebLoginWithQr = typeof import("./src/login-qr.js").startWebLoginWithQr;
type StartWebLoginWithCode = typeof import("./src/login-qr.js").startWebLoginWithCode;
type WaitForWebLogin = typeof import("./src/login-qr.js").waitForWebLogin;

export async function startWebLoginWithQr(
  ...args: Parameters<StartWebLoginWithQr>
): ReturnType<StartWebLoginWithQr> {
  const { startWebLoginWithQr: startWebLoginWithQrLocal } = await import("./src/login-qr.js");
  return await startWebLoginWithQrLocal(...args);
}

export async function startWebLoginWithCode(
  ...args: Parameters<StartWebLoginWithCode>
): ReturnType<StartWebLoginWithCode> {
  const { startWebLoginWithCode: startWebLoginWithCodeLocal } = await import("./src/login-qr.js");
  return await startWebLoginWithCodeLocal(...args);
}

export async function waitForWebLogin(
  ...args: Parameters<WaitForWebLogin>
): ReturnType<WaitForWebLogin> {
  const { waitForWebLogin: waitForWebLoginLocal } = await import("./src/login-qr.js");
  return await waitForWebLoginLocal(...args);
}
