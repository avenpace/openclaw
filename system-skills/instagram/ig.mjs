#!/usr/bin/env node
// `ig` CLI — drive Instagram (via socmo-headless) from bash, so it works on ANY provider,
// including the OpenAI-OAuth / Codex path (which only exposes bash, not injected function tools).
// Reuses the exact same handler the ig_* function tools use — no duplicated logic.
//
// Usage (run from the persona workspace, or set CLAWKU_PERSONA_ID):
//   node /app/openclaw/system-skills/instagram/ig.mjs check
//   node /app/openclaw/system-skills/instagram/ig.mjs setup <username> <password> [otpSecret]
//   node /app/openclaw/system-skills/instagram/ig.mjs post <imageUrl> <caption...>
//   node /app/openclaw/system-skills/instagram/ig.mjs reply <postUrl> <comment...>
//   node /app/openclaw/system-skills/instagram/ig.mjs like <postUrl>
//   node /app/openclaw/system-skills/instagram/ig.mjs follow <username>
//   node /app/openclaw/system-skills/instagram/ig.mjs profile [username]
import { createInstagramHandler } from "/app/dist/services/instagram-handler.js";

function resolvePersonaId() {
  if (process.env.CLAWKU_PERSONA_ID) return process.env.CLAWKU_PERSONA_ID;
  // Persona workspace path looks like .../personas/<personaId>/...
  const m = process.cwd().match(/personas\/([a-z0-9]+)/i);
  return m ? m[1] : null;
}

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

const h = createInstagramHandler(personaId);
try {
  let r;
  switch (cmd) {
    case "check":
      r = await h.igCheck();
      break;
    case "setup":
      r = await h.igSetup(args[0], args[1], args[2]);
      break;
    case "post":
      r = await h.igPost(args.slice(1).join(" "), args[0]);
      break; // post <imageUrl> <caption...>
    case "reply":
      r = await h.igReply(args[0], args.slice(1).join(" "));
      break;
    case "like":
      r = await h.igLike(args[0]);
      break;
    case "follow":
      r = await h.igFollow(args[0]);
      break;
    case "profile":
      r = await h.igProfile(args[0]);
      break;
    default:
      console.error(
        JSON.stringify({
          error: "UNKNOWN_CMD",
          usage: "check | setup | post | reply | like | follow | profile",
        }),
      );
      process.exit(2);
  }
  console.log(JSON.stringify(r));
  process.exit(0);
} catch (e) {
  console.error(
    JSON.stringify({ error: "IG_ERROR", message: e instanceof Error ? e.message : String(e) }),
  );
  process.exit(1);
}
