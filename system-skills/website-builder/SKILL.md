---
name: website-builder
description: Create websites and web applications with PHP + SQLite backend. Build landing pages, company profiles, portfolios, and full-stack web apps.
metadata: { "clawdbot": { "emoji": "🌐" } }
---

# Website Builder

## 🛑 MANDATORY BEHAVIOR - READ FIRST 🛑

### YOU MUST CALL TOOLS IMMEDIATELY. NO EXPLANATIONS.

When user asks you to create/build/make anything:

```
❌ WRONG: "I'll create a website for you. Let me start by..."
❌ WRONG: "Sure! I'll build that now. First, I'll..."
❌ WRONG: "Great idea! Let me implement..."
❌ WRONG: [Any text without a tool call]

✅ CORRECT: [Immediately call write tool with api.php]
✅ CORRECT: [Immediately call write tool with index.html]
✅ CORRECT: [Call multiple write tools, then brief confirmation]
```

### RESPONSE FORMAT (MANDATORY)

Your response MUST be:

1. **FIRST**: Call `write` tool (no text before it)
2. **SECOND**: Call more `write` tools for other files
3. **LAST**: Brief message with preview URL (only AFTER tools succeed)

### FORBIDDEN RESPONSES

These responses are FORBIDDEN and will FAIL the user:

| ❌ FORBIDDEN                | Why it fails                      |
| --------------------------- | --------------------------------- |
| "I'll create the files now" | Words don't create files          |
| "Let me build that for you" | Words don't create files          |
| "Sure, I'll implement..."   | Words don't create files          |
| "First, let me explain..."  | User wants ACTION not explanation |
| "Here's what I'll do..."    | User wants ACTION not plans       |
| Showing code in `blocks`    | Code blocks don't create files    |
| "Should I proceed?"         | User already asked, JUST DO IT    |

### CORRECT BEHAVIOR

When user says: "Create a contact form website"

Your response MUST BE:

1. `write path="websites/contact/api.php"` → [PHP code]
2. `write path="websites/contact/index.html"` → [HTML code]
3. `write path="websites/contact/style.css"` → [CSS code]
4. `write path="websites/contact/app.js"` → [JS code with fetch()]
5. "Done! Preview: [URL]"

NOT:

- "I'll create a contact form website with PHP backend..."
- "Let me build that for you. First..."
- "Sure! Here's what I'll create..."

### SELF-CHECK (DO THIS BEFORE EVERY RESPONSE)

Before sending ANY response, ask yourself:

1. Did user ask to create/modify something? → If YES, continue
2. Is my first action a tool call? → If NO, DELETE your text and CALL THE TOOL
3. Am I explaining/promising instead of doing? → If YES, DELETE and CALL THE TOOL

**RULE: Tool calls FIRST. Explanations NEVER (or minimal, AFTER tools succeed).**

---

## Architecture: ALWAYS Use PHP + SQLite Backend

**ALL web applications with data MUST use PHP + SQLite backend. NEVER use localStorage.**

Why:

- Data persists on server (survives browser clear, works across devices)
- Professional architecture for production apps
- No data loss risk

### File Structure (MANDATORY for apps with data)

```
websites/{project}/
├── index.html      # Frontend UI
├── style.css       # Styling
├── app.js          # Frontend logic with fetch() API calls
├── api.php         # PHP backend with SQLite
├── admin.html      # Admin panel (if needed)
└── data/           # SQLite database directory (auto-created)
```

### How to Build ANY Web Application

1. **CALL** write tool: `path="websites/{project}/api.php"` → PHP API with SQLite
2. **CALL** write tool: `path="websites/{project}/index.html"` → HTML with forms
3. **CALL** write tool: `path="websites/{project}/style.css"` → CSS styling
4. **CALL** write tool: `path="websites/{project}/app.js"` → Frontend with fetch() calls to API
5. **CALL** write tool: `path="websites/{project}/admin.html"` → Admin panel (if needed)
6. **WAIT** for ALL "Successfully wrote X bytes" confirmations
7. **THEN** share preview URL: `{{API_BASE_URL}}/websites/preview/{{PERSONA_ID}}/{project}/`

### VALIDATION CHECKLIST (Before responding):

- [ ] Did you create api.php with SQLite? (REQUIRED for any data)
- [ ] Does app.js use fetch() to call the API? (NOT localStorage)
- [ ] Did you see "Successfully wrote X bytes" for each file?
- [ ] If NO to any above → GO BACK AND FIX IT

---

## Static Websites (Display Only)

For websites that DON'T store data (company profiles, portfolios, landing pages):

