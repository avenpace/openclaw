---
name: website-builder
description: Create AJAX-native web applications with PHP MVC micro-framework + SQLite + htmx + Alpine.js. Includes auth, migrations, and Agent API for autonomous operation.
metadata: { "clawdbot": { "emoji": "🌐" } }
---

# ⛔⛔⛔ MANDATORY CONTRACT - NO SKIPPING STEPS ⛔⛔⛔

**DO NOT USE write/edit TOOLS DIRECTLY FOR CODE. YOU WILL TIMEOUT.**

## WORKFLOW - FOLLOW EXACTLY

### STEP 1: PLANNING MODE - Present plan and WAIT for approval

Present a complete plan to the user:

- Project name (kebab-case, e.g., "toko-elektronik")
- List ALL entities with their fields
- List ALL features/pages
- Database schema overview
- End with: "Reply **go** to approve this plan and start building"

**⛔ DO NOT PROCEED UNTIL USER SAYS "go" ⛔**

### STEP 2: Check project name availability

```
read: websites/{project-name}/BUILD-SPEC.md
```

If exists → ask user to choose different name or confirm overwrite.

### STEP 3: Write BUILD-SPEC.md with EXPLICIT paths

Write the spec file (directory auto-created by write tool):

```
write to: websites/{project-name}/BUILD-SPEC.md

# {Project Name} Build Specification

## ⛔⛔⛔ CRITICAL: FILE PATH PREFIX ⛔⛔⛔

PROJECT DIRECTORY: websites/{project-name}/

EVERY file you write MUST use this FULL PATH:
- websites/{project-name}/index.php
- websites/{project-name}/app/Core/App.php
- websites/{project-name}/views/home.php
- websites/{project-name}/tests/run.php

❌ NEVER write to: index.php (missing prefix!)
❌ NEVER write to: app/Core/App.php (missing prefix!)
❌ NEVER write to: {project-name}/index.php (missing websites/)

## Database Location
DATABASE: databases/{project-name}/database.sqlite
(Outside webapp for security - not web-accessible)

## Requirements
{detailed requirements from user}

## Entities
{list all entities with fields}

## Features
{list all features}

## Pages
{list all pages/views}
```

### STEP 4: Spawn subagent with EXPLICIT path instruction

```
sessions_spawn({
  task: "BUILD websites/{project-name}/ - Read websites/{project-name}/BUILD-SPEC.md first. CRITICAL: Every write MUST use prefix 'websites/{project-name}/' - Example: write('websites/{project-name}/index.php'). When done building ALL files, find 'Requester session:' in your system prompt context, then call: sessions_send({ sessionKey: '<that-requester-session>', message: 'BUILD_COMPLETE: websites/{project-name}' })",
  mode: "session"
})
```

**Important**: Use `mode: "session"` (not "run") so you can poll status and send fix instructions.

**Subagent completion**: The subagent's system prompt includes `Requester session: {your-session-key}`. When done, the subagent MUST call `sessions_send` with that session key to notify you.

### STEP 5: BUILD MONITORING (AUTOMATIC - NO ACTION REQUIRED)

✅ **Build supervision is AUTOMATIC** - the platform registers builds via the eval endpoint.

When the subagent calls the eval endpoint to validate code, the platform automatically:

- ✅ Registers the build for supervision
- ✅ Tracks eval heartbeats
- ✅ Monitors build progress
- ✅ Auto-completes when eval passes

**No manual registration needed!** The old curl registration is deprecated.

**5A. Tell user build started:**

```
"🔨 Building in background. Platform is monitoring the build - I'll verify and let you know when it's ready."
```

**5B. Wait for notification from supervision service OR subagent BUILD_COMPLETE:**

The platform will send you one of:

- `BUILD_COMPLETE: websites/{project-name}` from subagent → proceed to STEP 6
- `[BUILD SUPERVISION] Subagent stopped unexpectedly...` → handle failure/retry
- `[BUILD TIMEOUT] Build exceeded timeout...` → notify user of failure

**5C. Schedule a backup check (in case supervision misses something):**

```
cron add schedule="in 5 minutes" text="CHECK_BUILD_BACKUP: websites/{project-name}"
```

On this cron wake, check if build completed. If not, investigate manually.

### STEP 6: VERIFICATION (Trust but Verify - DO NOT SKIP)

⛔ **NEVER trust subagent claims. ALWAYS verify independently.**

When subagent reports BUILD_COMPLETE, YOU (main agent) must verify:

**6A. Read and verify BUILD-SPEC.md requirements**:

```
read: websites/{project-name}/BUILD-SPEC.md
```

Extract all required entities, features, and pages.

**6B. Check all required files exist**:

```
glob: websites/{project-name}/**/*.php
glob: websites/{project-name}/assets/*.css
```

Verify against BUILD-SPEC.md requirements.

**6C. Run tests (MANDATORY)**:

```
php_exec: script="websites/{project-name}/tests/run.php"
```

**6D. Run eval-runner (MANDATORY)**:

```
php_exec: script="skills/website-builder/eval-runner.php", args=["websites/{project-name}", "--quiet"]
```

Eval-runner now includes JavaScript syntax checking:

- Validates standalone `.js` files in `assets/`
- Extracts and validates inline `<script>` blocks from PHP files
- Reports syntax errors with file paths and line numbers

**6E. UI Smoke Test (if browser available)**:

For production-ready apps, run UI smoke test to catch JavaScript runtime errors that syntax checking can't detect:

```bash
node /app/openclaw/system-skills/website-builder/ui-smoke-test.js websites/{project-name} --base-url=http://localhost:8080 --quiet
```

**What it checks:**

- Page loads without HTTP errors
- No JavaScript console errors
- No uncaught JavaScript exceptions
- Required DOM elements exist (forms, navigation, etc.)
- AJAX data actually renders (not just received)

**Smoke test failure examples:**

- `console.log(undefindVariable)` → Runtime JS error caught
- API returns data but JS fails to render it → DOM check fails
- Button click handler throws error → Page error caught

**When to run:**

- After eval-runner passes
- When app has client-side JavaScript rendering
- When app makes AJAX calls to display data

**If UI smoke test fails:**

- Fix JavaScript errors in client-side code
- Check AJAX response handling
- Verify DOM selectors match actual elements
- Re-run until it passes

### STEP 7: Handle verification results

**If ALL verification passes** (tests pass + eval ready_to_run: true):

- Update MEMORY.md: Phase = VERIFIED
- Proceed to STEP 8

**If ANY verification fails**:

1. Increment retry counter in MEMORY.md
2. If retries < 3:
   - Send fix instructions to subagent via sessions_send:
     ```
     sessions_send({
       sessionKey: "{subagent-session-key}",
       message: "FIXES REQUIRED:\n{list specific failures from tests/eval}\n\nFix these issues and send BUILD_COMPLETE when done."
     })
     ```
   - Update MEMORY.md: Phase = AWAITING_FIX, CurrentRetry += 1
   - Schedule next poll: `cron add schedule="in 1 minute" text="CHECK_BUILD: websites/{project-name}"`
   - Wait for next poll cycle (cron will wake you)
3. If retries >= 3:
   - Report failure to user with specific issues
   - Remove supervision section from MEMORY.md
   - DO NOT proceed to registration

### STEP 8: Register webapp (MANDATORY - AFTER verification passes)

⛔ **YOU MUST REGISTER BEFORE announcing the URL. User will get 404 otherwise!**

Only after VERIFICATION passes (STEP 6 + STEP 7):

```
curl -X POST http://localhost:3000/internal/websites/{project-name}/register \
  -H "Content-Type: application/json" \
  -d '{"userId": "{user-id}"}'
```

If registration fails → Debug and retry. DO NOT announce URL until registration succeeds.

### STEP 9: Notify user with preview link (ONLY after ALL steps succeed)

Remove "ACTIVE BUILD SUPERVISION" section from MEMORY.md (task complete).

"✅ Your app is ready!
Preview: https://{project-name}.clawku.co"

---

## 🔍 VERIFY EXISTING WEBAPP

When user asks to **verify**, **check**, or **test** an existing webapp:

**Trigger phrases:** "verify my app", "check toko-krenz", "test my website", "run tests on my app", "is my app working"

### Verification Steps:

**1. Find the webapp directory:**

```
glob: websites/{project-name}/**/*.php
```

If not found, check user's persona websites via API.

**2. Run tests:**

```
php_exec: script="websites/{project-name}/tests/run.php"
```

**3. Run eval-runner (includes JS syntax check):**

```
php_exec: script="skills/website-builder/eval-runner.php", args=["websites/{project-name}", "--quiet"]
```

**4. Run UI smoke test (if browser available):**

```bash
node /app/openclaw/system-skills/website-builder/ui-smoke-test.js websites/{project-name} --base-url=https://{project-name}.clawku.co --quiet
```

**5. Report results to user:**

- ✅ All checks pass → "Your app is healthy!"
- ❌ Issues found → List specific failures with file:line references

### Quick Verify (single command):

If user just wants a quick check without full details:

```
php_exec: script="skills/website-builder/eval-runner.php", args=["websites/{project-name}", "--quiet"]
```

Parse JSON output and report `ready_to_run` status.

---

## 🎨 REFINE UI / IMPROVE DESIGN

When user asks to **refine**, **improve**, **fix styling**, or **make UI better** on an existing webapp:

**Trigger phrases:** "refine the UI", "improve the design", "make it look better", "fix the styling", "upgrade the look", "it looks too generic", "make it more professional"

### UI Refinement Steps:

**1. FIRST - Find the layout file (name varies by project!):**

Layout files have different names. **Search for them, don't assume!**

```
glob: websites/{project-name}/views/layouts/*.php
```

Common layout file names:

- `views/layouts/app.php` ← Most common
- `views/layouts/main.php` ← Also common
- `views/layouts/header.php` ← Sometimes used
- `views/base.php` ← Simple apps

**Read the layout file you find** to check what CSS framework is used.

**2. Check current CSS framework in the layout file's `<head>`:**

Look for these patterns:

- `bootstrap` in CDN URL → Needs full migration to Tailwind + daisyUI
- `tailwindcss.com` already present → Already migrated, just refine components/theme
- No CSS framework → Add Tailwind + daisyUI

**If already using Tailwind + daisyUI:**

The app is ALREADY migrated! Check these refinement options:

a) **Check the theme** - Is it appropriate for the app type?

- POS/CRM/Admin → should be `corporate` or `business`
- Shop/Restaurant → should be `cupcake` or `autumn`
- SaaS/Portal → should be `winter` or `nord`

b) **Look for leftover Bootstrap classes** in view files:

- `form-control` → `input input-bordered`
- `form-select` → `select select-bordered`
- `btn-danger` → `btn-error`
- `bg-light` → `bg-base-200`
- `text-muted` → `text-base-content/60`

c) **Check for generic labels** that should be domain-specific

d) **If everything looks good** → Tell the user: "This app already uses Tailwind + daisyUI with the {theme} theme. What specific improvements would you like?"

**Skip to step 4 if migration is already done.**

---

**3. Apply Clawku Design System (only if NOT already using Tailwind):**

a) **Add Tailwind + daisyUI CDN** (if not present):

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

b) **Choose appropriate daisyUI theme** based on app type:
| App Type | Theme |
|----------|-------|
| POS, CRM, Admin, Finance | `corporate` or `business` |
| Shop, Restaurant, Booking | `cupcake` or `autumn` |
| SaaS, Analytics, Portal | `winter` or `nord` |

c) **Set theme on html element:**

```html
<html data-theme="corporate"></html>
```

**3. Migrate components to daisyUI:**

| Old (Bootstrap/Plain)              | New (daisyUI)                                                |
| ---------------------------------- | ------------------------------------------------------------ |
| `<button class="btn btn-primary">` | `<button class="btn btn-primary">` (same but daisyUI styled) |
| `<input class="form-control">`     | `<input class="input input-bordered w-full">`                |
| `<select class="form-select">`     | `<select class="select select-bordered w-full">`             |
| `<div class="card">`               | `<div class="card bg-base-100 shadow-sm">`                   |
| `<table class="table">`            | `<table class="table table-zebra">`                          |
| `<div class="modal">`              | `<dialog class="modal">`                                     |
| `<div class="alert">`              | `<div class="alert alert-success">`                          |

**4. Fix generic labels:**

Replace AI-generic labels with domain-specific ones:

```
"Dashboard"      → "Sales Overview" / "Today's Orders"
"Manage Items"   → "Products" / "Inventory" / "Menu"
"Add New"        → "Add Product" / "New Order"
"Submit"         → "Save Changes" / "Place Order"
"Data"           → "Transactions" / "Customers"
```

**5. Apply layout pattern:**

Check if app matches one of these patterns, apply if not:

- `sidebar-workspace` - For multi-section admin/CRM
- `topnav-operations` - For POS/cashier
- `list-detail` - For tickets/contacts/orders

**6. Fix common UI issues:**

```
❌ shadow-xl, shadow-2xl     → ✅ shadow-sm or shadow
❌ rounded-3xl everywhere    → ✅ default daisyUI radius
❌ Plain "No data" text      → ✅ Empty state with icon + CTA button
❌ No loading states         → ✅ btn loading class
❌ Silent form saves         → ✅ alert alert-success toast
```

**7. Run eval after changes:**

```
php_exec: script="skills/website-builder/eval-runner.php", args=["websites/{project-name}"]
```

---

### 📋 BOOTSTRAP → daisyUI CLASS MAPPING (COMPLETE REFERENCE)

**Use this mapping when migrating ANY app from Bootstrap to Tailwind + daisyUI.**

#### Layout File Changes (app.php / main.php / header.php)

**IMPORTANT:** Layout file names vary! Common names: `app.php`, `main.php`, `header.php`, `base.php`

**In the layout file's `<head>`, FIND and REMOVE Bootstrap:**

```html
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
  rel="stylesheet"
/>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

**REPLACE with Tailwind + daisyUI:**

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

**ADD `data-theme` to `<html>` tag:**

```html
<html data-theme="corporate"></html>
```

Theme options: `corporate`, `business`, `cupcake`, `autumn`, `winter`, `nord`

#### Class Mapping Tables

**BUTTONS:**
| Bootstrap | daisyUI |
|-----------|---------|
| `btn btn-primary` | `btn btn-primary` |
| `btn btn-secondary` | `btn btn-neutral` |
| `btn btn-success` | `btn btn-success` |
| `btn btn-danger` | `btn btn-error` |
| `btn btn-warning` | `btn btn-warning` |
| `btn btn-info` | `btn btn-info` |
| `btn btn-light` | `btn btn-ghost` |
| `btn btn-outline-primary` | `btn btn-outline btn-primary` |
| `btn btn-outline-secondary` | `btn btn-outline` |
| `btn btn-sm` | `btn btn-sm` |
| `btn btn-lg` | `btn btn-lg` |
| `btn-close` | `btn btn-sm btn-circle btn-ghost` |
| `w-100` (on buttons) | `w-full` |

**FORMS:**
| Bootstrap | daisyUI |
|-----------|---------|
| `form-control` | `input input-bordered w-full` |
| `form-control-sm` | `input input-bordered input-sm w-full` |
| `form-control-lg` | `input input-bordered input-lg w-full` |
| `form-select` | `select select-bordered w-full` |
| `form-check` | `form-control` |
| `form-check-input` (checkbox) | `checkbox` |
| `form-check-input` (radio) | `radio` |
| `form-check-label` | `label cursor-pointer` |
| `form-label` | `label` > `span class="label-text"` |
| `form-text` | `label` > `span class="label-text-alt"` |
| `input-group` | `join` |
| `input-group-text` | `btn btn-neutral join-item` |
| `form-floating` | (use regular label above input) |
| `is-invalid` | `input-error` |
| `invalid-feedback` | `label` > `span class="label-text-alt text-error"` |

**LAYOUT (Bootstrap Grid → Tailwind):**
| Bootstrap | Tailwind |
|-----------|----------|
| `container` | `container mx-auto px-4` |
| `container-fluid` | `w-full px-4` |
| `row` | `flex flex-wrap -mx-2` or `grid grid-cols-12 gap-4` |
| `col` | `flex-1 px-2` |
| `col-6` | `w-1/2 px-2` or `col-span-6` |
| `col-4` | `w-1/3 px-2` or `col-span-4` |
| `col-3` | `w-1/4 px-2` or `col-span-3` |
| `col-12` | `w-full px-2` or `col-span-12` |
| `col-md-6` | `w-full md:w-1/2 px-2` |
| `col-lg-4` | `w-full lg:w-1/3 px-2` |
| `g-3` (gap) | `gap-3` |
| `gx-3` | `gap-x-3` |
| `gy-3` | `gap-y-3` |

**FLEXBOX:**
| Bootstrap | Tailwind |
|-----------|----------|
| `d-flex` | `flex` |
| `d-none` | `hidden` |
| `d-block` | `block` |
| `d-inline` | `inline` |
| `d-md-flex` | `md:flex` |
| `flex-column` | `flex-col` |
| `flex-row` | `flex-row` |
| `flex-wrap` | `flex-wrap` |
| `justify-content-start` | `justify-start` |
| `justify-content-center` | `justify-center` |
| `justify-content-end` | `justify-end` |
| `justify-content-between` | `justify-between` |
| `justify-content-around` | `justify-around` |
| `align-items-start` | `items-start` |
| `align-items-center` | `items-center` |
| `align-items-end` | `items-end` |
| `align-self-center` | `self-center` |

**SPACING:**
| Bootstrap | Tailwind |
|-----------|----------|
| `m-0` to `m-5` | `m-0` to `m-5` (same) |
| `mt-3` | `mt-3` |
| `mb-3` | `mb-3` |
| `mx-auto` | `mx-auto` |
| `p-0` to `p-5` | `p-0` to `p-5` (same) |
| `py-3` | `py-3` |
| `px-3` | `px-3` |

**CARDS:**
| Bootstrap | daisyUI |
|-----------|---------|
| `card` | `card bg-base-100 shadow-sm` |
| `card-body` | `card-body` |
| `card-title` | `card-title` |
| `card-text` | `<p>` (no special class) |
| `card-header` | `card-body border-b border-base-200` |
| `card-footer` | `card-body border-t border-base-200` |
| `card-img-top` | `figure` > `img` |

**TABLES:**
| Bootstrap | daisyUI |
|-----------|---------|
| `table` | `table` |
| `table-striped` | `table table-zebra` |
| `table-hover` | (add `hover` class to `<tr>`) |
| `table-bordered` | `table` + `[&_th]:border [&_td]:border` |
| `table-sm` | `table table-sm` |
| `table-responsive` | wrap in `<div class="overflow-x-auto">` |
| `thead-dark` | `bg-neutral text-neutral-content` on thead |
| `thead-light` | `bg-base-200` on thead |

**BADGES & ALERTS:**
| Bootstrap | daisyUI |
|-----------|---------|
| `badge bg-primary` | `badge badge-primary` |
| `badge bg-secondary` | `badge badge-neutral` |
| `badge bg-success` | `badge badge-success` |
| `badge bg-danger` | `badge badge-error` |
| `badge bg-warning text-dark` | `badge badge-warning` |
| `badge bg-info` | `badge badge-info` |
| `badge rounded-pill` | `badge` (already rounded) |
| `alert alert-success` | `alert alert-success` |
| `alert alert-danger` | `alert alert-error` |
| `alert alert-warning` | `alert alert-warning` |
| `alert alert-info` | `alert alert-info` |
| `alert-dismissible` | (add close button manually) |

**MODALS:**
| Bootstrap | daisyUI |
|-----------|---------|
| `<div class="modal fade">` | `<dialog class="modal">` |
| `modal-dialog` | (not needed) |
| `modal-dialog-centered` | `modal-middle` on dialog |
| `modal-content` | `modal-box` |
| `modal-header` | `<div class="flex justify-between items-center mb-4">` |
| `modal-title` | `<h3 class="font-bold text-lg">` |
| `modal-body` | (content directly in modal-box) |
| `modal-footer` | `<div class="modal-action">` |
| `data-bs-toggle="modal" data-bs-target="#id"` | `onclick="id.showModal()"` |
| `data-bs-dismiss="modal"` | `<form method="dialog"><button class="btn">Close</button></form>` |

**NAVBAR:**
| Bootstrap | daisyUI |
|-----------|---------|
| `navbar` | `navbar bg-base-100` |
| `navbar-brand` | `<a class="btn btn-ghost text-xl">` |
| `navbar-nav` | `menu menu-horizontal px-1` |
| `nav-item` | `<li>` |
| `nav-link` | `<a>` (menu styles it) |
| `nav-link active` | add `active` class |
| `navbar-toggler` | `btn btn-ghost lg:hidden` |
| `navbar-collapse` | (use drawer for mobile) |

**TEXT & TYPOGRAPHY:**
| Bootstrap | Tailwind |
|-----------|----------|
| `text-muted` | `text-base-content/60` |
| `text-primary` | `text-primary` |
| `text-success` | `text-success` |
| `text-danger` | `text-error` |
| `text-warning` | `text-warning` |
| `text-center` | `text-center` |
| `text-start` | `text-left` |
| `text-end` | `text-right` |
| `fw-bold` | `font-bold` |
| `fw-semibold` | `font-semibold` |
| `fw-normal` | `font-normal` |
| `fw-light` | `font-light` |
| `fs-1` to `fs-6` | `text-4xl`, `text-3xl`, `text-2xl`, `text-xl`, `text-lg`, `text-base` |
| `small` | `text-sm` |
| `lead` | `text-lg` |
| `h1` to `h6` classes | `text-4xl font-bold` etc. |

**BACKGROUNDS & BORDERS:**
| Bootstrap | Tailwind / daisyUI |
|-----------|----------|
| `bg-primary` | `bg-primary text-primary-content` |
| `bg-secondary` | `bg-neutral text-neutral-content` |
| `bg-success` | `bg-success text-success-content` |
| `bg-danger` | `bg-error text-error-content` |
| `bg-warning` | `bg-warning text-warning-content` |
| `bg-light` | `bg-base-200` |
| `bg-dark` | `bg-neutral text-neutral-content` |
| `bg-white` | `bg-base-100` |
| `border` | `border border-base-200` |
| `border-top` | `border-t` |
| `border-bottom` | `border-b` |
| `rounded` | `rounded` |
| `rounded-pill` | `rounded-full` |
| `rounded-circle` | `rounded-full` |
| `shadow` | `shadow` |
| `shadow-sm` | `shadow-sm` |
| `shadow-lg` | `shadow-lg` |

**UTILITIES:**
| Bootstrap | Tailwind |
|-----------|----------|
| `w-100` | `w-full` |
| `h-100` | `h-full` |
| `w-50` | `w-1/2` |
| `w-25` | `w-1/4` |
| `mw-100` | `max-w-full` |
| `vh-100` | `h-screen` |
| `overflow-auto` | `overflow-auto` |
| `overflow-hidden` | `overflow-hidden` |
| `position-relative` | `relative` |
| `position-absolute` | `absolute` |
| `position-fixed` | `fixed` |
| `top-0` | `top-0` |
| `bottom-0` | `bottom-0` |
| `start-0` | `left-0` |
| `end-0` | `right-0` |
| `visually-hidden` | `sr-only` |
| `cursor-pointer` | `cursor-pointer` |

---

## 🚨 CONTRACT VIOLATIONS = BUILD FAILS 🚨

**These steps are NON-NEGOTIABLE. Skip ANY step = FAIL.**

| Step             | Requirement                           | Skip = FAILURE                         |
| ---------------- | ------------------------------------- | -------------------------------------- |
| Planning mode    | Present plan, WAIT for "go"           | User gets unexpected app               |
| BUILD-SPEC.md    | Write spec with explicit paths        | Subagent writes to wrong location      |
| Path prefix      | All files use `websites/{project}/`   | Files created in wrong directory       |
| **Supervision**  | (Automatic via eval heartbeat)        | Built-in via platform                  |
| **Tests**        | Run `php_exec tests/run.php`          | **BROKEN APP DEPLOYED - UNACCEPTABLE** |
| **Eval-runner**  | Run eval-runner.php + JS syntax       | **SECURITY/SYNTAX VIOLATIONS MISSED**  |
| **UI Smoke**     | Run ui-smoke-test.js (when available) | **JS RUNTIME ERRORS SLIP THROUGH**     |
| **Registration** | (Automatic when eval passes)          | Built-in via platform                  |

### EXPLICIT FAILURE CONDITIONS:

1. **NO tests/run.php exists** → Subagent MUST create it with at least 1 test per entity
2. **Tests not run** → You MUST run tests before announcing completion
3. **Tests fail** → Fix and re-run, max 3 attempts. If still failing, report failure to user
4. **Eval-runner not run** → You MUST run eval-runner after tests pass
5. **Eval-runner fails** → Fix violations and re-run, max 3 attempts
6. **Trusting subagent blindly** → **VIOLATION** - always verify with tests + eval before announcing
7. **Announcing before verification** → **VIOLATION** - subagent claims mean nothing without proof
8. **Ignoring [BUILD SUPERVISION] messages** → **VIOLATION** - platform is telling you something is wrong

---

# ═══════════════════════════════════════════════════════

# SUBAGENT INSTRUCTIONS BELOW

# (Read only if you ARE the spawned subagent, not main agent)

# ═══════════════════════════════════════════════════════

---

# ⛔⛔⛔ CRITICAL: PATH REQUIREMENTS ⛔⛔⛔

## YOU ARE A SUBAGENT - YOUR WORKING DIRECTORY IS NOT THE PROJECT!

**Your task will contain a path like `websites/{project}/BUILD-SPEC.md`.**

**EVERY SINGLE FILE YOU CREATE MUST INCLUDE THE FULL PATH PREFIX:**

```
websites/{project}/index.php
websites/{project}/migrate.php
websites/{project}/config.php
websites/{project}/app/Core/Database.php
websites/{project}/views/login.php
websites/{project}/assets/style.css
```

**⛔ IF YOU WRITE TO `index.php` or `migrate.php` WITHOUT THE PREFIX = BUILD FAILS ⛔**

### Step 1: Read your task, extract the project path

Your task says something like: "Read websites/contact-keeper/BUILD-SPEC.md..."

Extract: `websites/contact-keeper/` - this is YOUR PROJECT PATH.

### Step 2: EVERY write tool call MUST include this prefix

```
❌ WRONG: write to "index.php"
❌ WRONG: write to "migrate.php"
❌ WRONG: write to "app/Core/App.php"

