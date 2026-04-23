import "./config-DU_NmThJ.js";
import {
  i as normalizeMediaAttachments,
  o as resolveMediaAttachmentLocalRoots,
  t as runAudioTranscription,
  v as isAudioAttachment,
} from "./audio-transcription-runner-CrDuQKDe.js";
import "./paths-WDBH9p6f.js";
import "./paths-CbQMaT4w.js";
import "./env-BdVuargf.js";
import "./github-copilot-token-CfhzmK0S.js";
import "./image-9mQg8jFr.js";
import { B as shouldLogVerbose, R as logVerbose } from "./utils-CGX1uqdh.js";
import "./fetch-BOzzKyEg.js";
import "./fetch-guard-ngRT84WA.js";
import "./api-key-rotation-B4LKuL7B.js";
import "./proxy-fetch-Ds9gWJS1.js";
//#region src/media-understanding/audio-preflight.ts
/**
 * Transcribes the first audio attachment BEFORE mention checking.
 * This allows voice notes to be processed in group chats with requireMention: true.
 * Returns the transcript or undefined if transcription fails or no audio is found.
 */
async function transcribeFirstAudio(params) {
  const { ctx, cfg } = params;
  const audioConfig = cfg.tools?.media?.audio;
  if (!audioConfig || audioConfig.enabled === false) return;
  const attachments = normalizeMediaAttachments(ctx);
  if (!attachments || attachments.length === 0) return;
  const firstAudio = attachments.find(
    (att) => att && isAudioAttachment(att) && !att.alreadyTranscribed,
  );
  if (!firstAudio) return;
  if (shouldLogVerbose())
    logVerbose(`audio-preflight: transcribing attachment ${firstAudio.index} for mention check`);
  try {
    const { transcript } = await runAudioTranscription({
      ctx,
      cfg,
      attachments,
      agentDir: params.agentDir,
      providers: params.providers,
      activeModel: params.activeModel,
      localPathRoots: resolveMediaAttachmentLocalRoots({
        cfg,
        ctx,
      }),
    });
    if (!transcript) return;
    firstAudio.alreadyTranscribed = true;
    if (shouldLogVerbose())
      logVerbose(
        `audio-preflight: transcribed ${transcript.length} chars from attachment ${firstAudio.index}`,
      );
    return transcript;
  } catch (err) {
    if (shouldLogVerbose()) logVerbose(`audio-preflight: transcription failed: ${String(err)}`);
    return;
  }
}
//#endregion
export { transcribeFirstAudio };