1. **CALL** write tool: `path="websites/{project}/index.html"`
2. **CALL** write tool: `path="websites/{project}/style.css"`
3. **CALL** write tool: `path="websites/{project}/script.js"` (if needed)
4. **THEN** share preview URL

---

## API Template (api.php) - ALWAYS USE THIS

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$endpoint = getenv('API_ENDPOINT') ?: '';

// Data directory - ALWAYS use local directory
define('DATA_DIR', __DIR__ . '/data');
define('DB_PATH', DATA_DIR . '/data.sqlite');

if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0750, true);

// ============ INPUT SANITIZATION (MANDATORY) ============
function sanitizeString($input, $maxLength = 255): string {
    if (!is_string($input)) return '';
    $clean = strip_tags(trim($input));
    return mb_substr($clean, 0, $maxLength);
}

function sanitizeInt($input): int {
    return filter_var($input, FILTER_VALIDATE_INT) ?: 0;
}

function sanitizeFloat($input): float {
    return filter_var($input, FILTER_VALIDATE_FLOAT) ?: 0.0;
}

function sanitizeEmail($input): string {
    return filter_var($input, FILTER_VALIDATE_EMAIL) ?: '';
}
// ========================================================

function getDb(): PDO {
    static $pdo = null;
    if (!$pdo) {
        $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
        initSchema($pdo);
    }
    return $pdo;
}

function initSchema(PDO $pdo): void {
    $exists = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='_meta'")->fetch();
    if (!$exists) {
        $pdo->exec("
            CREATE TABLE _meta (key TEXT PRIMARY KEY, value TEXT);
            INSERT INTO _meta VALUES ('version', '1');

            -- CUSTOMIZE: Add your tables here based on the app type
            -- Example for contact form:
            CREATE TABLE contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                created_at TEXT DEFAULT (datetime('now'))
            );
        ");
    }
}

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function sendError($status, $code, $msg) {
    http_response_code($status);
    echo json_encode(['error' => $code, 'message' => $msg]);
    exit;
}

function getBody(): array {
    $body = file_get_contents('php://input') ?: file_get_contents('php://stdin');
    return $body ? (json_decode($body, true) ?? []) : [];
}

// Routing
$method = $_SERVER['REQUEST_METHOD'];
$parts = array_values(array_filter(explode('/', trim($endpoint, '/'))));
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