✅ CORRECT: write to "websites/contact-keeper/index.php"
✅ CORRECT: write to "websites/contact-keeper/migrate.php"
✅ CORRECT: write to "websites/contact-keeper/app/Core/App.php"
```

### Step 3: ALL files including CLI scripts

These ALL go inside `websites/{project}/`:

- index.php
- migrate.php (CLI migration)
- config.php
- tests/run.php
- ALL app/ files
- ALL assets/ files
- ALL views/ files

### Example: If BUILD-SPEC.md is at `websites/toko-krenz/BUILD-SPEC.md`:

- ✅ Write to: `websites/toko-krenz/index.php`
- ✅ Write to: `websites/toko-krenz/migrate.php`
- ✅ Write to: `websites/toko-krenz/app/Core/Database.php`
- ❌ NEVER: `toko-krenz/index.php` (missing websites/ prefix)
- ❌ NEVER: `index.php` (in persona root)
- ❌ NEVER: `migrate.php` (in persona root)

### DEFINITION: "project root" = `websites/{project}/`

When this document says "project root" or "at project root", it means `websites/{project}/`, NOT the persona workspace. Example:

- "index.php at project root" means `websites/contact-keeper/index.php`
- "assets/ at project root" means `websites/contact-keeper/assets/`

---

# 📡 SUBAGENT COMPLETION SIGNALING (Level 3)

## When you finish building ALL files, you MUST signal completion

⛔ **DO NOT just stop working. You MUST explicitly signal BUILD_COMPLETE.**

After you have:

1. Written ALL required files (Core framework, models, controllers, views, assets)
2. Created tests/run.php with tests for each entity
3. Verified all files exist and have proper content

**Send completion signal to main agent**:

```
sessions_send({
  message: "BUILD_COMPLETE\n\nFiles created:\n- {list all files}\n\nTests: tests/run.php created with {N} tests\n\nReady for verification."
})
```

**If main agent sends FIXES REQUIRED**:

1. Read the fix instructions carefully
2. Make the required fixes
3. Send BUILD_COMPLETE again when done

**DO NOT**:

- Stop without sending BUILD_COMPLETE
- Send BUILD_COMPLETE before ALL files are written
- Ignore fix instructions from main agent
- Message the user directly (main agent handles user communication)

---

# 🔥🔥🔥 ZERO TOLERANCE: NO SKELETON BUILDS 🔥🔥🔥

## THIS IS NON-NEGOTIABLE - READ EVERY WORD

**You are building PRODUCTION-READY applications, NOT prototypes, NOT demos, NOT skeletons.**

### ❌ ABSOLUTELY FORBIDDEN - INSTANT FAILURE

| FORBIDDEN BEHAVIOR                    | WHY IT'S UNACCEPTABLE                 |
| ------------------------------------- | ------------------------------------- |
| Skeleton implementations              | User asked for full app, not a demo   |
| Placeholder functions                 | "TODO" or empty functions = LAZY      |
| "Basic" or "minimal" styling          | User expects PROFESSIONAL UI          |
| Features that don't work              | Every button must DO something        |
| Auth-only apps                        | If user asked for POS, build FULL POS |
| Telling user to "implement later"     | YOU implement it NOW                  |
| Announcing completion when incomplete | LYING to user                         |
| Forms that don't save data            | USELESS UI                            |
| Reports with no data/logic            | FAKE features                         |
| Modals that don't open                | BROKEN UI                             |

### ✅ MANDATORY QUALITY STANDARDS

**Every feature user requested MUST be:**

1. **FULLY IMPLEMENTED** - Not placeholder, not "coming soon", WORKING CODE
2. **ACTUALLY FUNCTIONAL** - Buttons work, forms save, reports show real data
3. **PROFESSIONALLY STYLED** - Following design guidelines below, not ugly defaults
4. **TESTED** - You verified it works before announcing completion

### 🎯 FEATURE COMPLETENESS CHECKLIST

Before announcing completion, verify EACH requested feature:

```
For EVERY feature user mentioned:
□ Does the UI exist? (page, form, buttons)
□ Does the backend logic exist? (controller, model, service)
□ Does it actually WORK? (data saves, displays, updates, deletes)
□ Is it styled properly? (not plain HTML, follows design system)
□ Did you TEST it? (tried the flow yourself)

If ANY checkbox is NO → YOU ARE NOT DONE. Keep building!
```

### 📋 EXAMPLE: User asks for "POS System with inventory"

**WRONG (Skeleton - FORBIDDEN):**

```
✗ Login page only
✗ Empty dashboard with just title
✗ "Products" page that shows nothing
✗ "Add Product" button that doesn't work
✗ No actual POS/transaction flow
✗ No inventory tracking logic
```

**CORRECT (Full Implementation - REQUIRED):**

```
✓ Login/logout with session management
✓ Dashboard with REAL stats (today's sales, low stock alerts, recent transactions)
✓ Products CRUD - list, add, edit, delete ALL WORKING
✓ Categories CRUD - ALL WORKING
✓ POS Screen - product search, add to cart, calculate total, process payment
✓ Transaction history - list all sales with details
✓ Inventory tracking - stock decrements on sale, low stock warnings
✓ Reports - daily/weekly/monthly sales with REAL calculations
✓ All styled with professional UI, mobile-responsive
```

### 🚨 PROACTIVE BEHAVIOR - FIX IT YOURSELF

**FORBIDDEN responses:**

- "You can add more features later"
- "The login is working, try logging in"
- "Go to the login page to access the app"
- "This is a basic implementation"
- "You may want to add..."

**REQUIRED behavior:**

- If something is broken → FIX IT immediately
- If a feature is missing → BUILD IT before announcing
- If styling is ugly → IMPROVE IT before announcing
- If user can't access something → MAKE IT ACCESSIBLE
- Never tell user to do something YOU should do

### 🎨 MANDATORY DESIGN QUALITY - CLAWKU DESIGN SYSTEM

Your UI MUST look professional and NOT like "generic AI-generated admin panel".

**The goal:** Apps should look like **Clawku products**, not random template output.

**Core Principles:**

- Clean, dense, modern - NOT toy-like or over-decorated
- Soft radius, NOT giant rounded corners everywhere
- Subtle shadows, NOT floating cards with dramatic shadows
- Muted surfaces, strong content hierarchy
- Domain-first labels, NOT generic "Dashboard", "Manage Items"
- One primary accent only
- Status colors used sparingly
- Tables and forms should feel "operator-grade"
- Empty states should be useful, not decorative

**Theme Selection (CHOOSE ONE based on app type):**

| Theme           | Best For                                     | Feel                                            |
| --------------- | -------------------------------------------- | ----------------------------------------------- |
| `operator`      | POS, inventory, CRM, finance, internal tools | Calm, efficient, serious, slightly dark-leaning |
| `warm-commerce` | Shops, restaurants, booking, SMB back office | Human, local-business friendly, warmer          |
| `modern-saas`   | Client portals, analytics, subscription apps | Polished, airy, modern startup                  |

**Layout Selection (CHOOSE ONE based on app type):**

| Layout              | Best For                                     | Structure                                       |
| ------------------- | -------------------------------------------- | ----------------------------------------------- |
| `sidebar-workspace` | Multi-section internal tools, admin, CRM/ERP | Left sidebar + top bar + content canvas         |
| `topnav-operations` | POS, simple booking, inventory, cashier      | Top nav + action bar + main area + summary rail |
| `list-detail`       | Tickets, contacts, orders, tasks             | Searchable list left + detail panel right       |

**If your UI looks like plain HTML or generic Bootstrap template, YOU FAILED.**

---

#### CSS Framework: Tailwind CSS 4 + daisyUI 5 (No Build)

Use Tailwind CSS + daisyUI via CDN for modern, non-generic styling. NO npm/bundler required.

**Full Reference:** `/app/openclaw/system-skills/website-builder/daisyui-reference.md` - Complete component docs with class names, syntax, and rules.

```html
<!-- In header.php -->
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link rel="stylesheet" href="<?= asset('css/theme.css') ?>" />
```

**Note:** daisyUI 5 + Tailwind CSS 4 uses CSS-based configuration. All 29 built-in themes are included in the CDN. Set theme via `data-theme` attribute on `<html>` element.

**Available themes:** light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel, fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade, night, coffee, winter, dim, nord, sunset

**Why Tailwind + daisyUI:**

- Utility-first = unique layouts, not template look
- daisyUI components (btn, card, modal, table) are pre-styled but customizable
- Built-in themes that look professional, not generic
- Easy to override with custom CSS variables

**daisyUI Theme Selection:**
| App Type | daisyUI Theme | Feel |
|----------|---------------|------|
| POS, CRM, Finance | `corporate` or `business` | Professional, serious |
| Shop, Restaurant, Booking | `cupcake` or `autumn` | Warm, friendly |
| SaaS Portal, Analytics | `winter` or `nord` | Modern, clean |

---

#### Design Tokens (Use Tailwind's Built-in System)

**Tailwind already has excellent spacing, sizing, and typography scales. Use them!**

**Spacing (Tailwind classes):**

```
p-1 = 4px    | p-2 = 8px   | p-3 = 12px  | p-4 = 16px
p-5 = 20px   | p-6 = 24px  | p-8 = 32px  | p-12 = 48px

Use: p-4 (padding), m-4 (margin), gap-4 (flex/grid gap), space-y-4 (stack spacing)
```

**Common Spacing Patterns:**

```html
<!-- Card padding -->
<div class="card-body p-4">
  <!-- Section spacing -->
  <section class="py-6 space-y-4">
    <!-- Form field gaps -->
    <form class="space-y-4">
      <!-- Button groups -->
      <div class="flex gap-2"></div>
    </form>
  </section>
</div>
```

**Border Radius (Tailwind + daisyUI):**

```
rounded-sm = 2px   | rounded = 4px     | rounded-md = 6px
rounded-lg = 8px   | rounded-xl = 12px | rounded-full = pill

daisyUI components have sensible defaults - don't override unless needed
```

**Shadows (Keep subtle!):**

```html
<!-- GOOD: Subtle shadows -->
<div class="card shadow-sm">
  <!-- Barely visible lift -->
  <div class="card shadow">
    <!-- Light shadow -->

    <!-- BAD: Dramatic shadows (avoid these) -->
    <div class="card shadow-xl">
      <!-- Too dramatic -->
      <div class="card shadow-2xl"><!-- Way too much --></div>
    </div>
  </div>
</div>
```

**Typography (Tailwind classes):**

```html
<h1 class="text-2xl font-bold">Page Title</h1>
<h2 class="text-xl font-semibold">Section Header</h2>
<h3 class="text-lg font-medium">Card Title</h3>
<p class="text-base">Body text</p>
<span class="text-sm text-base-content/60">Muted helper text</span>
<span class="text-xs">Labels, captions</span>
```

---

#### daisyUI Theme Mapping (Choose ONE based on app type)

**🔧 Operator Apps** (POS, inventory, CRM, finance, internal tools):

```html
<!-- Use corporate or business theme -->
<html data-theme="corporate">
  <!-- OR for darker feel -->
  <html data-theme="business"></html>
</html>
```

- Clean blue primary, professional grays
- Serious, efficient feel
- Good for data-heavy interfaces

**🛍️ Warm Commerce Apps** (Shops, restaurants, booking, SMB back office):

```html
<!-- Use cupcake or autumn theme -->
<html data-theme="cupcake">
  <!-- OR for warmer orange tones -->
  <html data-theme="autumn"></html>
</html>
```

- Warm, friendly colors
- Approachable for small business owners
- Less corporate, more human

**✨ Modern SaaS Apps** (Client portals, analytics, subscription apps):

```html
<!-- Use winter or nord theme -->
<html data-theme="winter">
  <!-- OR for minimalist Scandinavian feel -->
  <html data-theme="nord"></html>
</html>
```

- Cool, modern aesthetic
- Airy and clean
- Good for dashboards and analytics

**Preview themes:** https://daisyui.com/docs/themes/

**Component reference:** See `/app/openclaw/system-skills/website-builder/daisyui-reference.md` for complete daisyUI 5 component documentation with class names, syntax, and usage rules.

**Theme configurations:** See `/app/openclaw/system-skills/website-builder/daisyui-themes.css` for complete oklch color definitions of all 24 official daisyUI themes.

---

#### Component Rules (Tailwind + daisyUI)

**Buttons (use daisyUI btn classes):**

```html
<!-- Primary action -->
<button class="btn btn-primary">Save Product</button>

<!-- Secondary/outline -->
<button class="btn btn-outline">Cancel</button>

<!-- Ghost (minimal) -->
<button class="btn btn-ghost">View Details</button>

<!-- With loading state -->
<button class="btn btn-primary loading">Saving...</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

**Form Inputs (daisyUI input classes):**

```html
<input type="text" class="input input-bordered w-full" placeholder="Product name" />

<!-- With label using form-control wrapper -->
<label class="form-control w-full">
  <div class="label"><span class="label-text">Product Name</span></div>
  <input type="text" class="input input-bordered" placeholder="Enter name" />
</label>

<!-- Select -->
<select class="select select-bordered w-full">
  <option>Category</option>
</select>
```

**Cards (daisyUI card):**

```html
<div class="card bg-base-100 shadow-sm border border-base-200">
  <div class="card-body">
    <h2 class="card-title">Product Details</h2>
    <p>Card content here</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary btn-sm">Edit</button>
    </div>
  </div>
</div>
<!-- Keep shadows subtle: shadow-sm, NOT shadow-xl -->
```

**Tables (daisyUI table):**

```html
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr class="bg-base-200">
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover">
        <td>Product A</td>
        <td>Rp 50.000</td>
        <td><span class="badge badge-success">In Stock</span></td>
        <td><button class="btn btn-ghost btn-sm">Edit</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

**Modals (daisyUI modal):**

```html
<dialog id="confirmModal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Delete Product?</h3>
    <p class="py-4">This action cannot be undone.</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn btn-ghost">Cancel</button>
        <button class="btn btn-error">Delete</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>

<script>
  document.getElementById("confirmModal").showModal();
</script>
```

**Empty States:**

```html
<div class="text-center py-12 text-base-content/60">
  <svg class="w-16 h-16 mx-auto mb-4 opacity-40"><!-- icon --></svg>
  <h3 class="text-lg font-medium mb-2">No products yet</h3>
  <p class="mb-4">Add your first product to get started</p>
  <button class="btn btn-primary btn-sm">Add Product</button>
</div>
```

**Alerts/Toasts (daisyUI alert):**

```html
<div class="alert alert-success">
  <span>Product saved successfully!</span>
</div>

<div class="alert alert-error">
  <span>Failed to save. Please try again.</span>
</div>
```

---

#### Content Style Rules (CRITICAL - Avoid Generic AI Labels)

**BANNED Labels (Generic AI-generated feel):**

```
❌ "Dashboard"      → ✅ "Sales Overview" / "Today's Orders" / "Inventory Status"
❌ "Manage Items"   → ✅ "Products" / "Menu Items" / "Inventory"
❌ "Add New"        → ✅ "Add Product" / "New Order" / "Create Invoice"
❌ "Submit"         → ✅ "Save Changes" / "Place Order" / "Send Invoice"
❌ "Data"           → ✅ "Orders" / "Customers" / "Transactions"
❌ "Details"        → ✅ "Order #1234" / "Customer: John Doe"
❌ "Settings"       → ✅ "Store Settings" / "Account Preferences"
```

**Navigation should reflect domain:**

```
POS App:  Transactions | Products | Customers | Reports | Settings
CRM App:  Contacts | Deals | Tasks | Reports | Settings
Booking:  Reservations | Calendar | Customers | Settings
```

---

#### Chart Library: Apache ECharts (Default)

Use Apache ECharts for all data visualizations. It handles responsiveness and interactivity well.

```html
<!-- Include in pages with charts -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
```

```javascript
// Example: Sales chart with theme colors
const chart = echarts.init(document.getElementById("salesChart"));
chart.setOption({
  color: [getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()],
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: labels },
  yAxis: { type: "value" },
  series: [{ type: "bar", data: values, barWidth: "60%" }],
});

// Responsive resize
window.addEventListener("resize", () => chart.resize());
```

**Chart.js Alternative** (for simpler needs):

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

### 🔒 QUALITY GATE - BEFORE ANNOUNCING COMPLETION

You MUST verify ALL of these before saying "your app is ready":

```
□ Every feature from user's request is implemented
□ Every CRUD operation works (create, read, update, delete)
□ Forms save data to database
□ Lists show real data from database
□ Buttons trigger real actions
□ Navigation works on all pages
□ Auth protects private pages
□ UI looks professional (not plain/ugly)
□ Mobile responsive (test at 375px width)
□ No console errors
□ No broken links
□ No placeholder text like "Lorem ipsum" or "Coming soon"
□ Unit tests pass (`php tests/run.php`)
□ PHP LINT passes - ALL .php files have no syntax errors
□ SMOKE TEST passes - App loads without 500 error
□ Website registered (automatic via eval - no action needed)
```

**If ANY item fails → DO NOT announce completion. Fix it first.**

---

# 📊 PROGRESS REPORTING CONTRACT

**You MUST report progress by writing to `build-status.json` in the project root.**

This allows the parent agent to relay updates to the user. Update this file at each phase transition.

### Status File Location

```
websites/{project-name}/build-status.json
```

### Status File Format

```json
{
  "phase": "generating",
  "step": "Creating Controllers",
  "progress": 45,
  "filesCreated": 12,
  "currentFile": "app/Controllers/ProductController.php",
  "totalExpected": 25,
  "errors": [],
  "startedAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:01:30Z"
}
```

### Phases (in order)

0. `presenting` - Presenting plan summary to user (MUST happen first!)
1. `planning` - Reading requirements, planning structure
2. `manifest` - Writing manifest.json
3. `core` - Creating Core framework files (App, Router, Database, etc.)
4. `models` - Creating Model classes
5. `controllers` - Creating Controller classes
6. `views` - Creating View templates
7. `assets` - Creating CSS/JS assets
8. `migrations` - Creating database migrations
9. `eval` - Running eval-runner.php verification
10. `repair` - Fixing issues found by eval (if any)
11. `complete` - Build finished successfully
12. `failed` - Build failed (check errors array)

### Update Frequency

- Update `build-status.json` **before starting each new file**
- Update `progress` percentage based on files created vs total expected
- Update `currentFile` with the file currently being written
- Add any errors to the `errors` array immediately

### Example Updates

**Starting (present plan first):**

```json
{ "phase": "presenting", "step": "Presenting plan to user", "progress": 0, "filesCreated": 0 }
```

**After presenting plan:**

```json
{ "phase": "planning", "step": "Analyzing requirements", "progress": 5, "filesCreated": 0 }
```

**Mid-build:**

```json
{
  "phase": "controllers",
  "step": "Creating Controllers",
  "progress": 60,
  "filesCreated": 15,
  "currentFile": "app/Controllers/KasirController.php",
  "totalExpected": 25
}
```

**Complete:**

```json
{
  "phase": "complete",
  "step": "Build finished",
  "progress": 100,
  "filesCreated": 25,
  "totalExpected": 25
}
```

**IMPORTANT:** Write this file FIRST before any other file in the project.

---

# 📢 USER MESSAGE FORMATTING CONTRACT

**When sending messages to users (via message tool), NEVER include raw JSON or tool results!**

## ✅ CORRECT Message Format

```
🔨 Building your app...

✓ Created database schema
✓ Created 8 models
✓ Working on controllers (5/12)
```

## ❌ FORBIDDEN Message Formats

```
# NEVER show raw tool output to user:
❌ Tool result (exec): {"status": "error", "output": "..."}
❌ [non-text content: toolCall]
❌ {"success": false, "error": "..."}
❌ exec returned: {"status": "ok", ...}
```

## Error Handling - Clean Messages Only

When a tool returns an error, format it CLEANLY for the user:

**Tool returns:**

```json
{
  "status": "error",
  "output": "PHP Parse error: syntax error in /app/websites/my-app/index.php on line 42"
}
```

**WRONG - Sending raw JSON:**

```
Tool result (exec): {"status": "error", "output": "PHP Parse error..."}
```

**CORRECT - Clean formatted message:**

```
⚠️ PHP syntax error found in index.php (line 42)
Fixing now...
```

## Progress Update Format

When sending progress updates via message tool:

```
🔨 Building: Creating models (4/8 complete)
```

NOT:

```
Tool result: {"status": "ok"} - Created ProductModel
```

## Summary

| Do This                           | Not This                           |
| --------------------------------- | ---------------------------------- |
| "✓ Created 5 files"               | "write returned success"           |
| "⚠️ Error in config.php - fixing" | "exec: {\"status\": \"error\"...}" |
| "🔨 Building controllers..."      | "[non-text content: toolCall]"     |
| "✅ Tests passed!"                | "php_exec returned 0"              |

---

# 🔑 REGISTRATION IS AUTOMATIC

✅ **Website registration is now AUTOMATIC** - no manual registration needed!

When you call the eval endpoint to validate the website, the platform automatically:

- Registers the website for subdomain access
- Tracks the build via heartbeat
- Marks the build complete when eval passes

**Simply announce the URL after eval passes** - the website is already registered.

---

# 🔧 TROUBLESHOOTING: Website 404 Errors

**When a user reports their website shows 404 or "not found":**

1. **Check if the website directory exists** using the `read` tool on `websites/{project-name}/index.php`

2. **If the directory exists**, it should be registered automatically. Try accessing `https://{project-name}.clawku.co` again.

