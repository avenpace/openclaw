import fs from "fs";
// ig_post_ui.mjs — feed post through Instagram's desktop web UI via the logged-in
// socmo headless session. The ONLY sanctioned publish path for @clawkustore.
//
// Gates are enforced here in code, not in the prompt:
//   1. Max ONE post per invocation; ≥3 h since the last successful post (state file).
//   2. Warning lock: any recorded Instagram warning blocks all posting until cleared
//      by the owner (delete the state file / clear the flag after checking in-app).
//   3. Session pre-check: if the browser is not logged in, abort — the OWNER does all
//      logins/checkpoints via the live-view page. This script never types credentials.
//   4. AI label must be ON before Share, or the share never happens.
//   5. Anomaly abort: checkpoint / "try again later" / restricted / logged-out text at
//      any step → abort, record the warning, report it verbatim.
//
// Usage: node ig_post_ui.mjs <image.jpg> <caption.txt>
// Env:   SOCMO_WS (default ws://socmo-headless:9222; Mac dev: ws://localhost:9222)
//        SOCMO_INSTANCE (default cmlxubuu80009b17jplv36z0o)
//        IG_POST_STATE (default /tmp/ig_post_state.json)
// Output: one final line "RESULT POSTED|REFUSED|FAILED <reason>" — parse that.
import WebSocket from "ws";

const [, , IMG, CAP] = process.argv;
const DRY = process.argv.includes("--dry");
const WS_URL = process.env.SOCMO_WS || "ws://socmo-headless:9222";
const INSTANCE = process.env.SOCMO_INSTANCE || "cmlxubuu80009b17jplv36z0o";
const STATE = process.env.IG_POST_STATE || "/tmp/ig_post_state.json";
const MIN_GAP_MS = 3 * 60 * 60 * 1000;
const die = (r, why) => {
  console.log(`RESULT ${r} ${why}`);
  process.exit(1);
};

if (!IMG || !CAP || !fs.existsSync(IMG) || !fs.existsSync(CAP))
  die("REFUSED", "usage: ig_post_ui.mjs <image> <caption-file> (both must exist)");
const caption = fs.readFileSync(CAP, "utf8").trim();
if (!caption) die("REFUSED", "empty caption");

let st = {};
try {
  st = JSON.parse(fs.readFileSync(STATE, "utf8"));
} catch {}
const now = Date.now();
if (st.warningLock)
  die(
    "REFUSED",
    `warning lock active (${st.warningLock}) — owner must clear it after checking the account in-app`,
  );
if (st.lastPostAt && now - st.lastPostAt < MIN_GAP_MS)
  die(
    "REFUSED",
    `last post ${Math.round((now - st.lastPostAt) / 60000)} min ago — ≥3 h required; queue it for the next slot`,
  );
if (st.lastPostAt && now - st.lastPostAt > 7 * 24 * 3600e3 && st.warningLock !== false) {
  // stale state older than a week without a lock — start clean
  st = {};
}

const ws = new WebSocket(WS_URL);
let n = 0;
const pending = new Map();
const call = (method, params) =>
  new Promise((res, rej) => {
    const i = ++n;
    const t = setTimeout(() => {
      pending.delete(i);
      rej(new Error("ws timeout"));
    }, 45000);
    const h = (m) => {
      const r = JSON.parse(m);
      if (r.id === i) {
        clearTimeout(t);
        ws.off("message", h);
        pending.delete(i);
        r.error ? rej(new Error(r.error)) : res(r.result);
      }
    };
    ws.on("message", h);
    pending.set(i, h);
    ws.send(JSON.stringify({ id: i, method, params: { instanceId: INSTANCE, ...params } }));
  });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Danger phrases anywhere in the active dialog/page → abort and lock.
const ANOMALY =
  /checkpoint|try again later|restricted|temporarily|isn'?t available|suspends|disabled|verify (your|it'?s)/i;
const guard = async (label) => {
  const d = await call("browser.eval", {
    script:
      'const d=document.querySelector("[role=dialog]");return ((d?d.innerText:"")+" "+document.body.innerText.slice(0,400)).replace(/\\s+/g," ")',
  });
  if (ANOMALY.test(d)) {
    const hit = d.match(ANOMALY)[0];
    st.warningLock = `${new Date().toISOString()} ${hit}`;
    st.lastWarning = d.slice(0, 300);
    fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
    die("FAILED", `IG warning at ${label}: "${hit}" — ALL posting frozen, reported to owner`);
  }
};

const find = (text) =>
  call("browser.eval", {
    script: `const t=${JSON.stringify(text)};const vis=e=>{const r=e.getBoundingClientRect();return r.width>2&&r.height>2&&r.bottom>0&&r.top<innerHeight};
 let el=[...document.querySelectorAll("svg[aria-label]")].find(s=>s.getAttribute("aria-label")===t&&vis(s));
 if(el)el=el.closest("a,button,[role=button],[role=link]")||el;
 if(!el)el=[...document.querySelectorAll("a,button,[role=button],[role=link],[role=menuitem],span,div")].filter(vis).find(e=>e.innerText&&e.innerText.trim()===t&&e.children.length<=3);
 if(!el)return null;const r=el.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})`,
  });