try {
    $db = getDb();

    switch ($resource) {
        case 'health':
            sendJson(['status' => 'ok']);
            break;

        // CUSTOMIZE: Add your endpoints here
        case 'contacts':
            if ($method === 'GET') {
                $rows = $db->query('SELECT * FROM contacts ORDER BY created_at DESC')->fetchAll();
                sendJson(['contacts' => $rows]);
            } elseif ($method === 'POST') {
                $body = getBody();
                $name = sanitizeString($body['name'] ?? '', 100);
                $email = sanitizeEmail($body['email'] ?? '');
                $message = sanitizeString($body['message'] ?? '', 2000);

                if (empty($name) || empty($email) || empty($message)) {
                    sendError(400, 'INVALID_INPUT', 'Name, email, and message are required');
                }

                $stmt = $db->prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
                $stmt->execute([$name, $email, $message]);
                sendJson(['id' => (int)$db->lastInsertId(), 'success' => true], 201);
            } elseif ($method === 'DELETE' && $id) {
                $db->prepare('DELETE FROM contacts WHERE id = ?')->execute([sanitizeInt($id)]);
                sendJson(['success' => true]);
            }
            break;

        default:
            sendError(404, 'NOT_FOUND', 'Endpoint not found');
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    sendError(500, 'SERVER_ERROR', 'Server error');
}
```

---

## Frontend API Client (app.js) - ALWAYS USE THIS PATTERN

```javascript
// API Configuration - ALWAYS use server API, NEVER localStorage
const API_BASE = window.location.pathname.replace("/index.html", "").replace(/\/$/, "");
const API_URL = API_BASE.replace("/preview/", "/api/");

const API = {
  async request(endpoint, options = {}) {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },

  get: (ep) => API.request(ep),
  post: (ep, data) => API.request(ep, { method: "POST", body: JSON.stringify(data) }),
  put: (ep, data) => API.request(ep, { method: "PUT", body: JSON.stringify(data) }),
  delete: (ep) => API.request(ep, { method: "DELETE" }),
};

// Example: Contact Form Submission
document.getElementById("contactForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  try {
    const formData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    await API.post("contacts", formData);

    // Success
    alert("Pesan berhasil dikirim!");
    this.reset();
  } catch (err) {
    alert("Gagal mengirim: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Example: Load and display data
async function loadContacts() {
  try {
    const { contacts } = await API.get("contacts");
    // Render contacts...
  } catch (err) {
    console.error("Failed to load:", err);
  }
}
```

---

## Design Requirements (MANDATORY)

**ALL websites MUST:**

1. **Mobile-First Design**: Design for mobile screens first
   - Responsive breakpoints: 480px, 768px, 1024px
   - Touch-friendly buttons (min 44px tap targets)
   - Readable font sizes on mobile (min 16px body text)

2. **Professional Aesthetic**:
   - Use appropriate color scheme based on business type
   - Modern typography with good hierarchy
   - Generous whitespace and spacing
   - Smooth transitions and hover effects

3. **Good Styling**: Never create plain/unstyled websites

---

## Color Schemes by Business Type

**Professional/Corporate** (Law, Finance):

```css
:root {
  --primary: #1e3a5f;
  --accent: #c9a227;
}
```

**Creative/Agency** (Design, Tech):

```css
:root {
  --primary: #6366f1;
  --accent: #ec4899;
}
```

**Nature/Wellness** (Health, Spa):

```css
:root {
  --primary: #059669;
  --accent: #fbbf24;
}
```

**Food & Hospitality** (Restaurant, Cafe):

```css
:root {
  --primary: #dc2626;
  --accent: #f59e0b;
}
```

**Tech/Modern** (SaaS, Apps):

```css
:root {
  --primary: #0ea5e9;
  --accent: #8b5cf6;
}
```

---

## Common App Types

### Contact Form / Lead Capture

- api.php: `contacts` table with name, email, message, status
- index.html: Contact form
- admin.html: View/manage submissions

### POS / Cashier System

- api.php: `products`, `transactions` tables
- index.html: POS interface
- admin.html: Product management, reports

### Inventory Management

- api.php: `items`, `stock_movements` tables
- index.html: Stock view
- admin.html: Add/edit items, adjustments

### Booking / Reservation

- api.php: `bookings` table with date, time, status
- index.html: Booking form
- admin.html: Calendar view, manage bookings

### CRM / Contact Manager

- api.php: `contacts`, `notes`, `tags` tables
- index.html: Contact list with search
- admin.html: Add/edit contacts

---

## Export to Excel (MANDATORY for data apps)

Add export functionality in admin.html:

```javascript
function exportToExcel(data, filename) {
  function convertToCSV(arr) {
    if (arr.length === 0) return "";
    const headers = Object.keys(arr[0]);
    const csvRows = [headers.join(",")];
    for (const row of arr) {
      const values = headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`);
      csvRows.push(values.join(","));
    }
    return csvRows.join("\n");
  }

  const csv = convertToCSV(data);
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}

// Usage
async function exportContacts() {
  const { contacts } = await API.get("contacts");
  exportToExcel(contacts, "contacts-" + new Date().toISOString().split("T")[0]);
}
```

---

## Images and Media

You cannot create images. For images:

1. Ask user to upload to **Cloud Storage**
2. User shares the URL
3. Use URL in HTML: `<img src="https://...cloud-storage-url...">`

---

## Listing Existing Webapps

To list the user's existing webapps, use the `bash` tool with `ls` command:

```
bash command="ls -la websites/"
```

This will show all webapp project directories. Each subdirectory is a separate webapp project.

**CRITICAL RULES:**

1. Use `bash` tool (NOT `devices_run`) - bash runs on server, devices_run routes to offline device
2. **DO NOT add redirects** like `2>/dev/null` - redirects break local execution
3. Use simple command format exactly as shown above

Alternative: Tell the user to check their **Cloud Storage** page on the dashboard - the Webapps section shows all their projects with preview links.

---

## Preview & Download URLs

After creating a website, share these URLs with the user:

**Preview URL:**

```
{{API_BASE_URL}}/websites/preview/{{PERSONA_ID}}/project-name/
```

**API endpoints:**

```
{{API_BASE_URL}}/websites/api/project-name/{endpoint}
```

**Download as ZIP (requires login):**

```
{{API_BASE_URL}}/websites/download/project-name
```

Note: Websites are stored at USER level (shared across all personas). The user can download any website as a ZIP file from their dashboard or using the download URL above.

---

## PHP Security (CRITICAL)

**NEVER use these dangerous functions:**

| Category        | Forbidden                                          |
| --------------- | -------------------------------------------------- |
| Code Execution  | `eval()`, `assert()`, `create_function()`          |
| System Commands | `exec()`, `shell_exec()`, `system()`, `passthru()` |
| File Inclusion  | `include/require` with user input                  |
| Serialization   | `unserialize()` with user input                    |

**ALWAYS:**

- Use prepared statements for SQL
- Sanitize all user input
- Use `htmlspecialchars()` for output
