import { DEFAULT_CONNECTION_CONFIG } from "baileys";

export function createBaileysSignalRepository(
  ...args: Parameters<typeof DEFAULT_CONNECTION_CONFIG.makeSignalRepository>
) {
  return DEFAULT_CONNECTION_CONFIG.makeSignalRepository(...args);
}

export {
  Browsers,
  BufferJSON,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
} from "baileys";
// Clawku: the same multi-file auth state, sealed at rest (creds-auth-state.ts).
export { useClawkuMultiFileAuthState as useMultiFileAuthState } from "./creds-auth-state.js";
