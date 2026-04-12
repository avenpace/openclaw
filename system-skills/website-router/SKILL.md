---
name: website-router
description: Routes website build requests to background subagent. ALWAYS use this before website-builder.
metadata: { "clawdbot": { "emoji": "🔀" } }
---

# WEBSITE BUILD ROUTING

**When user asks to build/create a website or web app:**

## STEP 1: Present Plan

- List entities, features, pages
- Wait for user "go" or approval

## STEP 2: Create Project Directory

```bash
mkdir -p websites/{project-name}
```

## STEP 3: Write BUILD-SPEC.md

Create `websites/{project-name}/BUILD-SPEC.md` with:

```markdown
# Build Specification: {project-name}

## PROJECT PATH (CRITICAL!)

ALL files MUST be written inside: `websites/{project-name}/`
DO NOT write files anywhere else. DO NOT use parent workspace root.

## Requirements

{paste full user requirements here}

## Entities

{list entities}

## Features

{list features}

## Pages

{list pages}

## Tech Stack

- PHP 8.x with vanilla MVC (no frameworks)
- SQLite database in `data/` directory
- Plain CSS (no Tailwind/Bootstrap)
- Vanilla JavaScript

## Directory Structure
```

websites/{project-name}/
├── index.php
├── config.php
├── data/
│ └── database.sqlite
├── app/
│ ├── Core/
│ ├── Models/
│ ├── Views/
│ └── Controllers/
├── public/
│ ├── css/
│ └── js/
└── tests/

```

## Quality Gates
- [ ] All PHP files pass `php -l` lint check
- [ ] Unit tests pass
- [ ] App loads without 500 error (smoke test)
- [ ] Website registered via API
```

## STEP 4: Spawn Subagent

```
sessions_spawn({
  task: "Read websites/{project-name}/BUILD-SPEC.md and build the webapp following ALL instructions. Write ALL files inside websites/{project-name}/ directory ONLY.",
  mode: "run"
})
```

## STEP 5: Reply

"Building in background. Will notify when done."

---

**CRITICAL RULES:**

- DO NOT use write/edit/exec directly for website code
- ALWAYS create BUILD-SPEC.md first with explicit paths
- ALWAYS spawn subagent to do the actual coding
- Subagent reads the spec and follows it exactly