3. **For legacy websites** (built before auto-registration), manual registration may be needed but this is rare.

---

# 🧪 RUNNING UNIT TESTS

**When a user asks to run tests for a website:**

Use the `php_exec` tool - this runs PHP directly on the server in a sandboxed environment:

```json
{
  "script": "tests/run.php"
}
```

**IMPORTANT:**

- Use `php_exec` tool for PHP test commands, NOT `exec` or `devices_run`
- Tests run server-side where the PHP files are located
- The script path is relative to the workspace (websites/{project-name}/)

**Example php_exec call for toko-krenz-kasir:**

```json
{
  "script": "tests/run.php"
}
```

---

# 🔍 PHP LINT - MANDATORY SYNTAX CHECK

**Unit tests do NOT catch PHP syntax errors!** Tests only load files when needed. A syntax error in Auth.php won't be caught if no test uses Auth.

**AFTER running unit tests, you MUST lint ALL PHP files:**

```bash
# Run from project directory
find . -name "*.php" -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```

**If ANY file has syntax errors:**

1. The output will show: `Parse error: syntax error... in /path/to/file.php on line X`
2. **FIX THE ERROR** before proceeding
3. Re-run lint until ALL files pass

**Common syntax errors to watch for:**

- Missing semicolons
- Unclosed brackets/braces
- Invalid null-safe operator usage (e.g., `$arr?['key']` is WRONG, use `$arr['key'] ?? null`)
- Typos in keywords

**Example exec call:**

```json
{
  "command": "find . -name '*.php' -exec php -l {} \\; 2>&1 | grep -v 'No syntax errors'",
  "workdir": "websites/my-project"
}
```

**Expected output when all files pass:** Empty (no output)
**If you see ANY Parse error:** FIX IT before continuing!

---

# 🌐 SMOKE TEST - VERIFY APP LOADS

**After lint passes, verify the app actually loads without 500 errors:**

```bash
# Make a test request to the app
php -r "
\$_SERVER['REQUEST_METHOD'] = 'GET';
\$_SERVER['REQUEST_URI'] = '/';
\$_SERVER['HTTP_HOST'] = 'localhost';
chdir('$(pwd)');
ob_start();
try {
    include 'index.php';
    \$output = ob_get_clean();
    echo strlen(\$output) > 0 ? '✅ App loads OK (' . strlen(\$output) . ' bytes)' : '❌ Empty response';
} catch (Throwable \$e) {
    ob_end_clean();
    echo '❌ FATAL: ' . \$e->getMessage() . ' in ' . \$e->getFile() . ':' . \$e->getLine();
    exit(1);
}
"
```

**If smoke test fails:**

1. Check the error message
2. Fix the issue (usually a missing include, bad autoload, or runtime error)
3. Re-run until it passes

**Only proceed to registration after BOTH lint AND smoke test pass!**

---

# 📜 CLAWKU MICRO MVC v2 CONTRACT

**This is a NON-NEGOTIABLE generation contract. Do NOT deviate. Do NOT improvise.**

You are generating code that MUST strictly conform to this contract. Any deviation will cause eval failure and require repair.

---

## STACK CONTRACT

```
REQUIRED STACK (no exceptions):
├── PHP 8+              ← Server language
├── SQLite              ← Database (single file)
├── htmx                ← AJAX/partial updates
├── Alpine.js           ← Lightweight UI state
└── Server-rendered PHP ← Templates

FORBIDDEN STACK (never use):
├── Node.js             ❌
├── npm / yarn / pnpm   ❌
├── Vite / Webpack      ❌
├── React / Vue / Svelte ❌
├── Composer            ❌ (unless explicitly requested)
├── Laravel / Symfony   ❌
└── Any build step      ❌
```

---

## ARCHITECTURE CONTRACT

This framework is **HTML-first** and **PHP-first**. The server is the source of truth.

### Entry Point

- Single front controller: `index.php` at PROJECT ROOT
- NO `public/` directory
- All requests route through `index.php`

### Request Flow

```
Browser Request
    ↓
index.php (front controller)
    ↓
App.php (router + middleware)
    ↓
Controller (HTTP handling ONLY)
    ↓
Service (business logic) ← IF multi-step workflow
    ↓
Model (database queries)
    ↓
View (HTML rendering)
    ↓
Response (full page OR htmx partial)
```

### Layer Responsibilities

| Layer          | MUST do                                             | MUST NOT do                                              |
| -------------- | --------------------------------------------------- | -------------------------------------------------------- |
| **Controller** | Validate input, call Service/Model, return Response | Contain business logic, build SQL, contain HTML          |
| **Service**    | Multi-step workflows, transactions, business rules  | Handle HTTP, render views, access $_GET/$\_POST directly |
| **Model**      | Database queries, persistence logic                 | Contain business rules, handle HTTP                      |
| **View**       | Render HTML, escape output                          | Contain business logic, make DB queries                  |

---

## CONTROLLER RULES (STRICT)

Controllers MUST be **thin**. They handle HTTP only.

### Controller MAY:

- Validate and sanitize input
- Call ONE Service or Model method
- Return a view or redirect
- Flash session messages

### Controller MUST NOT:

- Contain more than 20 lines of logic per action
- Write to more than ONE table directly
- Contain database transactions
- Build SQL queries
- Contain loops that process business data
- Contain if/else chains for business rules

### When to Extract to Service

**CREATE A SERVICE CLASS when ANY of these apply:**

| Condition                     | Example                                          |
| ----------------------------- | ------------------------------------------------ |
| Writes to >1 table            | Create order + update stock + log transaction    |
| Requires transaction          | Transfer balance between accounts                |
| Has 3+ logical steps          | Validate → Calculate → Create → Notify           |
| Contains business rules       | Apply discount, check eligibility, calculate tax |
| Updates ledger/balance/points | Point earning, wallet topup, stock adjustment    |
| Could be reused               | Same logic needed in web + API + CLI             |

**Example - WRONG (fat controller):**

```php
// ❌ FORBIDDEN - business logic in controller
public function checkout(): void {
    $cart = Cart::getForUser(Auth::id());
    $total = 0;
    foreach ($cart->items as $item) {
        $total += $item->price * $item->qty;
        Stock::decrement($item->product_id, $item->qty); // ❌ Multiple writes
    }
    if ($user->points >= 100) { // ❌ Business rule
        $total -= 10;
    }
    $order = Order::create([...]); // ❌ Another write
    PointLedger::log($user->id, -100, 'redemption'); // ❌ Another write
    // ... more logic
}
```

**Example - CORRECT (thin controller + service):**

```php
// ✅ CORRECT - controller delegates to service
public function checkout(): void {
    $result = CheckoutService::process(Auth::id(), Request::all());

    if ($result->failed()) {
        Session::flash('error', $result->message);
        return $this->redirect('./cart');
    }

    Session::flash('success', 'Order placed!');
    return $this->redirect('./orders/' . $result->order->id);
}
```

---

## SERVICE RULES

Services contain business logic that spans multiple operations.

### Service Structure

```php
<?php
namespace Services;

use Core\Database;
use Models\{Order, Stock, PointLedger};

class CheckoutService {
    public static function process(int $userId, array $input): ServiceResult {
        // Validate
        $cart = Cart::getForUser($userId);
        if ($cart->isEmpty()) {
            return ServiceResult::fail('Cart is empty');
        }

        // Use transaction for multi-table writes
        Database::connection()->beginTransaction();

        try {
            // Step 1: Create order
            $order = Order::create([...]);

            // Step 2: Decrement stock
            foreach ($cart->items as $item) {
                Stock::decrement($item->product_id, $item->qty);
            }

            // Step 3: Apply points if eligible
            if ($input['use_points'] && $user->points >= 100) {
                PointLedger::debit($userId, 100, 'order_' . $order->id);
            }

            // Step 4: Clear cart
            $cart->clear();

            Database::connection()->commit();
            return ServiceResult::ok($order);

        } catch (\Exception $e) {
            Database::connection()->rollBack();
            return ServiceResult::fail('Checkout failed: ' . $e->getMessage());
        }
    }
}
```

---

## MODEL RULES (STRICT)

Models handle database persistence ONLY.

### Model MUST:

- Use prepared statements for ALL queries
- Validate dynamic column names against whitelist
- Return data, not render anything
- Keep query methods specific to entity

### Model MUST NOT:

- Accept arbitrary SQL fragments from user input
- Interpolate unvalidated column names
- Contain business rules
- Access HTTP request data

### SQL Safety Rules

**FORBIDDEN - SQL injection risk:**

```php
// ❌ NEVER DO THIS
public static function search($column, $value) {
    return Database::query("SELECT * FROM users WHERE {$column} = ?", [$value]);
}

// ❌ NEVER DO THIS
public static function orderBy($column, $dir) {
    return Database::query("SELECT * FROM users ORDER BY {$column} {$dir}");
}
```

**REQUIRED - Whitelist validation:**

```php
// ✅ CORRECT - whitelist columns
protected static array $sortable = ['name', 'email', 'created_at'];
protected static array $filterable = ['status', 'role'];

public static function search(string $column, $value): array {
    if (!in_array($column, static::$filterable, true)) {
        throw new \InvalidArgumentException('Invalid filter column');
    }
    return Database::query(
        "SELECT * FROM " . static::$table . " WHERE {$column} = ?",
        [$value]
    )->fetchAll();
}

public static function orderBy(string $column, string $dir = 'ASC'): array {
    if (!in_array($column, static::$sortable, true)) {
        $column = 'id';
    }
    $dir = strtoupper($dir) === 'DESC' ? 'DESC' : 'ASC';
    return Database::query(
        "SELECT * FROM " . static::$table . " ORDER BY {$column} {$dir}"
    )->fetchAll();
}
```

---

## VIEW RULES (STRICT)

Views are organized by purpose. Do NOT mix responsibilities.

### Directory Structure

```
views/
├── layouts/          ← Full HTML skeleton (head, body, nav, footer)
│   └── main.php
├── pages/            ← Complete page content (inside layout)
│   ├── dashboard.php
│   └── contacts/
│       └── index.php
└── partials/         ← Fragments for htmx (NO layout wrapper)
    └── contacts/
        ├── _table.php
        ├── _row.php
        └── _form.php
```

### Rendering Rules

| Request Type                   | Return                                       | Layout?                 |
| ------------------------------ | -------------------------------------------- | ----------------------- |
| Full page (browser navigation) | `$this->view('pages/contacts/index')`        | YES - wrapped in layout |
| htmx partial (hx-get/hx-post)  | `$this->partial('partials/contacts/_table')` | NO - fragment only      |
| JSON API                       | `$this->json([...])`                         | NO - JSON response      |

### View MUST:

- Escape all output: `<?= e($var) ?>`
- Use relative URLs: `href="contacts"` not `href="/contacts"`
- Include CSRF token in forms: `<?= csrf_field() ?>`

### View MUST NOT:

- Make database queries
- Contain business logic
- Use absolute URLs with leading `/`

---

## HTMX RULES (STRICT)

htmx is for **partial page updates**. Server returns **HTML fragments**, not JSON.

### htmx Conventions

| Pattern            | Use                                                                 |
| ------------------ | ------------------------------------------------------------------- |
| List/table refresh | `hx-get="contacts/list" hx-target="#table-body"`                    |
| Form submission    | `hx-post="contacts" hx-target="#table-body" hx-swap="afterbegin"`   |
| Inline edit        | `hx-get="contacts/5/edit" hx-target="#modal-body"`                  |
| Delete row         | `hx-delete="contacts/5" hx-target="closest tr" hx-swap="outerHTML"` |
| Search             | `hx-get="contacts/list" hx-trigger="input changed delay:300ms"`     |

### htmx Response Rules

**htmx endpoints MUST return HTML partials:**

```php
// ✅ CORRECT - return HTML partial
public function list(): void {
    $contacts = Contact::search(Request::get('q', ''));
    $this->partial('partials/contacts/_table', ['contacts' => $contacts]);
}
```

**htmx endpoints MUST NOT return JSON (unless API):**

```php
// ❌ WRONG - htmx expects HTML
public function list(): void {
    $contacts = Contact::all();
    $this->json(['data' => $contacts]); // ❌ htmx can't render this
}
```

### CSRF with htmx

htmx requests need CSRF token in header:

```javascript
// In layout <head>
document.body.addEventListener("htmx:configRequest", function (event) {
  event.detail.headers["X-CSRF-Token"] = document.querySelector('meta[name="csrf-token"]').content;
});
```

---

## SECURITY CONTRACT (NON-NEGOTIABLE)

These are **minimum requirements**. Missing ANY = eval failure.

| Requirement          | Implementation                                      | Check |
| -------------------- | --------------------------------------------------- | ----- |
| Password hashing     | `password_hash($pw, PASSWORD_DEFAULT)`              | ✓     |
| Password verify      | `password_verify($input, $hash)`                    | ✓     |
| Session regeneration | `session_regenerate_id(true)` on login AND logout   | ✓     |
| CSRF on forms        | `<?= csrf_field() ?>` in every POST/PUT/DELETE form | ✓     |
| CSRF validation      | `csrf` middleware on state-changing routes          | ✓     |
| Input validation     | `Validator::make()` before Model::create/update     | ✓     |
| Output escaping      | `<?= e($var) ?>` for all user content               | ✓     |
| Auth middleware      | `['auth']` on protected routes                      | ✓     |
| Prepared statements  | Never interpolate user input into SQL               | ✓     |

---

## FORM ROUTING CONTRACT (CRITICAL - EVAL FAILURE IF VIOLATED)

**Form actions MUST exactly match defined routes.** This is a common source of 404 errors.

### The Rule

| Route Definition                                          | Form Action                                    | Status         |
| --------------------------------------------------------- | ---------------------------------------------- | -------------- |
| `'POST /contacts' => ['ContactController', 'store']`      | `action="contacts"`                            | ✅ CORRECT     |
| `'POST /contacts' => ['ContactController', 'store']`      | `action="contacts/store"`                      | ❌ WRONG - 404 |
| `'PUT /contacts/{id}' => ['ContactController', 'update']` | `action="contacts/<?= $id ?>"` + `_method=PUT` | ✅ CORRECT     |
| `'PUT /contacts/{id}' => ['ContactController', 'update']` | `action="contacts/update"`                     | ❌ WRONG - 404 |

### RESTful Route Pattern (MUST FOLLOW)

```php
// Routes in App.php
'GET /staff' => ['StaffController', 'index', ['auth']],
'POST /staff' => ['StaffController', 'store', ['auth', 'csrf']],
'PUT /staff/{id}' => ['StaffController', 'update', ['auth', 'csrf']],
'DELETE /staff/{id}' => ['StaffController', 'destroy', ['auth', 'csrf']],
```

### Matching Form Actions (MUST FOLLOW)

```php
<!-- CREATE form - POST to collection URL -->
<form method="POST" action="staff">
    <?= csrf_field() ?>
    <!-- fields -->
</form>

<!-- UPDATE form - PUT to resource URL with _method -->
<form method="POST" action="staff/<?= $id ?>">
    <?= csrf_field() ?>
    <input type="hidden" name="_method" value="PUT">
    <!-- fields -->
</form>

<!-- DELETE form - DELETE to resource URL with _method -->
<form method="POST" action="staff/<?= $id ?>">
    <?= csrf_field() ?>
    <input type="hidden" name="_method" value="DELETE">
</form>
```

### Common Mistakes (FORBIDDEN)

```php
// ❌ WRONG - "store" is the controller action, NOT the URL
<form action="staff/store">

// ❌ WRONG - "update" is the controller action, NOT the URL
<form action="staff/update">

// ❌ WRONG - "delete" is the controller action, NOT the URL
<form action="staff/delete">

// ✅ CORRECT - URL matches the route path
<form action="staff">           <!-- POST /staff -->
<form action="staff/5">         <!-- PUT /staff/5 with _method=PUT -->
<form action="staff/5">         <!-- DELETE /staff/5 with _method=DELETE -->
```

### Alpine.js Dynamic Forms

When using Alpine.js for edit/create modes:

```php
<!-- ✅ CORRECT - Dynamic action based on mode -->
<form method="POST" :action="editMode ? 'staff/' + form.id : 'staff'">
    <?= csrf_field() ?>
    <input type="hidden" name="_method" x-bind:value="editMode ? 'PUT' : ''">
    <!-- fields -->
</form>

<!-- ❌ WRONG - Using action names instead of URLs -->
<form method="POST" :action="editMode ? 'staff/update' : 'staff/store'">
```

### Eval Check

The eval-runner will:

1. Extract all routes from `App.php`
2. Scan all view files for form actions
3. **FAIL if any form action doesn't match a defined route**

This check is **CRITICAL severity** - forms that don't work are unusable.

---

## DELETE POLICY

**Default: Soft delete for business entities.**

### Soft Delete (default)

```sql
-- Add to entity tables
deleted_at TEXT DEFAULT NULL
```

```php
// Model
public static function all(): array {
    return Database::query(
        "SELECT * FROM " . static::$table . " WHERE deleted_at IS NULL ORDER BY id DESC"
    )->fetchAll();
}

public static function delete(int $id): bool {
    Database::query(
        "UPDATE " . static::$table . " SET deleted_at = datetime('now') WHERE id = ?",
        [$id]
    );
    return true;
}

public static function restore(int $id): bool {
    Database::query(
        "UPDATE " . static::$table . " SET deleted_at = NULL WHERE id = ?",
        [$id]
    );
    return true;
}
```

### Hard Delete (only when appropriate)

Use hard delete ONLY for:

- Join/pivot tables
- Temporary/cache tables
- Session records
- Explicitly disposable data

---

## REQUEST HANDLING RULES

Request sources MUST be explicit. Do NOT merge silently.

### Request Methods

```php
// ✅ CORRECT - explicit source
$search = Request::get('q');           // Query string only
$email = Request::post('email');       // POST body only
$data = Request::json();               // JSON body only
$file = Request::file('avatar');       // Uploaded file

// ✅ When you genuinely need both
$value = Request::input('key');        // POST then GET fallback
```

### Input Sanitization

```php
// Use typed methods
$name = Request::string('name', 100);  // Trimmed, stripped, max 100 chars
$email = Request::email('email');      // Validated email or empty
$page = Request::int('page');          // Integer or 0
$price = Request::float('price');      // Float or 0.0
```

---

## 🚨 CRITICAL: COMMON FAILURES TO AVOID 🚨

**These issues make apps unusable. NEVER ship code with these problems.**

### FAILURE 1: Auth Returns 401 Instead of Redirect

**WRONG - Returns 401, user sees error page:**

```php
class AuthMiddleware {
    public function handle() {
        if (!Auth::check()) {
            Response::status(401);
            return false; // ❌ BROKEN - user sees ugly 401
        }
    }
}
```

**CORRECT - Redirects to login:**

```php
class AuthMiddleware {
    public function handle() {
        if (!Auth::check()) {
            Response::redirect('./login'); // ✅ Good UX
            return false;
        }
        return true;
    }
}
```

### FAILURE 2: White Blank Page on Error (500)

**WRONG - No error display:**

```php
// config/app.php
'debug' => false, // ❌ User sees blank page
```

**CORRECT - Show errors in development:**

```php
// config/app.php
'debug' => true, // ✅ Shows helpful error messages

// Also in App.php bootstrap:
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### FAILURE 3: Migrations Not Auto-Run

**Users should NOT need to run migrations manually. Auto-migrate on boot!**

**CORRECT - Auto-migrate in App.php:**

```php
class App {
    public static function boot() {
        // ... autoloader, config, session ...

        // Auto-migrate: run pending migrations on every boot
        // Safe because migrations check if already applied
        Database::migrate();

        // ... routes, dispatch ...
    }
}
```

**In Database.php - Safe migration check:**

```php
public static function migrate() {
    $migrationsDir = BASE_PATH . '/migrations';
    if (!is_dir($migrationsDir)) return;

    // Create migrations table if not exists
    self::$pdo->exec('CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )');

    // Get applied migrations
    $applied = self::$pdo->query('SELECT name FROM migrations')
        ->fetchAll(PDO::FETCH_COLUMN);

    // Run pending migrations
    foreach (glob($migrationsDir . '/*.sql') as $file) {
        $name = basename($file);
        if (!in_array($name, $applied)) {
            self::$pdo->exec(file_get_contents($file));
            self::$pdo->prepare('INSERT INTO migrations (name) VALUES (?)')
                ->execute([$name]);
        }
    }
}
```

### FAILURE 4: Session Not Started Before Auth Check

**WRONG - Session not started:**

```php
// index.php
require 'app/Core/App.php';
App::boot(); // ❌ If boot() doesn't start session first...

// AuthMiddleware
if (!isset($_SESSION['user_id'])) // ❌ Session not started = always false
```

**CORRECT - Session FIRST in boot:**

```php
class App {
    public static function boot() {
        // 1. Paths and autoloader
        define('BASE_PATH', dirname(__DIR__));
        spl_autoload_register(...);

        // 2. START SESSION BEFORE ANYTHING ELSE
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 3. Then config, database, routes...
    }
}
```

### FAILURE 5: Model References Column Not in Migration (SCHEMA MISMATCH)

**This is the #1 cause of "no such column" errors. ALWAYS check your migrations!**

**WRONG - Model uses `discount` but migration doesn't have it:**

```php
// Migration: 001_create_transactions.php
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    total DECIMAL(10,2),  // ❌ No discount column!
    created_at DATETIME
);

// Model: Transaction.php
public static function todayStats() {
    return Database::query("
        SELECT SUM(total) as revenue, SUM(discount) as discounts  // ❌ CRASH!
        FROM transactions WHERE DATE(created_at) = DATE('now')
    ")->fetch();
}
```

**CORRECT - Every column in Model queries MUST exist in Migration:**

```php
// Migration: 001_create_transactions.php
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    discount DECIMAL(10,2) DEFAULT 0,  // ✅ Column exists
    total DECIMAL(10,2),
    created_at DATETIME
);

