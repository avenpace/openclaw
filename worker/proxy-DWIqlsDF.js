import { Vn as __exportAll } from "./config-5NZVrebk.js";
import { ProxyAgent, fetch } from "undici";

//#region src/telegram/proxy.ts
var proxy_exports = /* @__PURE__ */ __exportAll({ makeProxyFetch: () => makeProxyFetch });
function makeProxyFetch(proxyUrl) {
	const agent = new ProxyAgent(proxyUrl);
	const fetcher = ((input, init) => fetch(input, {
		...init,
		dispatcher: agent
	}));
	return fetcher;
}

//#endregion
export { proxy_exports as n, makeProxyFetch as t };