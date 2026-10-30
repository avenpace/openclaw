#!/usr/bin/env node
// Media Studio CLI — the persona asks the studio for images and clips; work happens on a GPU
// machine that polls the platform queue, so results are NOT immediate. Prints ONE JSON line per call.
//
// Usage (run from the persona workspace, or set CLAWKU_PERSONA_ID):
//   node /app/openclaw/system-skills/media-studio/media.mjs request --title "<t>" --prompt "<scene>" \
//        [--product "<name>"] [--ref <url>]... [--aspect 4:5|1:1|9:16|16:9] [--caption "<c>"] \
//        [--notify whatsapp:<number>] [--notes "<n>"]
//   node .../media.mjs status <id>
//   node .../media.mjs list [--status QUEUED|RENDERING|DONE|FAILED] [--kind image|transcribe|clip] [--source <id>] [--limit 20]
//   node .../media.mjs caption <id> "<caption>"
//   node .../media.mjs approve <id>  |  reject <id> "<note>"  |  posted <id> <postUrl>  |  cancel <id>
//
// Clipper (long video -> short clips):
//   node .../media.mjs source add --title "<t>" --url <link>      # YouTube / Drive / direct mp4 link
//   node .../media.mjs sources
//   node .../media.mjs transcribe <sourceId> [--lang id|en]
//   node .../media.mjs transcript <sourceId> [--from mm:ss] [--to mm:ss] [--grep "<word>"]
//   node .../media.mjs clip --source <sourceId> --start <s|mm:ss> --end <s|mm:ss> --title "<t>" \
//        [--hook "<overlay title>"] [--caption "<c>"] [--aspect 9:16] [--no-captions] [--notes "<n>"]

import { prisma } from "/app/dist/db/prisma.js";
import {
  parseRequestArgs,
  parseListArgs,
  parseClipArgs,
  parseSourceAddArgs,
  parseTranscriptArgs,
  parseFlags,
  CliUsageError,
  USAGE,
} from "/app/dist/services/media-cli-args.js";
import {
  createMediaJob,
  listMediaJobs,
  getMediaJob,
  setCaption,
  setReview,
  markPosted,
  cancelMediaJob,
  createMediaSource,
  listMediaSources,
  getOwnedMediaSource,
  readTranscript,
  MediaJobError,
} from "/app/dist/services/media-jobs.js";

function resolvePersonaId() {
  if (process.env.CLAWKU_PERSONA_ID) return process.env.CLAWKU_PERSONA_ID;
  const m = process.cwd().match(/personas\/([a-z0-9]+)/i);
  return m ? m[1] : null;
}

const brief = (j) => ({
  id: j.id,
  kind: j.kind,
  status: j.status,
  review: j.review,
  title: j.title,
  caption: j.caption,
  sourceId: j.sourceId ?? undefined,
  span:
    j.brief && j.brief.startS !== undefined
      ? { startS: j.brief.startS, endS: j.brief.endS }
      : undefined,
  durationS: j.durationS ?? undefined,
  resultUrl: j.resultUrl,
  thumbUrl: j.thumbUrl ?? undefined,
  postedUrl: j.postedUrl,
  error: j.error,
  createdAt: j.createdAt,
  finishedAt: j.finishedAt,
});

const sourceBrief = (s) => ({
  id: s.id,
  title: s.title,
  status: s.status,
  link: s.sourceUrl || s.url,
  durationS: s.durationS,
  language: s.language,
  transcript: s.transcriptUrl ? "ready" : s.status === "TRANSCRIBING" ? "in progress" : "none",
  error: s.error,
  createdAt: s.createdAt,
});

const mmss = (s) => {
  const t = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  return (
    (h ? `${h}:${String(m).padStart(2, "0")}` : String(m)) + ":" + String(sec).padStart(2, "0")
  );
};

const [, , cmd, ...args] = process.argv;
const personaId = resolvePersonaId();
if (!personaId) {
  console.error(
    JSON.stringify({
      error: "NO_PERSONA_ID",
      hint: "run from the persona workspace or set CLAWKU_PERSONA_ID",
    }),
  );
  process.exit(1);
}

const needId = () => {
  if (!args[0]) throw new CliUsageError(`${cmd} needs a job id`);
  return args[0];
};

const queued = (job, position, etaPerJobMin) => ({
  id: job.id,
  kind: job.kind,
  status: job.status,
  position,
  etaMinutes: position * etaPerJobMin,
  notify: job.notifyChannel ? `${job.notifyChannel}:${job.notifyTo}` : null,
});