// Model: Transaction.php - Now works!
public static function todayStats() {
    return Database::query("
        SELECT SUM(total) as revenue, SUM(discount) as discounts  // ✅ Works
        FROM transactions WHERE DATE(created_at) = DATE('now')
    ")->fetch();
}
```

**CHECKLIST before writing Model methods:**

```
For EVERY SQL column reference in Model:
□ Is this column in the CREATE TABLE statement?
□ If it's a joined table, is the column in THAT table's migration?
□ Did I spell the column name correctly?
```

### FAILURE 6: Routes Don't Match Form Actions

**WRONG - Form posts to `/staff/store` but route is `/staff`:**

```php
// App.php routes
'POST /staff' => ['StaffController', 'store'],

// View form
<form action="./staff/store" method="POST">  // ❌ 404!
```

**CORRECT - Form action matches route path:**

```php
// App.php routes
'POST /staff' => ['StaffController', 'store'],

// View form
<form action="./staff" method="POST">  // ✅ Matches route
```

---

## ERROR HANDLING RULES

Errors MUST be handled consistently by response type.

| Request Type | Error Response                |
| ------------ | ----------------------------- |
| Full page    | Render error view with layout |
| htmx partial | Return HTML alert fragment    |
| JSON API     | Return JSON error envelope    |

### Error Response Examples

**Full page error:**

```php
if (!$contact) {
    Response::status(404);
    return $this->view('errors/404', ['message' => 'Contact not found']);
}
```

**htmx error:**

```php
if (!$contact) {
    Response::status(404);
    echo '<div class="alert alert-error">Contact not found</div>';
    return;
}
```

**JSON API error:**

```php
if (!$contact) {
    return $this->json(['error' => 'Contact not found'], 404);
}
```

---

## RUNTIME CONTRACT

### Boot Sequence (index.php)

```
1. Define BASE_PATH
2. Register autoloader
3. Load config (store in $GLOBALS['config'])
4. Initialize Session
5. Initialize Database (connection only)
6. Load routes
7. Dispatch request
```

### REQUIRED at Boot

- ✅ `Database::migrate()` - AUTO-RUN migrations for good UX (safe - checks if already applied)

### FORBIDDEN at Boot

- ❌ Heavy computations
- ❌ External API calls
- ❌ File system scans

### Config Access

```php
// ✅ CORRECT - use helper
$appName = config('app.name');
$debug = config('app.debug', false);

// Config stored in $GLOBALS['config'] by App.php
```

---

## URL RULES (CRITICAL)

App runs on subpath: `https://project.clawku.co/`

### ALL URLs MUST be relative

```php
// ✅ CORRECT
href="contacts"
href="./contacts"
action="contacts"
src="assets/style.css"
Response::redirect('./dashboard')

// ❌ FORBIDDEN - will break
href="/contacts"
action="/contacts"
src="/assets/style.css"
Response::redirect('/dashboard')
```

---

## GENERATION OUTPUT FORMAT

When generating files, use this exact format:

```
===FILE: path/to/file.php===
<?php
// Complete file contents
// Must be ready to write as-is
// No placeholders or TODOs

===FILE: path/to/another.php===
<?php
// Another complete file
```

### Generation Checklist

Before completing generation, verify:

- [ ] All manifest entities have Model + Controller + Views
- [ ] All routes point to real controller methods
- [ ] All views referenced exist
- [ ] CSRF in all forms
- [ ] Session regeneration in Auth
- [ ] No absolute URLs
- [ ] No migrate on boot
- [ ] Validator class exists
- [ ] CSS file exists
- [ ] No forbidden PHP functions (eval, exec, shell_exec, etc.)
- [ ] No path escapes (../, absolute paths)

---

## PHP SANDBOX CONTRACT

**These PHP functions/patterns are FORBIDDEN and will fail eval:**

| Category            | Forbidden                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Code Execution**  | `eval()`, `assert()`, `create_function()`, `preg_replace()` with /e modifier                                             |
| **Shell Execution** | `exec()`, `shell_exec()`, `system()`, `passthru()`, `popen()`, `proc_open()`, `pcntl_exec()`, backticks (\`cmd\`)        |
| **Dynamic Include** | `include($_GET[...])`, `require($_POST[...])`, any include with user input                                               |
| **Network**         | `fsockopen()`, `pfsockopen()`, `stream_socket_client()`, `curl_init()`, `curl_exec()`, `file_get_contents('http://...')` |
| **File System**     | `chmod()`, `chown()`, `symlink()`                                                                                        |
| **Path Escapes**    | `../`, absolute paths like `/etc/`, `/var/`, `/tmp/`, `/home/`                                                           |
| **Info Disclosure** | `phpinfo()`                                                                                                              |
| **Config Bypass**   | `ini_set('disable_functions')`, `ini_restore()`, `dl()`                                                                  |

### Allowed (workspace-only)

| Allowed               | Correct Usage                                                      |
| --------------------- | ------------------------------------------------------------------ |
| `file_get_contents()` | Relative paths only: `file_get_contents('cache/config.json')`      |
| `file_put_contents()` | Relative paths only: `file_put_contents('cache/data.json', $data)` |
| `fopen/fread/fwrite`  | Relative paths only: `fopen('logs/app.log', 'a')`                  |
| `include/require`     | Relative or `__DIR__`: `include __DIR__ . '/views/header.php'`     |
| SQLite                | Via DATABASE_PATH env: `new PDO('sqlite:' . DATABASE_PATH)`        |

### Examples

```php
// ✅ CORRECT - relative paths for cache/logs
$data = file_get_contents('cache/config.json');
$content = file_get_contents(__DIR__ . '/templates/email.html');
// Database uses DATABASE_PATH constant (set by platform)
$db = new PDO('sqlite:' . DATABASE_PATH);
include 'views/header.php';

// ❌ FORBIDDEN - will fail eval
$data = file_get_contents('/etc/passwd');           // Absolute system path
$data = file_get_contents('../../../etc/passwd');   // Path traversal
$data = file_get_contents($_GET['file']);           // User-controlled path
shell_exec('ls -la');                               // Shell execution
eval($code);                                        // Code execution
curl_init('https://external.com');                  // Network access
```

---

## FORBIDDEN PATTERNS SUMMARY

These will cause **immediate eval failure**:

| Pattern                            | Why Forbidden                             |
| ---------------------------------- | ----------------------------------------- |
| `Database::migrate()` in App boot  | Slows every request, risks corruption     |
| `href="/path"` (absolute URL)      | Breaks on subpath deployment              |
| `public/` directory                | Wrong structure for this framework        |
| Business logic in Controller       | Violates thin controller rule             |
| SQL string interpolation           | SQL injection risk                        |
| Missing CSRF token                 | Security vulnerability                    |
| Missing session regeneration       | Session fixation risk                     |
| JSON response for htmx             | htmx expects HTML                         |
| Node/npm/Vite instructions         | Wrong stack                               |
| Hard delete for business entities  | Data loss risk                            |
| `eval()`, `exec()`, `shell_exec()` | Code/shell execution - security risk      |
| `../` path traversal               | Escape sandbox - security risk            |
| Absolute paths `/etc/`, `/var/`    | Access outside workspace - security risk  |
| `curl_init()`, `fsockopen()`       | External network - data exfiltration risk |
| `file_get_contents('http://...')`  | External network - SSRF risk              |

---

# END OF CONTRACT

**Everything below this line is implementation reference. The contract above is LAW.**

---

## ⛔⛔⛔ FORBIDDEN - NEVER DO THESE ⛔⛔⛔

```
❌ NEVER create a public/ directory
❌ NEVER create public/index.php
❌ NEVER create public/assets/
❌ NEVER reference "public" anywhere in your code

✅ Put index.php at PROJECT ROOT
✅ Put assets/ at PROJECT ROOT
✅ Everything lives at project root level
```

## 🚨🚨🚨 ABSOLUTE REQUIREMENTS - VIOLATIONS WILL BE REJECTED 🚨🚨🚨

### ⛔ MANDATORY BUILD ORDER - CORE FRAMEWORK FIRST! ⛔

```
┌─────────────────────────────────────────────────────────────────┐
│  🛑🛑🛑 STEP 1: CREATE ALL 10 CORE FILES FIRST! 🛑🛑🛑          │
│                                                                  │
│  You MUST create these files BEFORE anything else:              │
│                                                                  │
│  □ index.php               ← Entry point (WRITE THIS FIRST!)   │
│  □ app/Core/App.php        ← Bootstrap & Router                │
│  □ app/Core/Database.php   ← PDO wrapper & migrations          │
│  □ app/Core/Controller.php ← Base controller class             │
│  □ app/Core/Model.php      ← Base model class                  │
│  □ app/Core/Request.php    ← Request helper                    │
│  □ app/Core/Response.php   ← Response helper                   │
│  □ app/Core/Session.php    ← Session wrapper                   │
│  □ app/Core/Auth.php       ← Authentication                    │
│  □ app/Core/Middleware.php ← Middleware runner                 │
│                                                                  │
│  ⛔ DO NOT write Controllers until ALL Core files exist!        │
│  ⛔ DO NOT write Models until ALL Core files exist!             │
│  ⛔ DO NOT write Views until ALL Core files exist!              │
│  ⛔ DO NOT write Tests until ENTIRE app is complete!            │
└─────────────────────────────────────────────────────────────────┘
```

### STRICT BUILD ORDER (follow exactly):

```
STEP 1: CORE FRAMEWORK (create ALL 10 files above FIRST)
        ↓
STEP 2: config/app.php
        ↓
STEP 3: assets/style.css (CSS REQUIRED!)
        ↓
STEP 4: migrations/*.sql (database tables)
        ↓
STEP 5: app/Models/*.php (User.php + entity models)
        ↓
STEP 6: app/Controllers/*.php (Auth, Dashboard, entities)
        ↓
STEP 7: views/**/*.php (layouts, auth, dashboard, entities)
        ↓
STEP 8: tests/*.php (ONLY after ALL above are complete)
        ↓
STEP 9: Run tests with `php tests/run.php`
        ↓
STEP 10: PHP LINT ALL FILES (catches syntax errors tests miss!)
        ↓
STEP 11: SMOKE TEST (verify app actually loads)
        ↓
STEP 12: Register website and announce URL
```

**WHY THIS ORDER MATTERS**:

- Controllers EXTEND Core\Controller - won't work without it!
- Models EXTEND Core\Model - won't work without it!
- Views USE Core helpers - won't work without them!
- Tests VERIFY working code - fail if Core is missing!

### URL PATHS - NO ROOT PATHS EVER!

The app runs on a SUBPATH, not domain root. ROOT PATHS WILL BREAK EVERYTHING.

```
❌ FORBIDDEN (will break):
   href="/assets/style.css"
   href="/login"
   action="/api/submit"
   src="/images/logo.png"
   Response::redirect('/dashboard')
   Location: /home

✅ REQUIRED (use relative paths):
   href="assets/style.css"
   href="./assets/style.css"
   href="login"
   action="login"
   src="images/logo.png"
   Response::redirect('./dashboard')
```

**EVERY href, src, action, redirect MUST be relative. NO LEADING SLASH EVER.**

### MOBILE-FIRST DESIGN - NOT OPTIONAL!

```
❌ FORBIDDEN:
   - Desktop-first layouts that shrink on mobile
   - Fixed widths (width: 800px)
   - Tiny fonts (< 16px base)
   - Tiny touch targets (< 44px)
   - No media queries

✅ REQUIRED:
   - Mobile layout FIRST, enhance for desktop with min-width media queries
   - Fluid widths (100%, max-width)
   - 16px+ base font size
   - 44px+ touch targets (buttons, inputs)
   - @media (min-width: 768px) for desktop enhancements
```

### VISUAL DESIGN - CLAWKU DESIGN SYSTEM COMPLIANCE

**Reference the MANDATORY DESIGN QUALITY section above for full design system.**

```
❌ FORBIDDEN - INSTANT FAIL:
   - Plain white backgrounds with no depth
   - Generic Bootstrap template look ("AI-generated admin panel")
   - NOT using Tailwind + daisyUI (use the CDN setup from design system)
   - Giant rounded corners everywhere (daisyUI defaults are fine)
   - Dramatic floating shadows (use shadow-sm, NOT shadow-xl)
   - Generic labels: "Dashboard", "Manage Items", "Add New", "Submit"
   - Random colors (must use daisyUI theme consistently)
   - Cramped spacing (use Tailwind spacing: p-4, gap-4, etc.)
   - Browser default forms (must use daisyUI input/select classes)
   - Tables without hover states or zebra stripes
   - No empty states ("No data" plain text is lazy)
   - No loading indicators for async operations
   - No feedback on actions (silent saves are confusing)

✅ REQUIRED - CLAWKU QUALITY:
   - Use Tailwind CSS + daisyUI via CDN
   - Choose appropriate daisyUI theme (corporate/business/cupcake/etc.)
   - Use chosen layout pattern (sidebar-workspace/topnav-operations/list-detail)
   - Domain-specific labels (not generic)
   - Use daisyUI components: btn, card, input, select, table, modal, alert
   - Grounded cards with subtle shadows (shadow-sm)
   - Proper spacing with Tailwind utilities (p-4, m-2, gap-4)
   - Hover states on ALL interactive elements (hover: class)
   - Success/error alerts using daisyUI alert component
   - Loading states using daisyUI loading class on buttons
   - Useful empty states with icon + action button
   - Confirmation dialogs using daisyUI modal
   - Charts using ECharts with theme colors
```

### 🎨 COLOR SCHEME - daisyUI THEMES

**Use daisyUI's built-in themes - they're well-designed and cohesive.**

**Theme Selection by App Type:**

| App Type                  | daisyUI Theme | Why                            |
| ------------------------- | ------------- | ------------------------------ |
| POS, CRM, Finance, Admin  | `corporate`   | Professional blue, clean grays |
| Internal Tools, Inventory | `business`    | Serious, dark-friendly         |
| Shop, Restaurant, Booking | `cupcake`     | Warm pinks, friendly           |
| Cafe, Bakery, Lifestyle   | `autumn`      | Warm oranges, cozy             |
| SaaS Portal, Analytics    | `winter`      | Cool, modern, airy             |
| Tech Dashboard            | `nord`        | Minimalist, Scandinavian       |

**Configure in header.php:**

```html
<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

```html
<!-- Set theme on html element -->
<html data-theme="corporate"></html>
```

**Custom Theme (if needed):**

```html
<script>
  tailwind.config = {
    daisyui: {
      themes: [
        {
          clawku: {
            primary: "#0052cc",
            secondary: "#5e6c84",
            accent: "#00875a",
            neutral: "#172b4d",
            "base-100": "#ffffff",
            "base-200": "#f4f5f7",
            "base-300": "#dfe1e6",
            info: "#3b82f6",
            success: "#00875a",
            warning: "#ff991f",
            error: "#de350b",
          },
        },
      ],
    },
  };
</script>
<html data-theme="clawku"></html>
```

**Use daisyUI color classes:**

```html
<!-- Text colors -->
<span class="text-primary">Primary text</span>
<span class="text-base-content">Normal text</span>
<span class="text-base-content/60">Muted text (60% opacity)</span>

<!-- Background colors -->
<div class="bg-base-100">Card background</div>
<div class="bg-base-200">Page background</div>
<div class="bg-primary text-primary-content">Primary button</div>

<!-- Status colors -->
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Failed</span>
```

---

## 📦 COMPLEX APP REQUIREMENTS

### POS / KASIR SYSTEM - FULL IMPLEMENTATION SPEC

When user asks for POS/Kasir/Cash Register system, you MUST implement ALL of these:

**1. Multi-User Kasir (REQUIRED):**

```
□ User roles: admin, kasir (cashier), manager
□ Login with role-based permissions
□ Admin can create/manage kasir accounts
□ Each kasir has their own session tracking
□ Shift management (clock in/out)
```

**2. Inventory / Products (REQUIRED):**

```
□ Product CRUD with: name, SKU, price, cost, stock, category, image
□ Category management
□ Stock tracking (auto-decrement on sale)
□ Low stock alerts (configurable threshold)
□ Stock adjustment history
□ Barcode/SKU search
```

**3. Customer / Membership (REQUIRED):**

```
□ Customer CRUD: name, phone, email, address
□ Membership levels (bronze, silver, gold, etc)
□ Points accumulation on purchases
□ Points redemption
□ Customer purchase history
□ Birthday/special discounts
```

**4. Voucher / Discount (REQUIRED):**

```
□ Voucher CRUD: code, type (percent/fixed), value, min_purchase
□ Expiry date handling
□ Usage limit (total and per-customer)
□ Apply voucher at checkout
□ Voucher usage tracking
```

**5. Multi-Store (REQUIRED if requested):**

```
□ Store/outlet management
□ Stock per store
□ Transfer stock between stores
□ Sales reports per store
□ User assignment to stores
```

**6. Financial Reports (REQUIRED):**

```
□ Daily sales summary
□ Weekly/monthly reports
□ Profit/loss calculation (sales - cost)
□ Sales by product
□ Sales by category
□ Sales by kasir
□ Sales by payment method
□ Export to CSV/print
```

**7. POS Screen (REQUIRED - THE CORE FEATURE):**

```
□ Product search/browse
□ Add to cart with quantity
□ Cart total calculation
□ Apply voucher/discount
□ Apply membership points
□ Multiple payment methods (cash, card, transfer)
□ Change calculation for cash
□ Receipt generation
□ Transaction save to database
□ Stock auto-update
```

**8. Transaction History (REQUIRED):**

```
□ List all transactions with filters (date, kasir, store)
□ Transaction details (items, customer, payment)
□ Void/refund capability (admin only)
□ Receipt reprint
```

---

## 🛑 MANDATORY BEHAVIOR - READ FIRST 🛑

### 📋 PRESENT PLAN TO USER FIRST - MANDATORY

**CRITICAL: Before ANY code generation, you MUST:**

1. **Present the plan** to the user
2. **WAIT for user confirmation** (user must say "go", "yes", "proceed", "ok", etc.)
3. **Only then** start generating code

⛔ **DO NOT start coding immediately!** Wait for explicit user approval.

When a user requests a webapp, IMMEDIATELY reply with a structured plan summary and ASK for confirmation:

```
📋 **Website Build Plan: {project-name}**

**Entities:**
- {Entity1}: {field1}, {field2}, {field3}
- {Entity2}: {field1}, {field2}

**Features:**
- Dashboard with {stats}
- {Entity1} management (CRUD)
- {Entity2} management (CRUD)
- Authentication (login/logout)

**Pages:**
- Dashboard
- {Entity1} list/create/edit
- {Entity2} list/create/edit
- Login/Register

**Estimated files:** ~{N} files
**Estimated build time:** ~2-3 minutes

Ready to build? Reply "go" to start, or let me know if you want changes to the plan.
```

⛔ **STOP HERE AND WAIT!** Do not generate any code until user confirms.

Only after user replies with confirmation (go/yes/ok/proceed/build it/start), then begin the build process.

---

### MANIFEST-FIRST GENERATION

**CRITICAL**: Before writing ANY code, create a manifest that defines the contract.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANIFEST-FIRST WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PHASE -1: PRESENT PLAN & WAIT FOR APPROVAL                   │
│   ─────────────────────────────────────────────────             │
│   0. REPLY with structured plan showing entities, features,    │
│      pages, and estimated file count                           │
│   1. ASK user to confirm ("Reply 'go' to start")               │
│   2. WAIT for user response - DO NOT PROCEED YET!              │
│                                                                 │
│   ⛔ STOP! Do not write ANY code until user says "go"!          │
│                                                                 │
│   PHASE 0: PLAN (create manifest BEFORE any code!)             │
│   ─────────────────────────────────────────────────             │
│   1. ANALYZE user request → identify entities, fields, routes  │
│   2. CREATE manifest.json with exact contract:                 │
│      - entities[] with fields, types, validation               │
│      - routes[] with method, path, controller, middleware      │
│      - pages[] with views and components                       │
│      - migrations[] with SQL definitions                       │
│                                                                 │
│   ⛔ DO NOT write code until manifest exists!                   │
│                                                                 │
│   PHASE 1: GENERATE (follow manifest exactly)                  │
│   ─────────────────────────────────────────────────             │
│   1. WRITE Core framework files ────────────────────────────►  │
│   2. WRITE Config + Entry point ────────────────────────────►  │
│   3. WRITE CSS STYLESHEET (assets/style.css) ───────────────►  │
│   4. WRITE Migrations (from manifest.migrations) ───────────►  │
│   5. WRITE Models (from manifest.entities) ─────────────────►  │
│   6. WRITE Controllers (from manifest.routes) ──────────────►  │
│   7. WRITE Views (from manifest.pages) ─────────────────────►  │
│              │                                                  │
│              ▼                                                  │
│   PHASE 2: EVAL (run automated checks)                         │
│   ─────────────────────────────────────────────────             │
│   8. RUN eval checks:                                          │
│      □ PHP syntax: php -l on all .php files                    │
│      □ Route consistency: all manifest routes have handlers    │
│      □ Entity completeness: all fields have CRUD               │
│      □ Security: CSRF tokens, session regen, input validation  │
│      □ Framework contract: no migrate on boot, relative URLs   │
│              │                                                  │
│              ▼                                                  │
│   9. ISSUES FOUND? ────── YES ──► REPAIR (targeted fixes)      │
│              │                                                  │
│              NO                                                 │
│              ▼                                                  │
│   PHASE 3: TEST (only after eval passes!)                      │
│   ─────────────────────────────────────────────────             │
│   10. WRITE test runner + TestCase + feature tests ─────────► │
│   11. RUN TESTS: php_exec `tests/run.php`                      │
│   12. ALL PASS? ────────── NO ──► Fix APP CODE, re-test        │
│              │                                                  │
│              YES                                                │
│              ▼                                                  │
│   13. REPLY with preview URL + test results                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### MANIFEST SCHEMA

```json
{
  "project": "unique-project-name",
  "name": "Human Readable Name",
  "description": "What this app does",
  "entities": [
    {
      "name": "Contact",
      "table": "contacts",
      "fields": [
        { "name": "name", "type": "string", "required": true, "maxLength": 100 },
        { "name": "email", "type": "email", "required": false },
        { "name": "phone", "type": "string", "maxLength": 20 },
        {
          "name": "status",
          "type": "enum",
          "values": ["lead", "active", "cold"],
          "default": "lead"
        },
        { "name": "notes", "type": "text", "maxLength": 2000 }
      ],
      "searchable": ["name", "email", "phone"]
    }
  ],
  "routes": [
    {
      "method": "GET",
      "path": "/",
      "controller": "DashboardController",
      "action": "index",
      "middleware": ["auth"]
    },
    {
      "method": "GET",
      "path": "/contacts",
      "controller": "ContactController",
      "action": "index",
      "middleware": ["auth"]
    },
    {
      "method": "POST",
      "path": "/contacts",
      "controller": "ContactController",
      "action": "store",
      "middleware": ["auth"]
    },
    {
      "method": "GET",
      "path": "/contacts/{id}/edit",
      "controller": "ContactController",
      "action": "edit",
      "middleware": ["auth"]
    },
    {
      "method": "PUT",
      "path": "/contacts/{id}",
      "controller": "ContactController",
      "action": "update",
      "middleware": ["auth"]
    },
    {
      "method": "DELETE",
      "path": "/contacts/{id}",
      "controller": "ContactController",
      "action": "destroy",
      "middleware": ["auth"]
    }
  ],
  "pages": [
    { "name": "dashboard", "views": ["dashboard/index"] },
    {
      "name": "contacts",
      "views": ["contacts/index", "contacts/_table", "contacts/_row", "contacts/_form"]
    }
  ],
  "migrations": [
    {
      "name": "001_create_users_table",
      "sql": "CREATE TABLE users (...)"
    },
    {
      "name": "002_create_contacts_table",
      "sql": "CREATE TABLE contacts (...)"
    }
  ]
}
```

### WRITE → EVAL → REPAIR LOOP

**CRITICAL**: After EVERY tool call, you MUST evaluate and continue. Never stop mid-task.

**⚠️ WARNING: Do NOT skip to Phase 2 before Phase 1 is complete!**

---

## 🔍 EVAL LOOP - AUTOMATED VERIFICATION

After generating all code, run these checks. Each issue has a code for targeted repair.

### EVAL CHECKLIST

```
┌─────────────────────────────────────────────────────────────────┐
│  CATEGORY          │  CHECK                   │  ISSUE CODE    │
├─────────────────────────────────────────────────────────────────┤
│  COMPLETENESS                                                   │
│  ──────────────────────────────────────────────────────────────│
│  □ All manifest entities have Model        │  E001-MISSING-MODEL   │
│  □ All manifest entities have Controller   │  E002-MISSING-CTRL    │
│  □ All manifest routes have handler        │  E003-MISSING-ROUTE   │
│  □ All manifest pages have views           │  E004-MISSING-VIEW    │
│  □ All manifest migrations exist           │  E005-MISSING-MIGRATION│
│  □ CSS file exists (assets/style.css)      │  E006-MISSING-CSS     │
│                                                                  │
│  SYNTAX                                                          │
│  ──────────────────────────────────────────────────────────────│
│  □ php -l passes on ALL .php files         │  S001-PHP-SYNTAX      │
│  □ No undefined class references           │  S002-UNDEFINED-CLASS │
│  □ No missing use statements               │  S003-MISSING-USE     │
│                                                                  │
│  CONSISTENCY                                                     │
│  ──────────────────────────────────────────────────────────────│
│  □ Model $table matches migration table    │  C001-TABLE-MISMATCH  │
│  □ Model $fillable matches entity fields   │  C002-FILLABLE-MISMATCH│
│  □ Controller uses correct Model class     │  C003-MODEL-MISMATCH  │
│  □ View form fields match entity fields    │  C004-FORM-MISMATCH   │
│                                                                  │
│  FRAMEWORK CONTRACT                                              │
│  ──────────────────────────────────────────────────────────────│
│  ✓ Database::migrate() in App.php boot     │  F001-AUTO-MIGRATE    │
│  □ NO absolute URLs (no leading /)         │  F002-ABSOLUTE-URL    │
│  □ NO public/ directory created            │  F003-PUBLIC-DIR      │
│  □ index.php at project root               │  F004-INDEX-LOCATION  │
│  □ assets/ at project root                 │  F005-ASSETS-LOCATION │
│  □ config() returns from $GLOBALS['config']│  F006-CONFIG-GLOBAL   │
│                                                                  │
│  SECURITY                                                        │
│  ──────────────────────────────────────────────────────────────│
│  □ CSRF token in ALL forms                 │  X001-MISSING-CSRF    │
│  □ CSRF validation on POST/PUT/DELETE      │  X002-NO-CSRF-CHECK   │
│  □ session_regenerate_id on login          │  X003-NO-SESSION-REGEN│
│  □ password_hash for passwords             │  X004-PLAIN-PASSWORD  │
│  □ Input validation before DB writes       │  X005-NO-VALIDATION   │
│  □ htmlspecialchars on output (e() helper) │  X006-XSS-RISK        │
│                                                                  │
│  RUNTIME SMOKE                                                   │
│  ──────────────────────────────────────────────────────────────│
│  □ index.php includes without fatal error  │  R001-FATAL-INCLUDE   │
│  □ Migrations run without SQL error        │  R002-MIGRATION-FAIL  │
│  □ Routes resolve to controllers           │  R003-ROUTE-RESOLVE   │
└─────────────────────────────────────────────────────────────────┘
```

### RUNNING EVAL CHECKS

**Use the automated eval runner:**

```bash
# Human-readable output + JSON
php eval-runner.php /path/to/project

# JSON only (for parsing)
php eval-runner.php /path/to/project --quiet

# Exit code 0 = ready_to_run true
# Exit code 1 = ready_to_run false (repair needed)
# Exit code 2 = usage error
```

**JSON Output Schema:**

```json
{
  "app_name": "project-name",
  "generation_id": "eval_20260320_123456",
  "status": "pass | fail | partial",
  "summary": {
    "total_checks": 20,
    "passed": 18,
    "failed": 2,
    "warnings": 0,
    "critical_failures": 1
  },
  "categories": {
    "completeness": { "status": "pass", "checks": [...] },
    "syntax": { "status": "pass", "checks": [...] },
    "consistency": { "status": "pass", "checks": [...] },
    "framework_contract": { "status": "fail", "checks": [...] },
    "security": { "status": "pass", "checks": [...] },
    "js_syntax": { "status": "pass", "checks": [...] },
    "runtime_smoke": { "status": "pass", "checks": [...] }
  },
  "missing_files": [],
  "empty_files": [],
  "changed_files_required": ["app/Core/App.php"],
  "repair_priority": [
    {
      "severity": "high",
      "file": "app/Core/App.php",
      "issue_code": "NO_MIGRATION_ON_BOOT",
      "message": "Database::migrate() called during normal app boot"
    }
  ],
  "ready_to_run": false
}
```

**Per-Check Object:**

```json
{
  "id": "ROUTE_CONTROLLER_EXISTS",
  "status": "pass | fail | warning",
  "severity": "critical | high | medium | low",
  "file": "app/Core/App.php",
  "message": "All routes point to existing controllers",
  "details": { "route_count": 10 },
  "expected": "Routes resolve to real handlers",
  "actual": "All routes valid"
}
```

The eval runner checks:

- **Completeness**: Required files exist, no public/ directory
- **Syntax**: PHP lint on all files, SQL migration structure
- **Consistency**: Routes → controllers, controllers → views, models → tables
- **Framework Contract**: No migrate on boot, no absolute URLs
- **Security**: CSRF tokens, session regeneration, password_hash, PHP sandbox violations
- **JS Syntax**: JavaScript syntax validation (standalone .js files + inline scripts)
- **Runtime Smoke**: Entry point parses, migrations exist

**Manual checks (if needed):**

```bash
# 1. PHP Syntax Check (all files)
find . -name "*.php" -exec php -l {} \; 2>&1 | grep -v "No syntax errors"

# 2. Check for absolute URLs (forbidden)
grep -rn "href=\"/" --include="*.php" . | grep -v "href=\"//"
grep -rn "action=\"/" --include="*.php" .
grep -rn "src=\"/" --include="*.php" .

# 3. Check for migrate on boot (forbidden)
grep -rn "Database::migrate()" app/Core/App.php

# 4. Check CSRF tokens in forms
grep -rn "<form" views/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  grep -q "csrf_field()" "$file" || echo "MISSING CSRF: $file"
done

# 5. Check session regeneration on login
grep -rn "session_regenerate_id" app/Core/Auth.php
```

---

## 🔧 REPAIR LOOP - TARGETED FIXES

When eval finds issues, apply targeted repairs using issue codes.

### REPAIR PROMPTS BY ISSUE CODE

**E001-MISSING-MODEL**: Create model file

```
Create app/Models/{Entity}.php extending Core\Model with:
- protected static string $table = '{table}';
- protected static array $fillable = [{fields}];
```

**E002-MISSING-CTRL**: Create controller file

```
Create app/Controllers/{Entity}Controller.php extending Core\Controller with:
- CRUD methods: index, list, create, store, edit, update, destroy
- AgentAPI::register() in constructor
```

**F001-AUTO-MIGRATE**: Ensure auto-migrate is present

```
In app/Core/App.php boot():
- REQUIRED: Database::migrate(); // Auto-run migrations for good UX
- This is safe - migrations check if already applied before running
- Users should NOT need to run migrations manually
```

**F002-ABSOLUTE-URL**: Fix to relative URLs

```
Replace all instances of:
- href="/path" → href="path" or href="./path"
- action="/path" → action="path"
- src="/path" → src="path"
- Response::redirect('/path') → Response::redirect('./path')
```

**F006-CONFIG-GLOBAL**: Fix config helper

```
In app/Core/App.php:
- Store config in $GLOBALS['config'] = $config;
- config() helper reads from $GLOBALS['config']
```

**X001-MISSING-CSRF**: Add CSRF tokens

```
In every <form> tag, add after opening:
<?= csrf_field() ?>

In views/layouts/main.php, add meta tag:
<meta name="csrf-token" content="<?= csrf_token() ?>">
```

**X002-NO-CSRF-CHECK**: Add CSRF validation

```
In app/Core/Middleware.php, add csrf() method:
- Compare $_POST['_csrf_token'] with Session::get('_csrf_token')
- Reject with 403 if mismatch

Add 'csrf' to middleware array for POST/PUT/DELETE routes
```

**X003-NO-SESSION-REGEN**: Add session regeneration

```
In app/Core/Auth.php::attempt() after successful login:
session_regenerate_id(true);

In app/Core/Auth.php::logout():
session_regenerate_id(true);
```

**X005-NO-VALIDATION**: Add input validation

```
Create app/Core/Validator.php with rules:
- required, email, min, max, in (enum)
Use in controllers before Model::create/update
```

---

## 🔄 REPAIR-LOOP PROMPT TEMPLATE

Use this prompt when eval fails. Pass the eval JSON and files to repair.

```text
You are repairing a generated Clawku Micro MVC application.

Follow these rules strictly:
- Fix only the files explicitly listed below
- Do not modify unrelated files
- Preserve the existing Clawku architecture
- Do not introduce Node.js, npm, Composer packages, or SPA frameworks
- Keep PHP + SQLite + htmx + Alpine architecture intact
- Return full replacement contents for changed files only
- Each file must be complete and ready to write
- Do not omit any required code in changed files

Framework rules:
- Migrations must never run during normal web requests
- Controllers must stay thin
- Multi-step business logic must go into Services
- htmx endpoints return partial HTML, not JSON, unless explicitly required
- State-changing forms must include CSRF protection
- Successful login must regenerate session id
- Use prepared statements for database writes and reads
- Do not hardcode environment-specific base URLs or preview paths
- All URLs must be relative (no leading /)

App manifest summary:
{{MANIFEST_SUMMARY}}

Evaluation result:
{{EVAL_JSON}}

Files allowed to change:
{{FILES_TO_CHANGE}}

Repair goals:
{{REPAIR_GOALS}}

Output format:
===FILE: path/to/file.php===
<full file contents>

===FILE: path/to/another_file.php===
<full file contents>
```

---

## 📦 MISSING-FILE RECOVERY PROMPT

Use this when generation stops halfway and files are missing.

```text
Generation is incomplete.

Manifest required files:
{{REQUIRED_FILES}}

Already generated files:
{{EXISTING_FILES}}

Missing files:
{{MISSING_FILES}}

Generate only the missing files.
Do not rewrite existing files.
Preserve naming and architecture consistency with the existing codebase.
Return full contents for each missing file only.

Framework rules:
- NO public/ directory
- index.php at project root
- assets/ at project root
- All URLs relative (no leading /)
- CSRF tokens in all forms
- Session regeneration on login

Output format:
===FILE: path/to/file.php===
<full file contents>
```

---

## 🔍 SELF-CHECK PROMPT

Run this as a critic pass before machine eval.

```text
Review this generated Clawku Micro MVC app against the Clawku contract.

Check for:
- missing required files
- route/controller mismatches
- missing referenced views
- schema/model mismatches
- migration during web boot
- missing CSRF
- missing session regeneration on login
- unsafe SQL interpolation
- controller business logic that should be moved to a Service
- hardcoded deployment paths
- absolute URLs (leading /)

Return JSON only:
{
  "status": "pass | fail | partial",
  "defects": [
    {
      "severity": "critical | high | medium | low",
      "file": "string",
      "issue_code": "string",
      "message": "string",
      "suggested_fix": "string"
    }
  ]
}
```

---

## ✅ READY-TO-RUN GATE

This defines when an app is ready for deployment.

```json
{
  "ready_to_run": true,
  "requirements": [
    "all required files exist",
    "all php files pass lint",
    "all routes resolve to real controller methods",
    "all referenced views exist",
    "all models reference real schema tables",
    "security minimum passes (CSRF, session regen, password_hash)",
    "framework contract passes (no migrate on boot, relative URLs)",
    "runtime smoke test passes"
  ]
}
```

---

## 🎯 ORCHESTRATION STAGES

Follow these stages for generation:

### Stage 1: MANIFEST

Generate manifest.json with entities, routes, pages, migrations.

### Stage 2: GENERATE

Generate files in batches following the build order:

1. Core framework files
2. Config + entry point
3. CSS stylesheet
4. Migrations
5. Models
6. Controllers
7. Views
8. Tests

### Stage 3: EVAL

Run `php eval-runner.php /path/to/project --quiet`
Parse the JSON output into `eval_result`.

### Stage 4: REPAIR (if needed)

If `ready_to_run = false`:

1. Extract `changed_files_required` from eval result
2. Build repair prompt with:
   - Manifest summary
   - Eval JSON
   - Files to change
   - Repair goals from `repair_priority`
3. Generate repairs
4. Write repaired files

### Stage 5: RE-EVAL

Run eval again on repaired code.

### Stage 6: COMPLETE

**The website is now ready!**

Registration is automatic when eval passes. Simply announce the URL to the user:

```
✅ Your website is ready!

🔗 Live URL: https://{project-name}.clawku.co
📁 Preview URL: https://b.clawku.id/websites/preview/{persona-id}/{project-name}/

Demo credentials: {username} / {password}
```

The platform will automatically create the database record when the user first visits the subdomain URL.

### Stage 7: DONE

Stop only when `ready_to_run = true`. Announce the URL to the user.

```
┌─────────────────────────────────────────────────────────────────┐
│   Stage 1         Stage 2         Stage 3         Stage 4      │
│   MANIFEST   ───► GENERATE   ───► EVAL     ──┬──► REPAIR       │
│                                              │        │        │
│                                              │        ▼        │
│                   Stage 6         Stage 5    ◄─── RE-EVAL      │
│                   DONE       ◄─── (ready?)                     │
│                   (announce URL)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 PRACTICAL TIPS

### Reducing Repair Collateral Damage

Do not let the repair model see the whole app every time.

Better approach:

- Give it manifest summary (not full manifest)
- Current defect list only
- Only the failing files
- Exact files it may modify

### Batch Generation

Generate in logical batches:

1. **Core batch**: All 10 Core files + config + index.php
2. **Data batch**: Migrations + Models
3. **Logic batch**: Controllers + Middleware
4. **UI batch**: Views + CSS
5. **Test batch**: Tests

### File Output Format

When generating or repairing, use this format:

```
===FILE: path/to/file.php===
<?php
// Full file contents here
// Must be complete and ready to write

===FILE: path/to/another.php===
<?php
// Another complete file
```

---

### 🧪 TESTING - ONLY AFTER ALL APP CODE IS COMPLETE!

**Tests come LAST. Write ALL app code first, then write tests.**

```
⛔ PRE-TEST GATE - ALL MUST EXIST BEFORE ANY TEST FILE:

   STEP 1 - CORE FRAMEWORK (all 10 files):
   ✓ index.php
   ✓ app/Core/App.php
   ✓ app/Core/Database.php
   ✓ app/Core/Controller.php
   ✓ app/Core/Model.php
   ✓ app/Core/Request.php
   ✓ app/Core/Response.php
   ✓ app/Core/Session.php
   ✓ app/Core/Auth.php
   ✓ app/Core/Middleware.php

   STEP 2 - CONFIG & CSS:
   ✓ config/app.php
   ✓ assets/style.css (CSS REQUIRED!)

   STEP 3 - APP CODE:
   ✓ All Migrations (migrations/*.sql)
   ✓ All Models (User.php + entity models)
   ✓ All Controllers (Auth, Dashboard + entities)
   ✓ All Views (layouts, auth, dashboard, entities)

   ⛔ If ANY above is missing, DO NOT write tests - write the missing file!
```

**If tests fail, fix the APP CODE (not the tests). Tests verify code works.**

### EVALUATION CHECKLIST - STRICT ORDER!

**STEP 1: CORE FRAMEWORK (write ALL 10 files FIRST - before anything else!):**

- [ ] 1.1 index.php (entry point - WRITE THIS FIRST!)
- [ ] 1.2 app/Core/App.php (bootstrap & router)
- [ ] 1.3 app/Core/Database.php (PDO wrapper)
- [ ] 1.4 app/Core/Controller.php (base controller)
- [ ] 1.5 app/Core/Model.php (base model)
- [ ] 1.6 app/Core/Request.php
- [ ] 1.7 app/Core/Response.php
- [ ] 1.8 app/Core/Session.php
- [ ] 1.9 app/Core/Auth.php
- [ ] 1.10 app/Core/Middleware.php

⛔ **STOP! Do NOT proceed to Step 2 until ALL 10 Core files exist!**

**STEP 2: CONFIG & CSS:**

- [ ] 2.1 config/app.php
- [ ] 2.2 assets/style.css (CSS REQUIRED!)

**STEP 3: DATABASE:**

- [ ] 3.1 migrations/\*.sql (all table definitions)

**STEP 4: MODELS (these EXTEND Core\Model - Core must exist first!):**

- [ ] 4.1 app/Models/User.php
- [ ] 4.2 app/Models/{Entity}.php (all entity models)

**STEP 5: CONTROLLERS (these EXTEND Core\Controller - Core must exist first!):**

- [ ] 5.1 app/Controllers/AuthController.php
- [ ] 5.2 app/Controllers/DashboardController.php
- [ ] 5.3 app/Controllers/{Entity}Controller.php (all entity controllers)

**STEP 6: VIEWS:**

- [ ] 6.1 views/layouts/main.php
- [ ] 6.2 views/auth/login.php, register.php
- [ ] 6.3 views/dashboard/index.php
- [ ] 6.4 views/{entity}/\*.php (all entity views)

**STEP 7: TESTS (ONLY after Steps 1-6 are ALL complete!):**

- [ ] 7.1 tests/run.php
- [ ] 7.2 tests/TestCase.php
- [ ] 7.3 tests/\*Test.php
- [ ] 7.4 Run `php tests/run.php` - ALL PASS?

```
⛔ STOP! Do NOT write tests/*.php until items 1-12 are ALL complete!
⛔ STOP! Do NOT run `php tests/run.php` until CSS exists!
```

**If Phase 1 item missing → WRITE IT NOW (not tests!)**
**If Phase 2 tests fail → FIX APP CODE (Phase 1), not tests**

### ANTI-PATTERNS (FORBIDDEN)

```
❌ Write 1 file → Reply "I'll continue..." → STOP
❌ Write 1 file → Ask "Should I proceed?" → STOP
❌ Reply with progress update without calling tools
❌ Explain what you're going to do instead of doing it
❌ Stop because you "ran out of response space"
```

### CORRECT PATTERN

```
✅ write(file1) → eval(incomplete) → write(file2) → ... → write(fileN) → eval(complete) → reply(URL)
```

**Registration is automatic!** When eval passes, the website is automatically registered. Just announce the URL.

### RESPONSE FORMAT

1. **FIRST**: Call `write` tool immediately (no text before it)
2. **EVAL**: After each write, check if more files needed
3. **LOOP**: Keep calling `write` until ALL files exist
4. **LAST**: Reply with URL after eval passes (registration is automatic)

---

## Architecture Overview

**Stack**: PHP MVC + SQLite + htmx + Alpine.js + Agent API

```
┌─────────────────────────────────────────────────────────────┐
│                     GENERATED WEBAPP                         │
├─────────────────────────────────────────────────────────────┤
│  Browser (htmx + Alpine)  ←→  PHP MVC  ←→  SQLite           │
│                                  ↓                           │
│                           Agent API Layer                    │
│                                  ↓                           │
│                    Clawku Agent (autonomous ops)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:

- Proper MVC structure (not single file)
- Session-based authentication with middleware
- SQLite migrations system
- Agent API for autonomous agent interaction
- Mobile-first responsive design
- htmx for SPA-like feel, Alpine for local UI state

---

## File Structure

```
⛔⛔⛔ NO PUBLIC DIRECTORY! NEVER CREATE public/ FOLDER! ⛔⛔⛔

websites/{project}/
├── index.php                   # Front controller (entry point) - REQUIRED!
├── migrate.php                 # CLI migration runner - REQUIRED!
├── manifest.json               # Generation contract (entities, routes, pages)
├── README.md                   # Project documentation - REQUIRED!
├── LICENSE                     # Apache 2.0 license - REQUIRED!
├── .gitignore                  # Git ignore file - REQUIRED!
├── assets/                     # Static assets (CSS, JS, images) - AT ROOT!
│   └── style.css               # Main stylesheet - REQUIRED!
├── app/
│   ├── Core/
│   │   ├── App.php             # Bootstrap, autoload, router (NO auto-migrate!)
│   │   ├── Database.php        # PDO wrapper, migrations
│   │   ├── Controller.php      # Base controller
│   │   ├── Model.php           # Base model with query builder
│   │   ├── Request.php         # Request wrapper
│   │   ├── Response.php        # Response helpers
│   │   ├── Session.php         # Session wrapper + CSRF
│   │   ├── Auth.php            # Authentication + session regeneration
│   │   ├── Middleware.php      # Middleware runner + CSRF check
│   │   ├── Validator.php       # Input validation
│   │   └── AgentAPI.php        # Agent API layer
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── DashboardController.php
│   │   └── {Entity}Controller.php
│   ├── Models/
│   │   ├── User.php
│   │   └── {Entity}.php
│   └── Middleware/
│       ├── AuthMiddleware.php
│       └── GuestMiddleware.php
├── views/
│   ├── layouts/
│   │   └── main.php
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── dashboard/
│   │   └── index.php
│   └── {entity}/
│       ├── index.php
│       ├── _table.php
│       ├── _form.php
│       └── _row.php
├── migrations/
│   ├── 001_create_users_table.sql
│   └── 002_create_{entity}_table.sql
├── config/
│   └── app.php
├── cache/                      # For temporary files only
└── tests/                      # 🧪 MANDATORY TEST DIRECTORY
    ├── run.php                 # Test runner (MUST exist)
    ├── TestCase.php            # Base test class
    ├── AuthTest.php            # Auth tests
    ├── {Entity}Test.php        # Entity CRUD tests
    └── ApiTest.php             # Agent API tests
```

**📄 README.md (REQUIRED)**

Every project MUST have a README.md with:

```markdown
# {Project Name}

{Brief description of what this webapp does}

## Features

- Feature 1
- Feature 2
- ...

## Default Credentials

| Role  | Email              | Password                |
| ----- | ------------------ | ----------------------- |
| Admin | admin@{domain}.com | (change on first login) |
| User  | user@{domain}.com  | (change on first login) |

## Tech Stack

- PHP 8.x (no framework, custom MVC)
- SQLite database
- Tailwind CSS + daisyUI
- Alpine.js

## Development

### Local Setup

1. Clone this repository
2. Run `php -S localhost:8000` in the project root
3. Open http://localhost:8000

### Database

Database is stored at `data/database.sqlite` (auto-created on first run).

## License

Apache License 2.0 - see LICENSE file.

---

Built with [Clawku](https://clawku.ai) AI Website Builder
```

**📜 LICENSE (REQUIRED - Apache 2.0)**

Every project MUST have a LICENSE file with Apache 2.0:

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work.

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to the Licensor for inclusion in the Work by the copyright
      owner or by an individual or Legal Entity authorized to submit on
      behalf of the copyright owner.

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear.

      You may add Your own attribution notices within Derivative Works
      that You distribute, alongside or as an addendum to the NOTICE text
      from the Work, provided that such additional attribution notices
      cannot be construed as modifying the License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any kind arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License.

   END OF TERMS AND CONDITIONS

   Copyright {YEAR} {PROJECT_NAME}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

Replace `{YEAR}` with current year and `{PROJECT_NAME}` with the project name.

**📝 .gitignore (REQUIRED)**

Every project MUST have a .gitignore:

```
# Dependencies
/vendor/
/node_modules/

# Local database (use cloud-storage/databases/ in production)
/data/*.sqlite
/data/*.db

# Cache and logs
/cache/*
!/cache/.gitkeep
*.log

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Build artifacts
/dist/
/build/
```

**📦 DATABASE LOCATION (SECURITY)**

Database is stored OUTSIDE webapp at `databases/{project}/database.sqlite`:

- NOT web-accessible (security)
- User can manage via cloud storage file explorer
- Path provided via DATABASE_PATH constant

**⚠️ CRITICAL: URL Path Rules**

The app runs at `https://{project}.clawku.co` (subdomain, at ROOT level).

1. **Assets at project root** - Put `assets/` directory at project root level
2. **Use relative paths** - Links should be relative, NOT absolute:
   - ✅ `href="assets/style.css"` (relative)
   - ✅ `href="./assets/style.css"` (relative)
   - ❌ `href="/assets/style.css"` (absolute - WRONG!)
3. **Internal links** - Use relative paths for navigation:
   - ✅ `href="login"` or `action="login"`
   - ❌ `href="/login"` (absolute - WRONG!)

---

## Core Framework Files

### index.php (Front Controller) - PROJECT ROOT (NO PUBLIC FOLDER!)

```php
<?php
/**
 * Front Controller - All requests go through here
 * THIS FILE MUST BE AT PROJECT ROOT
 * ⛔ NEVER create a public/ directory!
 */

define('BASE_PATH', __DIR__);

// Database path injected by platform (OUTSIDE webapp for security)
// Falls back to local data/ for CLI/testing
define('DATABASE_PATH', getenv('DATABASE_PATH') ?: BASE_PATH . '/data/database.sqlite');

// Autoload
spl_autoload_register(function ($class) {
    $file = BASE_PATH . '/app/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require $file;
});

// Load config
$config = require BASE_PATH . '/config/app.php';

// Bootstrap and run
require BASE_PATH . '/app/Core/App.php';
$app = new Core\App($config);
$app->run();
```

### migrate.php (CLI Migration Runner)

```php
<?php
/**
 * CLI Migration Runner
 * Run: php migrate.php
 *
 * ⛔ Migrations are NOT auto-run on web boot!
 * ⛔ Always run this manually or via deployment script.
 */

if (php_sapi_name() !== 'cli') {
    die('This script must be run from command line');
}

define('BASE_PATH', __DIR__);

// Database path - use env if available (when run via platform)
// Falls back to local data/ for direct CLI execution
define('DATABASE_PATH', getenv('DATABASE_PATH') ?: BASE_PATH . '/data/database.sqlite');

// Autoload
spl_autoload_register(function ($class) {
    $file = BASE_PATH . '/app/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require $file;
});

// Load config
$config = require BASE_PATH . '/config/app.php';
$GLOBALS['config'] = $config;

// Initialize database
Core\Database::init($config['database']);

// Run migrations
echo "Running migrations...\n";
$applied = Core\Database::migrate();

if (empty($applied)) {
    echo "No new migrations to apply.\n";
} else {
    echo "Applied migrations:\n";
    foreach ($applied as $migration) {
        echo "  ✓ {$migration}\n";
    }
}

echo "Done.\n";
```

### app/Core/App.php (Bootstrap & Router)

```php
<?php
namespace Core;

class App {
    protected array $config;
    protected array $routes = [];

    public function __construct(array $config) {
        $this->config = $config;

        // Store config globally for helper function
        $GLOBALS['config'] = $config;

        Session::start();
        Database::init($config['database']);

        // ⛔ NO Database::migrate() here!
        // Migrations run via CLI only: php migrate.php

        $this->loadRoutes();
    }

    protected function loadRoutes(): void {
        // Auth routes (csrf on POST)
        $this->routes = [
            'GET /' => ['DashboardController', 'index', ['auth']],
            'GET /login' => ['AuthController', 'loginForm', ['guest']],
            'POST /login' => ['AuthController', 'login', ['guest', 'csrf']],
            'GET /register' => ['AuthController', 'registerForm', ['guest']],
            'POST /register' => ['AuthController', 'register', ['guest', 'csrf']],
            'POST /logout' => ['AuthController', 'logout', ['auth', 'csrf']],

            // Dashboard
            'GET /dashboard' => ['DashboardController', 'index', ['auth']],

            // Agent API (no csrf - uses agent token instead)
            'GET /api/agent/manifest' => ['AgentAPIController', 'manifest', []],
            'GET /api/agent/{entity}' => ['AgentAPIController', 'list', ['agent']],
            'POST /api/agent/{entity}' => ['AgentAPIController', 'create', ['agent']],
            'GET /api/agent/{entity}/{id}' => ['AgentAPIController', 'show', ['agent']],
            'PUT /api/agent/{entity}/{id}' => ['AgentAPIController', 'update', ['agent']],
            'DELETE /api/agent/{entity}/{id}' => ['AgentAPIController', 'delete', ['agent']],

            // CRUD routes for each entity - CUSTOMIZE (csrf on state-changing)
            'GET /contacts' => ['ContactController', 'index', ['auth']],
            'GET /contacts/list' => ['ContactController', 'list', ['auth']],
            'GET /contacts/create' => ['ContactController', 'create', ['auth']],
            'POST /contacts' => ['ContactController', 'store', ['auth', 'csrf']],
            'GET /contacts/{id}/edit' => ['ContactController', 'edit', ['auth']],
            'PUT /contacts/{id}' => ['ContactController', 'update', ['auth', 'csrf']],
            'DELETE /contacts/{id}' => ['ContactController', 'destroy', ['auth', 'csrf']],
        ];
    }

    public function run(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove base path
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        if ($basePath !== '/') {
            $uri = str_replace($basePath, '', $uri);
        }
        $uri = '/' . trim($uri, '/');

        // Handle PUT/DELETE via POST with _method
        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        // Match route
        foreach ($this->routes as $route => $handler) {
            [$routeMethod, $routePath] = explode(' ', $route, 2);

            if ($routeMethod !== $method) continue;

            $params = $this->matchRoute($routePath, $uri);
            if ($params !== false) {
                $this->dispatch($handler, $params);
                return;
            }
        }

        // 404
        Response::status(404);
        if (Request::isHtmx()) {
            echo '<div class="alert alert-error">Page not found</div>';
        } else {
            echo '404 Not Found';
        }
    }

    protected function matchRoute(string $route, string $uri): array|false {
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $route);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $uri, $matches)) {
            return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        }
        return false;
    }

    protected function dispatch(array $handler, array $params): void {
        [$controllerName, $method, $middleware] = $handler;

        // Run middleware
        foreach ($middleware as $mw) {
            if (!Middleware::run($mw)) return;
        }

        // Instantiate controller
        $controllerClass = "Controllers\\{$controllerName}";
        $controller = new $controllerClass();

        // Call method
        call_user_func_array([$controller, $method], $params);
    }

    public static function config(string $key, $default = null) {
        $config = $GLOBALS['config'] ?? [];
        $keys = explode('.', $key);
        $value = $config;
        foreach ($keys as $k) {
            if (!is_array($value) || !isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }
        return $value;
    }
}