const click = async (text, ms = 3000) => {
  const r = await find(text);
  if (!r) return false;
  const p = JSON.parse(r);
  await call("browser.clickAt", { x: p.x, y: p.y });
  await wait(ms);
  return true;
};
const dialog = () =>
  call("browser.eval", {
    script:
      'const d=document.querySelector("[role=dialog]");return (d?d.innerText:"(no dialog)").replace(/\\s+/g," ").slice(0,300)',
  });

ws.on("error", (e) => die("FAILED", `socmo unreachable: ${e.message}`));
ws.on("open", async () => {
  try {
    // -- session pre-check ---------------------------------------------------
    await call("browser.spawn", {});
    await call("browser.emulate", { mode: "desktop" });
    await call("browser.goto", { url: "https://www.instagram.com/" });
    await wait(7000);
    const loggedOut = await call("browser.eval", {
      script: "return !!document.querySelector(\"form[action*='/accounts/login/']\")",
    });
    if (loggedOut)
      die(
        "FAILED",
        "session logged out — owner must log in via the live-view page; never script credentials",
      );
    if (await guard("pre-check")) return;

    // -- create flow ---------------------------------------------------------
    for (const t of ["Not now", "Not Now"]) await click(t, 1500);
    if (!(await click("New post")))
      if (!(await click("Create"))) die("FAILED", "create button not found");
    if (await find("Post")) await click("Post");
    await guard("create dialog");

    await call("browser.uploadFile", {
      selector: "[role=dialog] input[type=file], input[type=file]",
      base64: fs.readFileSync(IMG).toString("base64"),
      fileName: "post.jpg",
    });
    await wait(6000);
    if (await guard("after attach")) return;

    await click("Next", 4000);
    await click("Next", 4000);
    const cap = await call("browser.eval", {
      script:
        'const d=document.querySelector("[role=dialog]");const e=d&&d.querySelector("[contenteditable=true],textarea");if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:r.x+20,y:r.y+15})',
    });
    if (!cap) die("FAILED", "caption box not found");
    const p = JSON.parse(cap);
    await call("browser.clickAt", { x: p.x, y: p.y });
    await wait(800);
    await call("browser.keyboardType", { text: caption });
    await wait(1500);

    // -- AI label gate -------------------------------------------------------
    const ai = await call("browser.eval", {
      script:
        'const d=document.querySelector("[role=dialog]");if(!d)return null;const sw=[...d.querySelectorAll("input[type=checkbox],[role=switch]")];const lab=[...d.querySelectorAll("*")].find(e=>e.innerText&&e.innerText.trim()==="Add AI label");if(!lab)return JSON.stringify({err:"no label",switches:sw.length});const ly=lab.getBoundingClientRect().y;let best=null,bd=1e9;for(const s of sw){const r=s.getBoundingClientRect();const dd=Math.abs(r.y-ly);if(dd<bd){bd=dd;best=s}}if(!best)return JSON.stringify({err:"no switch"});let box=best;for(let k=0;k<4&&box.parentElement;k++){const rr=box.getBoundingClientRect();if(rr.width>=20&&rr.height>=12)break;box=box.parentElement;}const r=box.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2,on:best.checked||best.getAttribute("aria-checked")==="true"})',
    });
    const aiState = () =>
      call("browser.eval", {
        script:
          'const d=document.querySelector("[role=dialog]");return JSON.stringify([...d.querySelectorAll("input[type=checkbox],[role=switch]")].map(s=>s.checked||s.getAttribute("aria-checked")))',
      });
    if (ai) {
      const a = JSON.parse(ai);
      if (a.x && !a.on) {
        for (const dx of [0, 8, -8, 14]) {
          await call("browser.clickAt", { x: a.x + dx, y: a.y });
          await wait(1500);
          if (/true/.test(await aiState())) break;
        }
      }
    }
    if (!/true/.test(await aiState()))
      die("FAILED", "AI label could not be switched on — not sharing");
    if (DRY) {
      console.log("RESULT DRY-OK (reached AI-label step, not shared)");
      ws.close();
      return;
    }

    // -- share ---------------------------------------------------------------
    if (await guard("before share")) return;
    const sh = await call("browser.eval", {
      script:
        'const d=document.querySelector("[role=dialog]");const b=[...d.querySelectorAll("[role=button],button")].find(e=>e.innerText.trim()==="Share");if(!b)return null;const r=b.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})',
    });
    if (!sh) die("FAILED", "share button not found");
    const sp = JSON.parse(sh);
    await call("browser.clickAt", { x: sp.x, y: sp.y });
    await wait(20000);
    const after = await dialog();
    const ok = /shared|been shared/i.test(after);
    if (ok) {
      st.lastPostAt = Date.now();
      st.lastResult = "POSTED";
      fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
      console.log("RESULT POSTED");
    } else {
      console.log("RESULT NOT-CONFIRMED share-response:", after.slice(0, 160));
    }
  } catch (e) {
    die("FAILED", e.message);
  } finally {
    await call("browser.emulate", { mode: "mobile" }).catch(() => {});
    ws.close();
  }
});
ws.on("close", () => process.exit(0));
setTimeout(() => die("FAILED", "overall timeout"), 180000);
