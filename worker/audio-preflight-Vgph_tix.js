import "./config-5NZVrebk.js";
import { Q as logVerbose, tt as shouldLogVerbose } from "./subsystem-CZjf--pX.js";
import "./paths-DCNrSyZW.js";
import "./agent-scope-ScGrwqyV.js";
import "./path-alias-guards-BLdY2C8K.js";
import "./fs-safe-DbG7MkZI.js";
import "./ssrf-BuTqKYS4.js";
import "./image-ops-D0tvLkR5.js";
import "./store-Dxq5cXiE.js";
import "./env-Cm5puq-Z.js";
import "./accounts-DT0m_BMj.js";
import "./github-copilot-token-DA_R8Vd-.js";
import "./dock-6pEuFsc1.js";
import "./plugins-sjvd3vNx.js";
import "./bindings-BQwg6qpO.js";
import "./accounts-CssugA8m.js";
import "./accounts-BF0vgJzP.js";
import "./thinking-TjNtx91v.js";
import "./message-channel-CT-AG0Zl.js";
import "./sessions-B6xyLi77.js";
import "./paths-BzaTEloz.js";
import "./pi-model-discovery-DHHx5lM1.js";
import "./pi-embedded-helpers-BD8Lfyvz.js";
import "./chrome-jcVcRQ9G.js";
import "./skills-DdCpXfCI.js";
import "./redact-Yttj_y9u.js";
import "./errors-pWR6MKpJ.js";
import "./tool-images-B7_cfAZg.js";
import "./image-CcjOMkEw.js";
import "./gemini-auth-ET7IDSc0.js";
import "./fetch-guard-DFPItc0w.js";
import "./local-roots-Ct_z9D74.js";
import { a as resolveMediaAttachmentLocalRoots, n as createMediaAttachmentCache, o as runCapability, r as normalizeMediaAttachments, t as buildProviderRegistry, u as isAudioAttachment } from "./runner-BCJsS5e7.js";

//#region src/media-understanding/audio-preflight.ts
/**
* Transcribes the first audio attachment BEFORE mention checking.
* This allows voice notes to be processed in group chats with requireMention: true.
* Returns the transcript or undefined if transcription fails or no audio is found.
*/
async function transcribeFirstAudio(params) {
	const { ctx, cfg } = params;
	const audioConfig = cfg.tools?.media?.audio;
	if (!audioConfig || audioConfig.enabled === false) {return;}
	const attachments = normalizeMediaAttachments(ctx);
	if (!attachments || attachments.length === 0) {return;}
	const firstAudio = attachments.find((att) => att && isAudioAttachment(att) && !att.alreadyTranscribed);
	if (!firstAudio) {return;}
	if (shouldLogVerbose()) {logVerbose(`audio-preflight: transcribing attachment ${firstAudio.index} for mention check`);}
	const providerRegistry = buildProviderRegistry(params.providers);
	const cache = createMediaAttachmentCache(attachments, { localPathRoots: resolveMediaAttachmentLocalRoots({
		cfg,
		ctx
	}) });
	try {
		const result = await runCapability({
			capability: "audio",
			cfg,
			ctx,
			attachments: cache,
			media: attachments,
			agentDir: params.agentDir,
			providerRegistry,
			config: audioConfig,
			activeModel: params.activeModel
		});
		if (!result || result.outputs.length === 0) {return;}
		const audioOutput = result.outputs.find((output) => output.kind === "audio.transcription");
		if (!audioOutput || !audioOutput.text) {return;}
		firstAudio.alreadyTranscribed = true;
		if (shouldLogVerbose()) {logVerbose(`audio-preflight: transcribed ${audioOutput.text.length} chars from attachment ${firstAudio.index}`);}
		return audioOutput.text;
	} catch (err) {
		if (shouldLogVerbose()) {logVerbose(`audio-preflight: transcription failed: ${String(err)}`);}
		return;
	} finally {
		await cache.cleanup();
	}
}

//#endregion
export { transcribeFirstAudio };