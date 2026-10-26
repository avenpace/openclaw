#!/usr/bin/env node
// Media Studio CLI — the persona asks the studio for images; renders happen on a GPU machine
// that polls the platform queue, so results are NOT immediate. Prints ONE JSON line per call.
//
// Usage (run from the persona workspace, or set CLAWKU_PERSONA_ID):
//   node /app/openclaw/system-skills/media-studio/media.mjs request --title "<t>" --prompt "<scene>" \
//        [--product "<name>"] [--ref <url>]... [--aspect 4:5|1:1|9:16|16:9] [--caption "<c>"] \
//        [--notify whatsapp:<number>] [--notes "<n>"]
//   node /app/openclaw/system-skills/media-studio/media.mjs status <id>
//   node /app/openclaw/system-skills/media-studio/media.mjs list [--status QUEUED|RENDERING|DONE|FAILED] [--limit 20]
//   node /app/openclaw/system-skills/media-studio/media.mjs caption <id> "<caption>"
//   node /app/openclaw/system-skills/media-studio/media.mjs approve <id>
//   node /app/openclaw/system-skills/media-studio/media.mjs reject <id> "<note>"
//   node /app/openclaw/system-skills/media-studio/media.mjs posted <id> <postUrl>
//   node /app/openclaw/system-skills/media-studio/media.mjs cancel <id>

import { prisma } from "/app/dist/db/prisma.js";
import {
  parseRequestArgs,
  parseListArgs,
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
  MediaJobError,
} from "/app/dist/services/media-jobs.js";

function resolvePersonaId() {
  if (process.env.CLAWKU_PERSONA_ID) return process.env.CLAWKU_PERSONA_ID;
  const m = process.cwd().match(/personas\/([a-z0-9]+)/i);
  return m ? m[1] : null;
}

const brief = (j) => ({
  id: j.id,
  status: j.status,
  review: j.review,
  title: j.title,
  caption: j.caption,
  resultUrl: j.resultUrl,
  postedUrl: j.postedUrl,
  error: j.error,
  createdAt: j.createdAt,
  finishedAt: j.finishedAt,
});

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

try {
  let r;
  switch (cmd) {
    case "request": {
      const a = parseRequestArgs(args);
      const { job, position } = await createMediaJob(personaId, a);
      r = {
        id: job.id,
        status: job.status,
        position,
        etaMinutes: position * 6,
        notify: job.notifyChannel ? `${job.notifyChannel}:${job.notifyTo}` : null,
      };
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