try {
  let r;
  switch (cmd) {
    case "request": {
      const a = parseRequestArgs(args);
      const { job, position } = await createMediaJob(personaId, { ...a, kind: "image" });
      r = queued(job, position, 6);
      break;
    }
    case "status": {
      const j = await getMediaJob(needId());
      if (j.personaId !== personaId)
        throw new MediaJobError("NOT_FOUND", "Media job not found", 404);
      r = brief(j);
      break;
    }
    case "list": {
      const a = parseListArgs(args);
      r = { jobs: (await listMediaJobs(personaId, a)).map(brief) };
      break;
    }
    case "caption":
      r = brief(await setCaption(personaId, needId(), args.slice(1).join(" ")));
      break;
    case "approve":
      r = brief(await setReview(personaId, needId(), "approved"));
      break;
    case "reject":
      r = brief(
        await setReview(personaId, needId(), "rejected", args.slice(1).join(" ") || undefined),
      );
      break;
    case "posted":
      if (!args[1]) throw new CliUsageError("posted <id> <postUrl>");
      r = brief(await markPosted(personaId, needId(), args[1]));
      break;
    case "cancel":
      r = brief(await cancelMediaJob(personaId, needId()));
      break;

    // ---- clipper -------------------------------------------------------
    case "source": {
      if (args[0] !== "add") throw new CliUsageError('source add --title "<t>" --url <link>');
      const a = parseSourceAddArgs(args.slice(1));
      const s = await createMediaSource(personaId, a);
      r = { ...sourceBrief(s), next: `media.mjs transcribe ${s.id}` };
      break;
    }
    case "sources":
      r = { sources: (await listMediaSources(personaId)).map(sourceBrief) };
      break;
    case "transcribe": {
      const { flags, positional } = parseFlags(args);
      const sourceId = positional[0];
      if (!sourceId) throw new CliUsageError("transcribe <sourceId> [--lang id|en]");
      const src = await getOwnedMediaSource(personaId, sourceId);
      const { job, position } = await createMediaJob(personaId, {
        kind: "transcribe",
        title: `Transkrip: ${src.title}`,
        sourceId,
        language: flags.lang,
      });
      r = {
        ...queued(job, position, 8),
        sourceId,
        hint: "the platform briefs you with [TRANSCRIPT READY] when it is done",
      };
      break;
    }
    case "transcript": {
      const a = parseTranscriptArgs(args);
      const src = await getOwnedMediaSource(personaId, a.sourceId);
      const t = await readTranscript(personaId, a.sourceId);
      if (!t) {
        r = {
          sourceId: src.id,
          status: src.status,
          transcript: null,
          hint:
            src.status === "TRANSCRIBING"
              ? "transcription is still running"
              : `run: media.mjs transcribe ${src.id}`,
        };
        break;
      }
      let segs = t.segments;
      if (a.from !== undefined) segs = segs.filter((s) => s.end_s >= a.from);
      if (a.to !== undefined) segs = segs.filter((s) => s.start_s <= a.to);
      if (a.grep) {
        const needle = a.grep.toLowerCase();
        segs = segs.filter((s) => s.text.toLowerCase().includes(needle));
      }
      r = {
        sourceId: src.id,
        title: src.title,
        durationS: src.durationS,
        language: t.language,
        segments: segs.length,
        lines: segs.map((s) => `[${mmss(s.start_s)}-${mmss(s.end_s)}] ${s.text}`),
      };
      break;
    }
    case "clip": {
      const a = parseClipArgs(args);
      const { job, position } = await createMediaJob(personaId, {
        kind: "clip",
        title: a.title,
        sourceId: a.sourceId,
        startS: a.startS,
        endS: a.endS,
        hook: a.hook,
        caption: a.caption,
        aspect: a.aspect,
        captions: a.captions,
        language: a.language,
        notes: a.notes,
        notify: a.notify,
      });
      r = { ...queued(job, position, 4), span: `${mmss(a.startS)}-${mmss(a.endS)}` };
      break;
    }
    default:
      console.error(JSON.stringify({ error: "UNKNOWN_CMD", usage: USAGE }));
      process.exit(2);
  }
  console.log(JSON.stringify(r));
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  const code =
    err instanceof CliUsageError ? "USAGE" : err instanceof MediaJobError ? err.code : "ERROR";
  console.error(
    JSON.stringify({
      error: code,
      message: err.message,
      ...(code === "USAGE" ? { usage: USAGE } : {}),
    }),
  );
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