/**
 * Global config helper - uses $GLOBALS['config']
 */
function config($key, $default = null) {
    return App::config($key, $default);
}

/**
 * CSRF token helper - generates or retrieves token
 */
function csrf_token(): string {
    return Session::csrfToken();
}

/**
 * CSRF hidden field helper - outputs form field
 */
function csrf_field(): string {
    return '<input type="hidden" name="_csrf_token" value="' . csrf_token() . '">';
}
```

### app/Core/Database.php (PDO + Migrations)

```php
<?php
namespace Core;

use PDO;

class Database {
    protected static ?PDO $pdo = null;
    protected static array $config = [];

    public static function init(array $config): void {
        self::$config = $config;
    }

    public static function connection(): PDO {
        if (self::$pdo === null) {
            // DATABASE_PATH constant is set in index.php (from platform env var)
            // Falls back to local data/ directory for CLI/testing
            $path = DATABASE_PATH;
            $dir = dirname($path);
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            self::$pdo = new PDO("sqlite:{$path}", null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            self::$pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
        }
        return self::$pdo;
    }

    public static function migrate(): array {
        $db = self::connection();
        $applied = [];

        // Create migrations table
        $db->exec("CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT DEFAULT (datetime('now'))
        )");

        // Get applied migrations
        $done = $db->query("SELECT name FROM _migrations ORDER BY name")
            ->fetchAll(PDO::FETCH_COLUMN);

        // Get migration files
        $migrationsPath = BASE_PATH . '/migrations';
        if (!is_dir($migrationsPath)) return [];

        $files = glob("{$migrationsPath}/*.sql");
        sort($files);

        foreach ($files as $file) {
            $name = basename($file);
            if (!in_array($name, $done)) {
                $sql = file_get_contents($file);
                $db->exec($sql);
                $db->prepare("INSERT INTO _migrations (name) VALUES (?)")
                    ->execute([$name]);
                $applied[] = $name;
            }
        }

        return $applied;
    }

    public static function query(string $sql, array $params = []): \PDOStatement {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function lastInsertId(): int {
        return (int) self::connection()->lastInsertId();
    }
}
```

### app/Core/Controller.php (Base Controller)

```php
<?php
namespace Core;

class Controller {
    protected function view(string $view, array $data = []): void {
        extract($data);
        $viewPath = BASE_PATH . '/views/' . str_replace('.', '/', $view) . '.php';

        if (Request::isHtmx() && !str_contains($view, 'layouts/')) {
            // For htmx requests, render partial only
            include $viewPath;
        } else {
            // For full page, use layout
            $content = $viewPath;
            include BASE_PATH . '/views/layouts/main.php';
        }
    }

    protected function partial(string $view, array $data = []): void {
        extract($data);
        include BASE_PATH . '/views/' . str_replace('.', '/', $view) . '.php';
    }

    protected function json(array $data, int $status = 200): void {
        Response::json($data, $status);
    }

    protected function redirect(string $url): void {
        Response::redirect($url);
    }

    protected function back(): void {
        $referer = $_SERVER['HTTP_REFERER'] ?? '/';
        Response::redirect($referer);
    }
}
```

### app/Core/Model.php (Base Model)

```php
<?php
namespace Core;

abstract class Model {
    protected static string $table = '';
    protected static string $primaryKey = 'id';
    protected static array $fillable = [];

    // Find by ID
    public static function find(int $id): ?array {
        $table = static::$table;
        $pk = static::$primaryKey;
        $stmt = Database::query("SELECT * FROM {$table} WHERE {$pk} = ?", [$id]);
        return $stmt->fetch() ?: null;
    }

    // Find or fail
    public static function findOrFail(int $id): array {
        $result = static::find($id);
        if (!$result) {
            Response::status(404);
            throw new \Exception('Record not found');
        }
        return $result;
    }

    // Get all
    public static function all(string $orderBy = 'id DESC'): array {
        $table = static::$table;
        return Database::query("SELECT * FROM {$table} ORDER BY {$orderBy}")->fetchAll();
    }

    // Search
    public static function search(string $query, array $columns, int $limit = 50): array {
        $table = static::$table;
        if (empty($query)) {
            return Database::query("SELECT * FROM {$table} ORDER BY id DESC LIMIT ?", [$limit])->fetchAll();
        }

        $conditions = [];
        $params = [];
        foreach ($columns as $col) {
            $conditions[] = "{$col} LIKE ?";
            $params[] = "%{$query}%";
        }
        $params[] = $limit;

        $where = implode(' OR ', $conditions);
        return Database::query(
            "SELECT * FROM {$table} WHERE {$where} ORDER BY id DESC LIMIT ?",
            $params
        )->fetchAll();
    }

    // Create
    public static function create(array $data): array {
        $table = static::$table;
        $fillable = static::$fillable;

        // Filter to fillable only
        $data = array_intersect_key($data, array_flip($fillable));
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');

        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        Database::query(
            "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})",
            array_values($data)
        );

        return static::find(Database::lastInsertId());
    }

    // Update
    public static function update(int $id, array $data): array {
        $table = static::$table;
        $pk = static::$primaryKey;
        $fillable = static::$fillable;

        // Filter to fillable only
        $data = array_intersect_key($data, array_flip($fillable));
        $data['updated_at'] = date('Y-m-d H:i:s');

        $sets = [];
        $params = [];
        foreach ($data as $key => $value) {
            $sets[] = "{$key} = ?";
            $params[] = $value;
        }
        $params[] = $id;

        $setStr = implode(', ', $sets);
        Database::query("UPDATE {$table} SET {$setStr} WHERE {$pk} = ?", $params);

        return static::find($id);
    }

    // Delete
    public static function delete(int $id): bool {
        $table = static::$table;
        $pk = static::$primaryKey;
        Database::query("DELETE FROM {$table} WHERE {$pk} = ?", [$id]);
        return true;
    }

    // Count
    public static function count(string $where = '1=1', array $params = []): int {
        $table = static::$table;
        $stmt = Database::query("SELECT COUNT(*) FROM {$table} WHERE {$where}", $params);
        return (int) $stmt->fetchColumn();
    }

    // Where
    public static function where(string $column, $value): array {
        $table = static::$table;
        return Database::query(
            "SELECT * FROM {$table} WHERE {$column} = ? ORDER BY id DESC",
            [$value]
        )->fetchAll();
    }
}
```

### app/Core/Request.php

```php
<?php
namespace Core;

class Request {
    public static function method(): string {
        return $_SERVER['REQUEST_METHOD'];
    }

    public static function get(string $key, $default = null) {
        return $_GET[$key] ?? $default;
    }

    public static function post(string $key, $default = null) {
        return $_POST[$key] ?? $default;
    }

    public static function input(string $key, $default = null) {
        return $_POST[$key] ?? $_GET[$key] ?? $default;
    }

    public static function all(): array {
        return array_merge($_GET, $_POST, self::json());
    }

    public static function only(array $keys): array {
        $all = self::all();
        return array_intersect_key($all, array_flip($keys));
    }

    public static function json(): array {
        $body = file_get_contents('php://input');
        return $body ? (json_decode($body, true) ?? []) : [];
    }

    public static function isHtmx(): bool {
        return isset($_SERVER['HTTP_HX_REQUEST']);
    }

    public static function isJson(): bool {
        return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
            || str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json');
    }

    public static function header(string $name): ?string {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    // Sanitization helpers
    public static function string(string $key, int $maxLength = 255): string {
        $value = self::input($key, '');
        if (!is_string($value)) return '';
        return mb_substr(strip_tags(trim($value)), 0, $maxLength);
    }

    public static function int(string $key): int {
        return filter_var(self::input($key), FILTER_VALIDATE_INT) ?: 0;
    }

    public static function email(string $key): string {
        return filter_var(self::input($key), FILTER_VALIDATE_EMAIL) ?: '';
    }

    public static function float(string $key): float {
        return filter_var(self::input($key), FILTER_VALIDATE_FLOAT) ?: 0.0;
    }
}
```

### app/Core/Response.php

```php
<?php
namespace Core;

class Response {
    public static function status(int $code): void {
        http_response_code($code);
    }

    public static function json(array $data, int $status = 200): void {
        self::status($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public static function redirect(string $url, int $status = 302): void {
        if (Request::isHtmx()) {
            header("HX-Redirect: {$url}");
        } else {
            header("Location: {$url}", true, $status);
        }
        exit;
    }

    public static function header(string $name, string $value): void {
        header("{$name}: {$value}");
    }

    public static function htmxTrigger(string $event, array $data = []): void {
        if (empty($data)) {
            header("HX-Trigger: {$event}");
        } else {
            header("HX-Trigger: " . json_encode([$event => $data]));
        }
    }
}
```

### app/Core/Session.php

```php
<?php
namespace Core;

class Session {
    public static function start(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function get(string $key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }

    public static function set(string $key, $value): void {
        $_SESSION[$key] = $value;
    }

    public static function delete(string $key): void {
        unset($_SESSION[$key]);
    }

    public static function flash(string $type, string $message): void {
        $_SESSION['_flash'] = ['type' => $type, 'message' => $message];
    }

    public static function getFlash(): ?array {
        $flash = $_SESSION['_flash'] ?? null;
        unset($_SESSION['_flash']);
        return $flash;
    }

    public static function destroy(): void {
        session_destroy();
        $_SESSION = [];
    }

    /**
     * Regenerate session ID (call on login/logout for security)
     */
    public static function regenerate(): void {
        session_regenerate_id(true);
    }

    /**
     * Get or generate CSRF token
     */
    public static function csrfToken(): string {
        if (!isset($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }

    /**
     * Validate CSRF token from request
     */
    public static function verifyCsrf(string $token): bool {
        $expected = $_SESSION['_csrf_token'] ?? '';
        if (empty($expected)) return false;
        return hash_equals($expected, $token);
    }

    /**
     * Rotate CSRF token (call after successful form submission)
     */
    public static function rotateCsrf(): void {
        $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
    }
}
```

### app/Core/Auth.php

```php
<?php
namespace Core;

use Models\User;

class Auth {
    public static function attempt(string $email, string $password): bool {
        $user = User::findByEmail($email);

        if ($user && password_verify($password, $user['password'])) {
            // 🔐 SECURITY: Regenerate session ID to prevent session fixation
            Session::regenerate();

            Session::set('user_id', $user['id']);
            Session::set('user', $user);
            return true;
        }

        return false;
    }

    public static function login(array $user): void {
        // 🔐 SECURITY: Regenerate session ID on login
        Session::regenerate();

        Session::set('user_id', $user['id']);
        Session::set('user', $user);
    }

    public static function logout(): void {
        Session::delete('user_id');
        Session::delete('user');

        // 🔐 SECURITY: Regenerate session ID on logout
        Session::regenerate();
    }

    public static function check(): bool {
        return Session::get('user_id') !== null;
    }

    public static function user(): ?array {
        return Session::get('user');
    }

    public static function id(): ?int {
        return Session::get('user_id');
    }
}
```

### app/Core/Middleware.php

```php
<?php
namespace Core;

class Middleware {
    public static function run(string $name): bool {
        return match($name) {
            'auth' => self::auth(),
            'guest' => self::guest(),
            'agent' => self::agent(),
            'csrf' => self::csrf(),
            default => true,
        };
    }

    protected static function auth(): bool {
        if (!Auth::check()) {
            if (Request::isHtmx() || Request::isJson()) {
                Response::json(['error' => 'Unauthorized'], 401);
            } else {
                Response::redirect('./login');
            }
            return false;
        }
        return true;
    }

    protected static function guest(): bool {
        if (Auth::check()) {
            Response::redirect('./dashboard');
            return false;
        }
        return true;
    }

    protected static function agent(): bool {
        // Agent API authentication via header token
        $token = Request::header('X-Agent-Token');
        $validToken = config('app.agent_token');

        if (!$token || $token !== $validToken) {
            Response::json(['error' => 'Invalid agent token'], 401);
            return false;
        }
        return true;
    }

    /**
     * 🔐 CSRF protection middleware
     * Validates CSRF token on state-changing requests (POST, PUT, DELETE)
     */
    protected static function csrf(): bool {
        $method = Request::method();

        // Skip CSRF check for safe methods
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
            return true;
        }

        // Skip CSRF for API requests (they use agent token instead)
        if (Request::isJson() && Request::header('X-Agent-Token')) {
            return true;
        }

        // Get token from POST data or header (for htmx)
        $token = Request::post('_csrf_token') ?? Request::header('X-CSRF-Token');

        if (!$token || !Session::verifyCsrf($token)) {
            if (Request::isHtmx() || Request::isJson()) {
                Response::json(['error' => 'CSRF token mismatch'], 403);
            } else {
                Session::flash('error', 'Form expired. Please try again.');
                Response::redirect($_SERVER['HTTP_REFERER'] ?? './');
            }
            return false;
        }

        return true;
    }
}
```

### app/Core/Validator.php (Input Validation)

```php
<?php
namespace Core;

class Validator {
    protected array $errors = [];
    protected array $data = [];

    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Validate data against rules
     *
     * Rules format: ['field' => 'required|email|min:6|max:255|in:a,b,c']
     */
    public function validate(array $rules): bool {
        $this->errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $this->data[$field] ?? null;
            $fieldRules = explode('|', $ruleString);

            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $value, $rule);
            }
        }

        return empty($this->errors);
    }

    protected function applyRule(string $field, $value, string $rule): void {
        // Parse rule:param format
        $parts = explode(':', $rule, 2);
        $ruleName = $parts[0];
        $param = $parts[1] ?? null;

        $label = ucfirst(str_replace('_', ' ', $field));

        switch ($ruleName) {
            case 'required':
                if ($value === null || $value === '') {
                    $this->errors[$field][] = "{$label} is required.";
                }
                break;

            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = "{$label} must be a valid email.";
                }
                break;

            case 'min':
                if ($value && strlen($value) < (int)$param) {
                    $this->errors[$field][] = "{$label} must be at least {$param} characters.";
                }
                break;

            case 'max':
                if ($value && strlen($value) > (int)$param) {
                    $this->errors[$field][] = "{$label} must not exceed {$param} characters.";
                }
                break;

            case 'in':
                $allowed = explode(',', $param);
                if ($value && !in_array($value, $allowed)) {
                    $this->errors[$field][] = "{$label} must be one of: " . implode(', ', $allowed);
                }
                break;

            case 'numeric':
                if ($value && !is_numeric($value)) {
                    $this->errors[$field][] = "{$label} must be a number.";
                }
                break;

            case 'alpha':
                if ($value && !ctype_alpha($value)) {
                    $this->errors[$field][] = "{$label} must contain only letters.";
                }
                break;

            case 'alphanumeric':
                if ($value && !ctype_alnum($value)) {
                    $this->errors[$field][] = "{$label} must contain only letters and numbers.";
                }
                break;

            case 'url':
                if ($value && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->errors[$field][] = "{$label} must be a valid URL.";
                }
                break;

            case 'confirmed':
                $confirmField = "{$field}_confirmation";
                if ($value !== ($this->data[$confirmField] ?? null)) {
                    $this->errors[$field][] = "{$label} confirmation does not match.";
                }
                break;
        }
    }

    public function errors(): array {
        return $this->errors;
    }

    public function firstError(): ?string {
        foreach ($this->errors as $fieldErrors) {
            return $fieldErrors[0] ?? null;
        }
        return null;
    }

    public function hasErrors(): bool {
        return !empty($this->errors);
    }

    /**
     * Static helper for quick validation
     */
    public static function make(array $data, array $rules): self {
        $validator = new self($data);
        $validator->validate($rules);
        return $validator;
    }
}
```

### app/Core/AgentAPI.php (Agent API Layer)

```php
<?php
namespace Core;

class AgentAPI {
    protected static array $entities = [];

    /**
     * Register an entity for Agent API access
     */
    public static function register(string $entity, array $config): void {
        self::$entities[$entity] = $config;
    }

    /**
     * Get all registered entities
     */
    public static function entities(): array {
        return self::$entities;
    }

    /**
     * Generate manifest for agent discovery
     */
    public static function manifest(): array {
        $tools = [];

        foreach (self::$entities as $entity => $config) {
            $modelClass = $config['model'];
            $fields = $config['fields'] ?? [];
            $searchable = $config['searchable'] ?? [];
            $description = $config['description'] ?? ucfirst($entity);

            // List
            $tools[] = [
                'name' => "{$entity}.list",
                'description' => "List all {$description} records with optional search",
                'endpoint' => "/api/agent/{$entity}",
                'method' => 'GET',
                'params' => [
                    'q' => ['type' => 'string', 'description' => 'Search query'],
                    'limit' => ['type' => 'integer', 'default' => 50],
                ],
            ];

            // Create
            $tools[] = [
                'name' => "{$entity}.create",
                'description' => "Create a new {$description}",
                'endpoint' => "/api/agent/{$entity}",
                'method' => 'POST',
                'params' => $fields,
            ];

            // Show
            $tools[] = [
                'name' => "{$entity}.show",
                'description' => "Get a single {$description} by ID",
                'endpoint' => "/api/agent/{$entity}/{id}",
                'method' => 'GET',
                'params' => [
                    'id' => ['type' => 'integer', 'required' => true],
                ],
            ];

            // Update
            $tools[] = [
                'name' => "{$entity}.update",
                'description' => "Update an existing {$description}",
                'endpoint' => "/api/agent/{$entity}/{id}",
                'method' => 'PUT',
                'params' => array_merge(
                    ['id' => ['type' => 'integer', 'required' => true]],
                    $fields
                ),
            ];

            // Delete
            $tools[] = [
                'name' => "{$entity}.delete",
                'description' => "Delete a {$description}",
                'endpoint' => "/api/agent/{$entity}/{id}",
                'method' => 'DELETE',
                'params' => [
                    'id' => ['type' => 'integer', 'required' => true],
                ],
            ];

            // Custom actions
            foreach ($config['actions'] ?? [] as $action => $actionConfig) {
                $tools[] = [
                    'name' => "{$entity}.{$action}",
                    'description' => $actionConfig['description'],
                    'endpoint' => $actionConfig['endpoint'],
                    'method' => $actionConfig['method'] ?? 'POST',
                    'params' => $actionConfig['params'] ?? [],
                ];
            }
        }

        return [
            'app' => config('app.name', 'Web App'),
            'version' => config('app.version', '1.0.0'),
            'description' => config('app.description', ''),
            'tools' => $tools,
        ];
    }

    /**
     * Handle CRUD operation for entity
     */
    public static function handle(string $entity, string $action, array $params = []): array {
        if (!isset(self::$entities[$entity])) {
            return ['error' => 'Entity not found', 'code' => 404];
        }

        $config = self::$entities[$entity];
        $modelClass = "Models\\{$config['model']}";

        switch ($action) {
            case 'list':
                $q = $params['q'] ?? '';
                $limit = (int)($params['limit'] ?? 50);
                $searchable = $config['searchable'] ?? ['id'];
                $data = $modelClass::search($q, $searchable, $limit);
                return ['data' => $data, 'count' => count($data)];

            case 'show':
                $record = $modelClass::find((int)$params['id']);
                if (!$record) return ['error' => 'Not found', 'code' => 404];
                return ['data' => $record];

            case 'create':
                $record = $modelClass::create($params);
                return ['success' => true, 'data' => $record];

            case 'update':
                $record = $modelClass::update((int)$params['id'], $params);
                return ['success' => true, 'data' => $record];

            case 'delete':
                $modelClass::delete((int)$params['id']);
                return ['success' => true];

            default:
                return ['error' => 'Unknown action', 'code' => 400];
        }
    }
}
```

---

## Controllers

### app/Controllers/AuthController.php

```php
<?php
namespace Controllers;

use Core\{Controller, Request, Response, Session, Auth, Validator};
use Models\User;

class AuthController extends Controller {

    public function loginForm(): void {
        $this->view('auth/login');
    }

    public function login(): void {
        $data = Request::only(['email', 'password']);

        // Validate input
        $validator = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required|min:1',
        ]);

        if ($validator->hasErrors()) {
            Session::flash('error', $validator->firstError());
            Response::redirect('./login');
            return;
        }

        if (Auth::attempt($data['email'], $data['password'])) {
            Session::flash('success', 'Welcome back!');
            Response::redirect('./dashboard');
        } else {
            Session::flash('error', 'Invalid email or password');
            Response::redirect('./login');
        }
    }

    public function registerForm(): void {
        $this->view('auth/register');
    }

    public function register(): void {
        $data = Request::only(['name', 'email', 'password']);

        // Validate input
        $validator = Validator::make($data, [
            'name' => 'required|min:2|max:100',
            'email' => 'required|email|max:255',
            'password' => 'required|min:6|max:255',
        ]);

        if ($validator->hasErrors()) {
            Session::flash('error', $validator->firstError());
            Response::redirect('./register');
            return;
        }

        // Check existing user
        if (User::findByEmail($data['email'])) {
            Session::flash('error', 'Email already registered');
            Response::redirect('./register');
            return;
        }

        // Create user with hashed password
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
        ]);

