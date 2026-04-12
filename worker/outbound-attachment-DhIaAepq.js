import { rc as saveMediaBuffer } from "./config-DU_NmThJ.js";
import { a as loadWebMedia } from "./ir-BO9afMew.js";
import { t as buildOutboundMediaLoadOptions } from "./load-options-9-C7C5wO.js";
//#region src/media/outbound-attachment.ts
async function resolveOutboundAttachmentFromUrl(mediaUrl, maxBytes, options) {
  const media = await loadWebMedia(
    mediaUrl,
    buildOutboundMediaLoadOptions({
      maxBytes,
      mediaLocalRoots: options?.localRoots,
    }),
  );
  const saved = await saveMediaBuffer(
    media.buffer,
    media.contentType ?? void 0,
    "outbound",
    maxBytes,
  );
  return {
    path: saved.path,
    contentType: saved.contentType,
  };
}
//#endregion
export { resolveOutboundAttachmentFromUrl as t };