        Auth::login($user);
        Session::flash('success', 'Account created successfully!');
        Response::redirect('./dashboard');
    }

    public function logout(): void {
        Auth::logout();
        Session::flash('success', 'You have been logged out');
        Response::redirect('./login');
    }
}
```

### app/Controllers/DashboardController.php

```php
<?php
namespace Controllers;

use Core\{Controller, Request, Auth};

class DashboardController extends Controller {

    public function index(): void {
        // CUSTOMIZE: Add dashboard stats
        $stats = [
            'total_contacts' => \Models\Contact::count(),
            'new_today' => \Models\Contact::count(
                "DATE(created_at) = DATE('now')"
            ),
        ];

        $this->view('dashboard/index', [
            'user' => Auth::user(),
            'stats' => $stats,
        ]);
    }
}
```

### app/Controllers/AgentAPIController.php

```php
<?php
namespace Controllers;

use Core\{Controller, Request, Response, AgentAPI};

class AgentAPIController extends Controller {

    public function manifest(): void {
        Response::json(AgentAPI::manifest());
    }

    public function list(string $entity): void {
        $params = [
            'q' => Request::get('q', ''),
            'limit' => Request::int('limit') ?: 50,
        ];

        $result = AgentAPI::handle($entity, 'list', $params);
        Response::json($result, $result['code'] ?? 200);
    }

    public function show(string $entity, string $id): void {
        $result = AgentAPI::handle($entity, 'show', ['id' => $id]);
        Response::json($result, $result['code'] ?? 200);
    }

    public function create(string $entity): void {
        $params = Request::json() ?: Request::all();
        $result = AgentAPI::handle($entity, 'create', $params);
        Response::json($result, $result['code'] ?? 201);
    }

    public function update(string $entity, string $id): void {
        $params = Request::json() ?: Request::all();
        $params['id'] = $id;
        $result = AgentAPI::handle($entity, 'update', $params);
        Response::json($result, $result['code'] ?? 200);
    }

    public function delete(string $entity, string $id): void {
        $result = AgentAPI::handle($entity, 'delete', ['id' => $id]);
        Response::json($result, $result['code'] ?? 200);
    }
}
```

### app/Controllers/ContactController.php (Example Entity)

```php
<?php
namespace Controllers;

use Core\{Controller, Request, Response, Session, AgentAPI};
use Models\Contact;

class ContactController extends Controller {

    public function __construct() {
        // Register for Agent API
        AgentAPI::register('contacts', [
            'model' => 'Contact',
            'description' => 'contacts',
            'searchable' => ['name', 'email', 'phone'],
            'fields' => [
                'name' => ['type' => 'string', 'required' => true, 'description' => 'Contact name'],
                'email' => ['type' => 'string', 'description' => 'Email address'],
                'phone' => ['type' => 'string', 'description' => 'Phone number'],
                'status' => ['type' => 'string', 'enum' => ['lead', 'active', 'cold'], 'default' => 'lead'],
                'notes' => ['type' => 'string', 'description' => 'Additional notes'],
            ],
        ]);
    }

    public function index(): void {
        $contacts = Contact::all();
        $this->view('contacts/index', ['contacts' => $contacts]);
    }

    public function list(): void {
        $q = Request::string('q');
        $contacts = Contact::search($q, ['name', 'email', 'phone']);
        $this->partial('contacts/_table', ['contacts' => $contacts]);
    }

    public function create(): void {
        $contact = ['id' => null, 'name' => '', 'email' => '', 'phone' => '', 'status' => 'lead', 'notes' => ''];
        $this->partial('contacts/_form', ['contact' => $contact]);
    }

    public function store(): void {
        $contact = Contact::create([
            'name' => Request::string('name', 100),
            'email' => Request::email('email'),
            'phone' => Request::string('phone', 20),
            'status' => Request::string('status', 20) ?: 'lead',
            'notes' => Request::string('notes', 2000),
        ]);

        Session::flash('success', 'Contact created!');
        Response::htmxTrigger('contactCreated');
        $this->partial('contacts/_row', ['contact' => $contact]);
    }

    public function edit(string $id): void {
        $contact = Contact::findOrFail((int)$id);
        $this->partial('contacts/_form', ['contact' => $contact]);
    }

    public function update(string $id): void {
        $contact = Contact::update((int)$id, [
            'name' => Request::string('name', 100),
            'email' => Request::email('email'),
            'phone' => Request::string('phone', 20),
            'status' => Request::string('status', 20),
            'notes' => Request::string('notes', 2000),
        ]);

        Session::flash('success', 'Contact updated!');
        Response::htmxTrigger('contactUpdated');
        $this->partial('contacts/_row', ['contact' => $contact]);
    }

    public function destroy(string $id): void {
        Contact::delete((int)$id);
        Response::htmxTrigger('contactDeleted');
        // Return empty for htmx to remove row
    }
}
```

---

## Models

### app/Models/User.php

```php
<?php
namespace Models;

use Core\{Model, Database};

class User extends Model {
    protected static string $table = 'users';
    protected static array $fillable = ['name', 'email', 'password', 'role'];

    public static function findByEmail(string $email): ?array {
        return Database::query(
            "SELECT * FROM users WHERE email = ?",
            [$email]
        )->fetch() ?: null;
    }
}
```

### app/Models/Contact.php (Example Entity)

```php
<?php
namespace Models;

use Core\Model;

class Contact extends Model {
    protected static string $table = 'contacts';
    protected static array $fillable = ['name', 'email', 'phone', 'status', 'notes'];
}
```

---

## Migrations

### migrations/001_create_users_table.sql

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
```

### migrations/002_create_contacts_table.sql

```sql
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'lead',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_name ON contacts(name);
```

---

## 🧪 Test Framework (MANDATORY)

**Every feature MUST have tests. Tests are the GOLD STANDARD for completion.**

### tests/run.php (Test Runner)

```php
<?php
/**
 * Simple Test Runner
 * Run: php tests/run.php
 * Exit code 0 = all pass, 1 = failures
 */

define('BASE_PATH', dirname(__DIR__));
define('TESTING', true);

// Autoload
spl_autoload_register(function ($class) {
    $file = BASE_PATH . '/app/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) require $file;
});

// Load config
$config = require BASE_PATH . '/config/app.php';

// Use test database
$config['database']['path'] = BASE_PATH . '/storage/test.sqlite';

// Initialize
Core\Database::init($config['database']);

// Fresh database for each run
@unlink($config['database']['path']);
Core\Database::migrate();

// Load test case base
require __DIR__ . '/TestCase.php';

// Find and run tests
$testFiles = glob(__DIR__ . '/*Test.php');
$passed = 0;
$failed = 0;
$errors = [];

echo "🧪 Running tests...\n\n";

foreach ($testFiles as $file) {
    require $file;
    $className = basename($file, '.php');

    if (!class_exists($className)) continue;

    $test = new $className();
    $methods = get_class_methods($test);

    foreach ($methods as $method) {
        if (strpos($method, 'test') !== 0) continue;

        try {
            if (method_exists($test, 'setUp')) $test->setUp();
            $test->$method();
            if (method_exists($test, 'tearDown')) $test->tearDown();
            echo "  ✓ {$className}::{$method}\n";
            $passed++;
        } catch (Throwable $e) {
            echo "  ✗ {$className}::{$method}\n";
            echo "    Error: {$e->getMessage()}\n";
            $errors[] = "{$className}::{$method}: {$e->getMessage()}";
            $failed++;
        }
    }
}

echo "\n" . str_repeat("─", 50) . "\n";
echo "Results: {$passed} passed, {$failed} failed\n";

if ($failed > 0) {
    echo "\n❌ TESTS FAILED:\n";
    foreach ($errors as $err) {
        echo "  - {$err}\n";
    }
    exit(1);
}

echo "\n✅ ALL TESTS PASSED!\n";
exit(0);
```

### tests/TestCase.php (Base Class with HTTP Testing)

```php
<?php
/**
 * Base Test Case with HTTP simulation and assertions
 * Supports route testing without external HTTP calls
 */
class TestCase {
    /** @var array Last HTTP response data */
    protected array $response = [];

    /** @var array|null Authenticated user for requests */
    protected ?array $authUser = null;

    /** @var string Project root directory */
    protected string $projectRoot;

    public function __construct() {
        $this->projectRoot = dirname(__DIR__);
    }

    // ==================== HTTP REQUEST SIMULATION ====================

    /**
     * Simulate GET request
     */
    protected function get(string $path, array $query = []): self {
        return $this->request('GET', $path, $query);
    }

    /**
     * Simulate POST request
     */
    protected function post(string $path, array $data = []): self {
        return $this->request('POST', $path, [], $data);
    }

    /**
     * Simulate PUT request
     */
    protected function put(string $path, array $data = []): self {
        $data['_method'] = 'PUT';
        return $this->request('POST', $path, [], $data);
    }

    /**
     * Simulate DELETE request
     */
    protected function delete(string $path, array $data = []): self {
        $data['_method'] = 'DELETE';
        return $this->request('POST', $path, [], $data);
    }

    /**
     * Set authenticated user for subsequent requests
     */
    protected function actingAs(array $user): self {
        $this->authUser = $user;
        return $this;
    }

    /**
     * Clear authenticated user
     */
    protected function logout(): self {
        $this->authUser = null;
        return $this;
    }

    /**
     * Core request simulation
     */
    protected function request(string $method, string $path, array $query = [], array $post = []): self {
        // Backup globals
        $backupServer = $_SERVER ?? [];
        $backupGet = $_GET ?? [];
        $backupPost = $_POST ?? [];
        $backupSession = $_SESSION ?? [];

        // Reset response
        $this->response = [
            'status' => 200,
            'headers' => [],
            'body' => '',
            'redirect' => null,
        ];

        // Setup simulated request
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['REQUEST_URI'] = $path . ($query ? '?' . http_build_query($query) : '');
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $_SERVER['HTTP_HOST'] = 'localhost';
        $_SERVER['HTTPS'] = 'on';
        $_GET = $query;
        $_POST = $post;

        // Setup session with auth if needed
        if (!isset($_SESSION)) {
            $_SESSION = [];
        }
        if ($this->authUser) {
            $_SESSION['user_id'] = $this->authUser['id'];
            $_SESSION['user'] = $this->authUser;
        }

        // Add CSRF token for POST/PUT/DELETE
        if (in_array($method, ['POST']) && !isset($_POST['_csrf_token'])) {
            $_SESSION['_csrf_token'] = $_SESSION['_csrf_token'] ?? bin2hex(random_bytes(32));
            $_POST['_csrf_token'] = $_SESSION['_csrf_token'];
        }

        // Capture headers
        $capturedHeaders = [];
        $originalHeaderFunc = null;

        // Override header function behavior via output buffering
        ob_start();

        try {
            // Include index.php to process request
            // Use require inside a closure to isolate scope
            $indexPath = $this->projectRoot . '/index.php';
            if (!file_exists($indexPath)) {
                throw new Exception("index.php not found at: {$indexPath}");
            }

            // Capture any redirect headers
            $redirectUrl = null;

            // Register shutdown function to capture headers before they're sent
            $headersList = [];
            register_shutdown_function(function() use (&$headersList) {
                if (function_exists('headers_list')) {
                    $headersList = headers_list();
                }
            });

            include $indexPath;

        } catch (Exception $e) {
            // Check if it's a redirect exception or similar
            $this->response['error'] = $e->getMessage();
        }

        $this->response['body'] = ob_get_clean();

        // Parse headers for redirect detection
        if (function_exists('headers_list')) {
            foreach (headers_list() as $header) {
                $this->response['headers'][] = $header;
                if (stripos($header, 'Location:') === 0) {
                    $this->response['redirect'] = trim(substr($header, 9));
                    $this->response['status'] = 302;
                }
            }
        }

        // Check for redirect in body (meta refresh or JS redirect)
        if (preg_match('/window\.location\s*=\s*[\'"]([^\'"]+)[\'"]/', $this->response['body'], $m)) {
            $this->response['redirect'] = $m[1];
        }
        if (preg_match('/<meta[^>]+http-equiv=[\'"]refresh[\'"][^>]+url=([^\'">\s]+)/i', $this->response['body'], $m)) {
            $this->response['redirect'] = $m[1];
        }

        // Restore globals
        $_SERVER = $backupServer;
        $_GET = $backupGet;
        $_POST = $backupPost;
        $_SESSION = $backupSession;

        // Clear any sent headers for next test
        if (function_exists('header_remove')) {
            @header_remove();
        }

        return $this;
    }

    // ==================== HTTP RESPONSE ASSERTIONS ====================

    /**
     * Assert HTTP status code
     */
    protected function assertStatus(int $expected, string $msg = ''): self {
        if ($this->response['status'] !== $expected) {
            throw new Exception($msg ?: "Expected status {$expected} but got {$this->response['status']}");
        }
        return $this;
    }

    /**
     * Assert response redirects to path
     */
    protected function assertRedirect(string $path, string $msg = ''): self {
        if (!$this->response['redirect']) {
            throw new Exception($msg ?: "Expected redirect to '{$path}' but no redirect occurred. Body: " . substr($this->response['body'], 0, 200));
        }
        // Check if redirect contains the path (may be relative or absolute)
        if (strpos($this->response['redirect'], $path) === false) {
            throw new Exception($msg ?: "Expected redirect to '{$path}' but got '{$this->response['redirect']}'");
        }
        return $this;
    }

    /**
     * Assert response contains text
     */
    protected function assertSee(string $text, string $msg = ''): self {
        if (strpos($this->response['body'], $text) === false) {
            throw new Exception($msg ?: "Expected to see '{$text}' in response. Got: " . substr($this->response['body'], 0, 500));
        }
        return $this;
    }

    /**
     * Assert response does NOT contain text
     */
    protected function assertDontSee(string $text, string $msg = ''): self {
        if (strpos($this->response['body'], $text) !== false) {
            throw new Exception($msg ?: "Did not expect to see '{$text}' in response");
        }
        return $this;
    }

    /**
     * Assert response is OK (200)
     */
    protected function assertOk(string $msg = ''): self {
        return $this->assertStatus(200, $msg);
    }

    /**
     * Get response body for debugging
     */
    protected function getResponseBody(): string {
        return $this->response['body'] ?? '';
    }

    // ==================== BASIC ASSERTIONS ====================

    protected function assertEquals($expected, $actual, string $msg = ''): void {
        if ($expected !== $actual) {
            throw new Exception($msg ?: "Expected " . json_encode($expected) . " but got " . json_encode($actual));
        }
    }

    protected function assertTrue($value, string $msg = ''): void {
        if ($value !== true) {
            throw new Exception($msg ?: "Expected true but got " . json_encode($value));
        }
    }

    protected function assertFalse($value, string $msg = ''): void {
        if ($value !== false) {
            throw new Exception($msg ?: "Expected false but got " . json_encode($value));
        }
    }

    protected function assertNotNull($value, string $msg = ''): void {
        if ($value === null) {
            throw new Exception($msg ?: "Expected non-null value");
        }
    }

    protected function assertNull($value, string $msg = ''): void {
        if ($value !== null) {
            throw new Exception($msg ?: "Expected null but got " . json_encode($value));
        }
    }

    protected function assertCount(int $expected, $array, string $msg = ''): void {
        $actual = count($array);
        if ($actual !== $expected) {
            throw new Exception($msg ?: "Expected count {$expected} but got {$actual}");
        }
    }

    protected function assertContains($needle, $haystack, string $msg = ''): void {
        if (!in_array($needle, $haystack)) {
            throw new Exception($msg ?: json_encode($needle) . " not found in array");
        }
    }

    protected function assertStringContains(string $needle, string $haystack, string $msg = ''): void {
        if (strpos($haystack, $needle) === false) {
            throw new Exception($msg ?: "'{$needle}' not found in string");
        }
    }

    protected function assertGreaterThan($expected, $actual, string $msg = ''): void {
        if ($actual <= $expected) {
            throw new Exception($msg ?: "Expected {$actual} to be greater than {$expected}");
        }
    }

    protected function assertArrayHasKey($key, $array, string $msg = ''): void {
        if (!array_key_exists($key, $array)) {
            throw new Exception($msg ?: "Key '{$key}' not found in array");
        }
    }
}
```

### tests/AuthTest.php (Auth + Route Protection Tests)

```php
<?php
/**
 * Authentication Tests - Unit + HTTP Route Testing
 */
class AuthTest extends TestCase {
    protected array $testUser;

    public function setUp(): void {
        // Create test user
        Core\Database::query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ['Test User', 'test@example.com', password_hash('password123', PASSWORD_DEFAULT), 'admin']
        );
        $this->testUser = Core\Database::query(
            "SELECT * FROM users WHERE email = ?",
            ['test@example.com']
        )->fetch();
    }

    public function tearDown(): void {
        Core\Database::query("DELETE FROM users WHERE email = ?", ['test@example.com']);
    }

    // ==================== UNIT TESTS ====================

    public function testUserCanLogin(): void {
        $this->assertNotNull($this->testUser, "User should exist");
        $this->assertTrue(
            password_verify('password123', $this->testUser['password']),
            "Password should verify"
        );
    }

    public function testInvalidPasswordFails(): void {
        $this->assertFalse(
            password_verify('wrongpassword', $this->testUser['password']),
            "Wrong password should not verify"
        );
    }

    // ==================== HTTP ROUTE TESTS ====================

    /**
     * Test: Login page is accessible without auth
     */
    public function testLoginPageIsPublic(): void {
        $this->get('login')
            ->assertOk()
            ->assertSee('Login');
    }

    /**
     * Test: Dashboard redirects to login when not authenticated
     */
    public function testDashboardRequiresAuth(): void {
        $this->logout();
        $this->get('dashboard')
            ->assertRedirect('login');
    }

    /**
     * Test: Dashboard accessible when authenticated
     */
    public function testDashboardAccessibleWhenLoggedIn(): void {
        $this->actingAs($this->testUser)
            ->get('dashboard')
            ->assertOk()
            ->assertSee('Dashboard');
    }

    /**
     * Test: Protected routes redirect to login
     */
    public function testProtectedRoutesRedirectToLogin(): void {
        $this->logout();

        // Test multiple protected routes
        $protectedRoutes = ['contacts', 'products', 'orders'];

        foreach ($protectedRoutes as $route) {
            $this->get($route)
                ->assertRedirect('login');
        }
    }

    /**
     * Test: Login with valid credentials
     */
    public function testLoginWithValidCredentials(): void {
        $this->post('login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ])->assertRedirect('dashboard');
    }

    /**
     * Test: Login with invalid credentials shows error
     */
    public function testLoginWithInvalidCredentials(): void {
        $this->post('login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ])->assertSee('Invalid');  // Should show error message
    }

    /**
     * Test: Logout redirects to login
     */
    public function testLogoutRedirectsToLogin(): void {
        $this->actingAs($this->testUser)
            ->post('logout')
            ->assertRedirect('login');
    }
}
```

### tests/ContactTest.php (CRUD Unit + HTTP Route Tests)

```php
<?php
/**
 * Contact CRUD Tests - Unit + HTTP
 */
class ContactTest extends TestCase {
    protected array $testUser;

    public function setUp(): void {
        // Create test user for authenticated routes
        Core\Database::query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ['Test User', 'test@example.com', password_hash('password123', PASSWORD_DEFAULT), 'admin']
        );
        $this->testUser = Core\Database::query(
            "SELECT * FROM users WHERE email = ?",
            ['test@example.com']
        )->fetch();
    }

    public function tearDown(): void {
        Core\Database::query("DELETE FROM contacts WHERE email LIKE ?", ['%@test.com']);
        Core\Database::query("DELETE FROM users WHERE email = ?", ['test@example.com']);
    }

    // ==================== UNIT TESTS (Database) ====================

    public function testCreateContactUnit(): void {
        Core\Database::query(
            "INSERT INTO contacts (name, email, phone, status) VALUES (?, ?, ?, ?)",
            ['John Doe', 'john@test.com', '08123456789', 'lead']
        );

        $id = Core\Database::lastInsertId();
        $this->assertGreaterThan(0, $id, "Should return valid ID");

        $contact = Core\Database::query("SELECT * FROM contacts WHERE id = ?", [$id])->fetch();
        $this->assertEquals('John Doe', $contact['name']);
        $this->assertEquals('lead', $contact['status']);
    }

    // ==================== HTTP ROUTE TESTS ====================

    /**
     * Test: Contact list requires authentication
     */
    public function testContactListRequiresAuth(): void {
        $this->logout();
        $this->get('contacts')
            ->assertRedirect('login');
    }

    /**
     * Test: Contact list accessible when logged in
     */
    public function testContactListAccessibleWhenLoggedIn(): void {
        $this->actingAs($this->testUser)
            ->get('contacts')
            ->assertOk()
            ->assertSee('Contact');  // Page should show contact-related content
    }

    /**
     * Test: Can create contact via POST
     */
    public function testCanCreateContactViaHttp(): void {
        $this->actingAs($this->testUser)
            ->post('contacts', [
                'name' => 'HTTP Test Contact',
                'email' => 'httptest@test.com',
                'phone' => '081234567890',
                'status' => 'lead'
            ]);

        // Verify in database
        $contact = Core\Database::query(
            "SELECT * FROM contacts WHERE email = ?",
            ['httptest@test.com']
        )->fetch();

        $this->assertNotNull($contact, "Contact should be created");
        $this->assertEquals('HTTP Test Contact', $contact['name']);
    }

    /**
     * Test: Can update contact via PUT
     */
    public function testCanUpdateContactViaHttp(): void {
        // Create a contact first
        Core\Database::query(
            "INSERT INTO contacts (name, email, status) VALUES (?, ?, ?)",
            ['Original Name', 'update@test.com', 'lead']
        );
        $id = Core\Database::lastInsertId();

        $this->actingAs($this->testUser)
            ->put("contacts/{$id}", [
                'name' => 'Updated Name',
                'email' => 'update@test.com',
                'status' => 'customer'
            ]);

        // Verify update
        $contact = Core\Database::query("SELECT * FROM contacts WHERE id = ?", [$id])->fetch();
        $this->assertEquals('Updated Name', $contact['name']);
        $this->assertEquals('customer', $contact['status']);
    }

    /**
     * Test: Can delete contact via DELETE
     */
    public function testCanDeleteContactViaHttp(): void {
        Core\Database::query(
            "INSERT INTO contacts (name, email) VALUES (?, ?)",
            ['To Delete', 'delete@test.com']
        );
        $id = Core\Database::lastInsertId();

        $this->actingAs($this->testUser)
            ->delete("contacts/{$id}");

        // Verify deletion
        $contact = Core\Database::query("SELECT * FROM contacts WHERE id = ?", [$id])->fetch();
        $this->assertFalse($contact, "Contact should be deleted");
    }

    /**
     * Test: Create requires authentication
     */
    public function testCreateContactRequiresAuth(): void {
        $this->logout();
        $this->post('contacts', [
            'name' => 'Unauth Contact',
            'email' => 'unauth@test.com'
        ])->assertRedirect('login');

        // Verify not created
        $contact = Core\Database::query(
            "SELECT * FROM contacts WHERE email = ?",
            ['unauth@test.com']
        )->fetch();
        $this->assertFalse($contact, "Contact should NOT be created without auth");
    }
}
```

### How to Write Tests for Your Features

For EVERY feature you implement, write corresponding tests covering both **unit** and **HTTP** levels:

```php
<?php
// tests/{Feature}Test.php

class {Feature}Test extends TestCase {
    protected array $testUser;

    public function setUp(): void {
        // Create test user for authenticated routes
        Core\Database::query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ['Test User', 'test@example.com', password_hash('test', PASSWORD_DEFAULT), 'admin']
        );
        $this->testUser = Core\Database::query(
            "SELECT * FROM users WHERE email = ?", ['test@example.com']
        )->fetch();
    }

    public function tearDown(): void {
        // Cleanup test data
        Core\Database::query("DELETE FROM {table} WHERE ...");
        Core\Database::query("DELETE FROM users WHERE email = ?", ['test@example.com']);
    }

    // ==================== HTTP ROUTE PROTECTION ====================

    /**
     * CRITICAL: Test that routes redirect to login when not authenticated
     */
    public function test{Feature}ListRequiresAuth(): void {
        $this->logout();
        $this->get('{feature}s')
            ->assertRedirect('login');
    }

    public function test{Feature}CreateRequiresAuth(): void {
        $this->logout();
        $this->post('{feature}s', ['name' => 'Test'])
            ->assertRedirect('login');
    }

    // ==================== HTTP CRUD OPERATIONS ====================

    public function testCan{Feature}ListWhenLoggedIn(): void {
        $this->actingAs($this->testUser)
            ->get('{feature}s')
            ->assertOk();
    }

    public function testCanCreate{Feature}ViaHttp(): void {
        $this->actingAs($this->testUser)
            ->post('{feature}s', ['name' => 'Test Item', ...]);

        // Verify in database
        $item = Core\Database::query("SELECT * FROM {table} WHERE name = ?", ['Test Item'])->fetch();
        $this->assertNotNull($item);
    }

    public function testCanUpdate{Feature}ViaHttp(): void {
        // Create item first
        Core\Database::query("INSERT INTO {table} (name) VALUES (?)", ['Original']);
        $id = Core\Database::lastInsertId();

        $this->actingAs($this->testUser)
            ->put("{feature}s/{$id}", ['name' => 'Updated']);

        $item = Core\Database::query("SELECT * FROM {table} WHERE id = ?", [$id])->fetch();
        $this->assertEquals('Updated', $item['name']);
    }

    public function testCanDelete{Feature}ViaHttp(): void {
        Core\Database::query("INSERT INTO {table} (name) VALUES (?)", ['To Delete']);
        $id = Core\Database::lastInsertId();

        $this->actingAs($this->testUser)
            ->delete("{feature}s/{$id}");

        $item = Core\Database::query("SELECT * FROM {table} WHERE id = ?", [$id])->fetch();
        $this->assertFalse($item, "Should be deleted");
    }
}
```

### Required Test Coverage

Every feature MUST have tests for:

| Test Type                          | What It Verifies                     |
| ---------------------------------- | ------------------------------------ |
| `test{Feature}ListRequiresAuth`    | List page redirects to login         |
| `test{Feature}CreateRequiresAuth`  | POST without auth redirects to login |
| `testCan{Feature}ListWhenLoggedIn` | List page works with auth            |
| `testCanCreate{Feature}ViaHttp`    | POST creates record in database      |
| `testCanUpdate{Feature}ViaHttp`    | PUT updates record in database       |
| `testCanDelete{Feature}ViaHttp`    | DELETE removes record from database  |

### Running Tests

After writing all code, ALWAYS run tests using the `php_exec` tool:

```json
// Use php_exec tool - script path is relative to workspace
php_exec({ "script": "tests/run.php" })
```

⚠️ **CRITICAL**: Use `php_exec` tool for PHP execution. Do NOT use `exec` tool - it is blocked for subagents.
The php_exec tool automatically runs in the workspace context (websites/{project-name}/).

Expected output for PASSING tests:

```
🧪 Running tests...

  ✓ AuthTest::testUserCanLogin
  ✓ AuthTest::testInvalidPasswordFails
  ✓ AuthTest::testUserNotFound
  ✓ ContactTest::testCreateContact
  ✓ ContactTest::testUpdateContact
  ✓ ContactTest::testDeleteContact
  ✓ ContactTest::testListContacts

──────────────────────────────────────────────────
Results: 7 passed, 0 failed

✅ ALL TESTS PASSED!
```

**If ANY test fails → FIX THE CODE → RE-RUN → REPEAT UNTIL ALL PASS**

---

## Config

### config/app.php

```php
<?php
return [
    'name' => 'My App',
    'version' => '1.0.0',
    'description' => 'Web application',
    'debug' => false,

    'database' => [
        // DATABASE_PATH constant defined in index.php (from platform env)
        'path' => DATABASE_PATH,
    ],

    // Agent API token - used by Clawku agents
    'agent_token' => '{{AGENT_TOKEN}}',
];
```

---

## Views

### views/layouts/main.php

```php
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= csrf_token() ?>">
    <title><?= config('app.name') ?></title>
    <link rel="stylesheet" href="assets/style.css">
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.8/dist/cdn.min.js"></script>
</head>
<body x-data="{ sidebarOpen: false, modalOpen: false }">
    <?php if (\Core\Auth::check()): ?>
    <nav class="navbar">
        <button class="navbar-toggle" @click="sidebarOpen = !sidebarOpen">
            <span></span><span></span><span></span>
        </button>
        <div class="navbar-brand"><?= config('app.name') ?></div>
        <div class="navbar-end">
            <span class="user-name"><?= e(\Core\Auth::user()['name'] ?? '') ?></span>
            <form action="./logout" method="POST" style="display:inline">
                <?= csrf_field() ?>
                <button type="submit" class="btn btn-sm btn-secondary">Logout</button>
            </form>
        </div>
    </nav>

    <div class="app-container">
        <aside class="sidebar" :class="{ 'open': sidebarOpen }">
            <nav class="sidebar-nav">
                <a href="./" hx-get="./" hx-target="#main-content" hx-push-url="true">Dashboard</a>
                <a href="./contacts" hx-get="./contacts" hx-target="#main-content" hx-push-url="true">Contacts</a>
                <!-- CUSTOMIZE: Add more menu items -->
            </nav>
        </aside>

        <main class="main-content" id="main-content">
            <?php $flash = \Core\Session::getFlash(); if ($flash): ?>
            <div class="alert alert-<?= $flash['type'] ?>" x-data="{ show: true }" x-show="show"
                 x-init="setTimeout(() => show = false, 4000)">
                <?= e($flash['message']) ?>
            </div>
            <?php endif; ?>

            <?php include $content; ?>
        </main>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" x-show="modalOpen" x-cloak @click.self="modalOpen = false">
        <div class="modal" @click.stop>
            <button class="modal-close" @click="modalOpen = false">&times;</button>
            <div id="modal-body"></div>
        </div>
    </div>
    <?php else: ?>
    <main class="auth-container">
        <?php $flash = \Core\Session::getFlash(); if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>

        <?php include $content; ?>
    </main>
    <?php endif; ?>

    <script>
        // 🔐 Configure htmx to include CSRF token in all requests
        document.body.addEventListener('htmx:configRequest', function(event) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                event.detail.headers['X-CSRF-Token'] = csrfToken;
            }
        });

        // Close modal on htmx events
        ['contactCreated', 'contactUpdated'].forEach(event => {
            document.body.addEventListener(event, () => {
                document.querySelector('[x-data]').__x.$data.modalOpen = false;
            });
        });
    </script>
</body>
</html>

<?php function e($s) { return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); } ?>
```

### views/auth/login.php

```php
<div class="auth-card">
    <h1>Login</h1>
    <form method="POST" action="./login">
        <?= csrf_field() ?>
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autofocus>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Login</button>
    </form>
    <p class="auth-link">Don't have an account? <a href="./register">Register</a></p>
</div>
```

### views/auth/register.php

```php
<div class="auth-card">
    <h1>Register</h1>
    <form method="POST" action="./register">
        <?= csrf_field() ?>
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required autofocus>
        </div>
        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Register</button>
    </form>
    <p class="auth-link">Already have an account? <a href="./login">Login</a></p>
</div>
```

### views/dashboard/index.php

```php
<div class="page-header">
    <h1>Dashboard</h1>
</div>

<div class="card-grid">
    <div class="card">
        <div class="card-title">Total Contacts</div>
        <div class="card-value"><?= $stats['total_contacts'] ?></div>
    </div>
    <div class="card">
        <div class="card-title">New Today</div>
        <div class="card-value"><?= $stats['new_today'] ?></div>
    </div>
</div>
```

### views/contacts/index.php

```php
<div class="page-header">
    <h1>Contacts</h1>
    <button class="btn btn-primary" hx-get="./contacts/create" hx-target="#modal-body" @click="modalOpen = true">
        + New Contact
    </button>
</div>

<div class="search-bar">
    <input type="search" name="q" placeholder="Search contacts..."
           hx-get="./contacts/list" hx-trigger="input changed delay:300ms"
           hx-target="#contacts-table">
</div>

<div id="contacts-table">
    <?php include __DIR__ . '/_table.php'; ?>
</div>
```

### views/contacts/\_table.php

```php
<?php if (empty($contacts)): ?>
<div class="empty-state">No contacts found.</div>
<?php else: ?>
<div class="table-responsive">
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th class="hide-mobile">Email</th>
                <th class="hide-mobile">Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="contacts-list">
            <?php foreach ($contacts as $contact): ?>
                <?php include __DIR__ . '/_row.php'; ?>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php endif; ?>
```

### views/contacts/\_row.php

```php
<tr id="contact-<?= $contact['id'] ?>">
    <td>
        <div class="cell-primary"><?= e($contact['name']) ?></div>
        <div class="cell-secondary show-mobile"><?= e($contact['email']) ?></div>
    </td>
    <td class="hide-mobile"><?= e($contact['email']) ?></td>
    <td class="hide-mobile">
        <span class="badge badge-<?= $contact['status'] ?>"><?= $contact['status'] ?></span>
    </td>
    <td class="actions">
        <button class="btn btn-sm" hx-get="./contacts/<?= $contact['id'] ?>/edit"
                hx-target="#modal-body" @click="modalOpen = true">Edit</button>
        <button class="btn btn-sm btn-danger" hx-delete="./contacts/<?= $contact['id'] ?>"
                hx-target="#contact-<?= $contact['id'] ?>" hx-swap="outerHTML"
                hx-confirm="Delete this contact?">Delete</button>
    </td>
</tr>
```

### views/contacts/\_form.php

```php
<form hx-<?= $contact['id'] ? 'put' : 'post' ?>="./contacts<?= $contact['id'] ? '/' . $contact['id'] : '' ?>"
      hx-target="<?= $contact['id'] ? '#contact-' . $contact['id'] : '#contacts-list' ?>"
      hx-swap="<?= $contact['id'] ? 'outerHTML' : 'afterbegin' ?>">

    <h2><?= $contact['id'] ? 'Edit Contact' : 'New Contact' ?></h2>

    <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" required value="<?= e($contact['name']) ?>">
    </div>

    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" value="<?= e($contact['email']) ?>">
    </div>

    <div class="form-group">
        <label for="phone">Phone</label>
        <input type="tel" id="phone" name="phone" value="<?= e($contact['phone']) ?>">
    </div>

    <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status">
            <option value="lead" <?= $contact['status'] === 'lead' ? 'selected' : '' ?>>Lead</option>
            <option value="active" <?= $contact['status'] === 'active' ? 'selected' : '' ?>>Active</option>
            <option value="cold" <?= $contact['status'] === 'cold' ? 'selected' : '' ?>>Cold</option>
        </select>
    </div>

    <div class="form-group">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="3"><?= e($contact['notes']) ?></textarea>
    </div>

    <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="modalOpen = false">Cancel</button>
        <button type="submit" class="btn btn-primary"><?= $contact['id'] ? 'Update' : 'Create' ?></button>
    </div>
</form>
```

---

## Mobile-First CSS (assets/style.css) - PROJECT ROOT

```css
/* ============ RESET & VARIABLES ============ */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --primary: #0ea5e9;
  --primary-dark: #0284c7;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg: #f1f5f9;
  --bg-card: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

html {
  font-size: 16px;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
}

/* ============ NAVBAR ============ */
.navbar {
  background: var(--bg-card);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  font-weight: 700;
  color: var(--primary);
}
.navbar-end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.user-name {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.navbar-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}
.navbar-toggle span {
  width: 20px;
  height: 2px;
  background: var(--text);
}

@media (min-width: 768px) {
  .navbar-toggle {
    display: none;
  }
}

/* ============ APP LAYOUT ============ */
.app-container {
  display: flex;
  min-height: calc(100vh - 60px);
}

.sidebar {
  position: fixed;
  left: -250px;
  top: 60px;
  width: 250px;
  height: calc(100vh - 60px);
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  transition: left 0.3s;
  z-index: 50;
}
.sidebar.open {
  left: 0;
}

.sidebar-nav {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sidebar-nav a {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text);
  text-decoration: none;
  border-radius: var(--radius);
}
.sidebar-nav a:hover {
  background: var(--bg);
}

.main-content {
  flex: 1;
  padding: 1rem;
  width: 100%;
}

@media (min-width: 768px) {
  .sidebar {
    position: static;
    left: 0;
  }
  .main-content {
    padding: 2rem;
  }
}

/* ============ AUTH PAGES ============ */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-card {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 400px;
}
.auth-card h1 {
  margin-bottom: 1.5rem;
  text-align: center;
}
.auth-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}
.auth-link a {
  color: var(--primary);
}

/* ============ BUTTONS ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}
.btn-sm {
  min-height: 36px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}
.btn-block {
  width: 100%;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover {
  background: var(--primary-dark);
}
.btn-secondary {
  background: var(--border);
  color: var(--text);
}
.btn-danger {
  background: var(--danger);
  color: white;
}

/* ============ FORMS ============ */
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
}
.form-group textarea {
  min-height: 100px;
  resize: vertical;
}
.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* ============ PAGE HEADER ============ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 480px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

/* ============ SEARCH ============ */
.search-bar {
  margin-bottom: 1rem;
}
.search-bar input {
  max-width: 300px;
}

/* ============ TABLE ============ */
.table-responsive {
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow: hidden;
}
.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.table th {
  background: var(--bg);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.table tbody tr:hover {
  background: var(--bg);
}

.cell-primary {
  font-weight: 500;
}
.cell-secondary {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.hide-mobile {
  display: none;
}
.show-mobile {
  display: block;
}
@media (min-width: 768px) {
  .hide-mobile {
    display: table-cell;
  }
  .show-mobile {
    display: none;
  }
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ============ CARDS ============ */
.card-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.card {
  background: var(--bg-card);
  padding: 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.card-title {
  font-size: 0.875rem;
  color: var(--text-muted);
}
.card-value {
  font-size: 2rem;
  font-weight: 700;
}

/* ============ BADGES ============ */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  text-transform: capitalize;
}
.badge-lead {
  background: #dbeafe;
  color: #1e40af;
}
.badge-active {
  background: #d1fae5;
  color: #065f46;
}
.badge-cold {
  background: #f1f5f9;
  color: #475569;
}

/* ============ ALERTS ============ */
.alert {
  padding: 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
}
.alert-success {
  background: #d1fae5;
  color: #065f46;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
}

/* ============ MODAL ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}
.modal {
  background: var(--bg-card);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 1.5rem;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--border);
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
}
@media (min-width: 480px) {
  .modal-overlay {
    align-items: center;
    padding: 1rem;
  }
  .modal {
    max-width: 500px;
    border-radius: var(--radius);
  }
}

[x-cloak] {
  display: none !important;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 2px dashed var(--border);
}

/* ============ HTMX LOADING ============ */
.htmx-request {
  opacity: 0.7;
}
```

---

## Agent API Usage

### From Clawku Agent

When a user asks the agent to interact with their webapp:

```
User: "Add a new contact named John Smith to my CRM"

Agent:
1. Calls: GET /api/agent/manifest (discover tools)
2. Finds: contacts.create tool
3. Calls: POST /api/agent/contacts
   Headers: X-Agent-Token: {token}
   Body: {"name": "John Smith", "status": "lead"}
4. Response: {"success": true, "data": {"id": 1, "name": "John Smith", ...}}
5. Responds: "Done! I've added John Smith as a new lead in your CRM."
```

### Manifest Example Response

```json
{
  "app": "Mini CRM",
  "version": "1.0.0",
  "tools": [
    {
      "name": "contacts.list",
      "description": "List all contacts records with optional search",
      "endpoint": "/api/agent/contacts",
      "method": "GET",
      "params": {
        "q": { "type": "string", "description": "Search query" },
        "limit": { "type": "integer", "default": 50 }
      }
    },
    {
      "name": "contacts.create",
      "description": "Create a new contacts",
      "endpoint": "/api/agent/contacts",
      "method": "POST",
      "params": {
        "name": { "type": "string", "required": true },
        "email": { "type": "string" },
        "phone": { "type": "string" },
        "status": { "type": "string", "enum": ["lead", "active", "cold"] }
      }
    }
  ]
}
```

---

## Validation Checklist

Before responding, verify:

- [ ] Created `index.php` at project root (front controller)
- [ ] Created all Core files (`App.php`, `Database.php`, etc.)
- [ ] Created entity Controller with `AgentAPI::register()`
- [ ] Created entity Model extending `Core\Model`
- [ ] Created migrations in `migrations/` folder
- [ ] Created views with htmx attributes
- [ ] Created `config/app.php` with agent_token
- [ ] Created `assets/style.css` at project root

**If NO to any → GO BACK AND FIX IT**

---

## Color Schemes by Business Type

**Professional** (Law, Finance): `--primary: #1e3a5f;`
**Creative** (Design, Tech): `--primary: #6366f1;`
**Nature** (Health, Spa): `--primary: #059669;`
**Food** (Restaurant): `--primary: #dc2626;`
**Tech** (SaaS): `--primary: #0ea5e9;`

---

## Preview URLs

After creating webapp, use the **isolated preview domain** (clawku.co) with **subdomain format**:

```
Preview: https://{project}.clawku.co/
Agent API: https://{project}.clawku.co/api/agent/
```

**IMPORTANT: Project names must be globally unique!**

Choose unique, descriptive project names. Examples:

- `toko-krenz-kasir` (not just `kasir`)
- `annas-crm` (not just `crm`)
- `warung-sari-pos` (not just `pos`)

The preview domain (clawku.co) is separate from the platform domain (b.clawku.id) for security isolation. User-generated content runs on the preview domain to prevent XSS attacks from affecting the main platform.

**URL Rules:**

- Use relative paths in your code (e.g., `href="assets/style.css"`, `action="login"`)
- Never use absolute paths with leading slashes (e.g., NOT `href="/assets/style.css"`)
- URLs run at root level on subdomain (e.g., `https://toko-krenz-kasir.clawku.co/login`)
