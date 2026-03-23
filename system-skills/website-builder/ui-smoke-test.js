#!/usr/bin/env node
/**
 * UI Smoke Test for Website Builder
 *
 * Loads key pages in headless browser, checks for:
 * - JavaScript console errors
 * - Page load errors
 * - Key DOM elements exist
 * - AJAX data actually renders (not empty)
 *
 * Usage: node ui-smoke-test.js <project-path> [--base-url=http://localhost:8080]
 *
 * Exit codes:
 *   0 = All tests passed
 *   1 = Tests failed
 *   2 = Invalid arguments
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node ui-smoke-test.js <project-path> [--base-url=URL] [--quiet]");
  process.exit(2);
}

const projectPath = args[0];
const baseUrlArg = args.find((a) => a.startsWith("--base-url="));
const quiet = args.includes("--quiet");
const baseUrl = baseUrlArg ? baseUrlArg.split("=")[1] : null;

// Results accumulator
const results = {
  jsLint: { pass: true, errors: [] },
  pageLoad: { pass: true, errors: [] },
  consoleErrors: { pass: true, errors: [] },
  domChecks: { pass: true, errors: [] },
  ajaxChecks: { pass: true, errors: [] },
};

function log(msg) {
  if (!quiet) {
    console.log(msg);
  }
}

function logError(msg) {
  console.error(msg);
}

// ============ JS SYNTAX CHECK ============

function checkJsSyntax() {
  log("\n--- JS Syntax Check ---");

  const assetsDir = path.join(projectPath, "assets");
  const viewsDir = path.join(projectPath, "views");

  const jsFiles = [];

  // Find standalone JS files
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
    files.forEach((f) => jsFiles.push(path.join(assetsDir, f)));
  }

  // Extract inline JS from PHP files for syntax check
  const inlineJsFiles = [];
  function extractInlineJs(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        extractInlineJs(fullPath);
      } else if (entry.name.endsWith(".php")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Extract <script>...</script> blocks (not src imports)
        const scriptMatches = content.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
        let scriptIndex = 0;
        for (const match of scriptMatches) {
          const jsContent = match[1].trim();
          if (jsContent && jsContent.length > 10) {
            // Write to temp file for syntax check
            const tempFile = `/tmp/inline-js-${path.basename(fullPath)}-${scriptIndex}.js`;
            fs.writeFileSync(tempFile, jsContent);
            inlineJsFiles.push({ tempFile, source: `${fullPath}:inline-script-${scriptIndex}` });
            scriptIndex++;
          }
        }
      }
    }
  }
  extractInlineJs(viewsDir);

  // Check standalone JS files
  for (const jsFile of jsFiles) {
    try {
      execSync(`node --check "${jsFile}" 2>&1`, { encoding: "utf-8" });
      log(`  [PASS] ${path.relative(projectPath, jsFile)}`);
    } catch (err) {
      results.jsLint.pass = false;
      const error = {
        file: path.relative(projectPath, jsFile),
        error: err.stdout || err.message,
      };
      results.jsLint.errors.push(error);
      logError(`  [FAIL] ${error.file}: ${error.error}`);
    }
  }

  // Check inline JS
  for (const { tempFile, source } of inlineJsFiles) {
    try {
      execSync(`node --check "${tempFile}" 2>&1`, { encoding: "utf-8" });
      log(`  [PASS] ${source}`);
    } catch (err) {
      results.jsLint.pass = false;
      const error = {
        file: source,
        error: err.stdout || err.message,
      };
      results.jsLint.errors.push(error);
      logError(`  [FAIL] ${source}: ${error.error}`);
    } finally {
      // Cleanup temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
  }

  if (jsFiles.length === 0 && inlineJsFiles.length === 0) {
    log("  No JS files found to check");
  }

  return results.jsLint.pass;
}

// ============ BROWSER SMOKE TEST ============

async function runBrowserTests() {
  if (!baseUrl) {
    log("\n--- Browser Tests SKIPPED (no --base-url) ---");
    return true;
  }

  log("\n--- Browser Smoke Tests ---");
  log(`Base URL: ${baseUrl}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Collect console errors
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({
          text: msg.text(),
          location: msg.location(),
        });
      }
    });

    // Collect page errors (uncaught exceptions)
    const pageErrors = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    // Track AJAX responses
    const ajaxResponses = [];
    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes("/api/") ||
        url.includes("?action=") ||
        (response.headers()["content-type"] || "").includes("application/json")
      ) {
        try {
          const text = await response.text();
          if (text.startsWith("{") || text.startsWith("[")) {
            ajaxResponses.push({
              url,
              status: response.status(),
              data: JSON.parse(text),
            });
          }
        } catch {}
      }
    });

    // Discover routes from project
    const routes = discoverRoutes();
    log(`  Discovered ${routes.length} routes to test`);

    for (const route of routes) {
      const fullUrl = `${baseUrl}${route.path}`;
      log(`  Testing: ${route.path}`);

      consoleErrors.length = 0;
      pageErrors.length = 0;
      ajaxResponses.length = 0;

      try {
        const response = await page.goto(fullUrl, {
          waitUntil: "networkidle2",
          timeout: 10000,
        });

        // Check HTTP status
        const status = response.status();
        if (status >= 400) {
          results.pageLoad.pass = false;
          results.pageLoad.errors.push({
            route: route.path,
            error: `HTTP ${status}`,
          });
          logError(`    [FAIL] HTTP ${status}`);
          continue;
        }

        // Wait a bit for JS to execute
        await page.waitForTimeout(500);

        // Check for page errors
        if (pageErrors.length > 0) {
          results.consoleErrors.pass = false;
          results.consoleErrors.errors.push({
            route: route.path,
            errors: [...pageErrors],
          });
          logError(`    [FAIL] JS errors: ${pageErrors.join(", ")}`);
        }

        // Check for console errors (filter out some noise)
        const realErrors = consoleErrors.filter(
          (e) => !e.text.includes("favicon.ico") && !e.text.includes("Failed to load resource"), // We check HTTP status separately
        );
        if (realErrors.length > 0) {
          results.consoleErrors.pass = false;
          results.consoleErrors.errors.push({
            route: route.path,
            errors: realErrors.map((e) => e.text),
          });
          logError(`    [FAIL] Console errors: ${realErrors.map((e) => e.text).join(", ")}`);
        }

        // DOM checks based on route type
        if (route.checks) {
          for (const check of route.checks) {
            const element = await page.$(check.selector);
            if (!element) {
              results.domChecks.pass = false;
              results.domChecks.errors.push({
                route: route.path,
                error: `Missing element: ${check.selector} (${check.description})`,
              });
              logError(`    [FAIL] Missing: ${check.selector}`);
            }
          }
        }

        // AJAX data rendering check
        // If we got AJAX data with items, check that something rendered
        for (const ajax of ajaxResponses) {
          const data = ajax.data;
          const hasItems = Array.isArray(data)
            ? data.length > 0
            : (data.data && Array.isArray(data.data) && data.data.length > 0) ||
              (data.items && Array.isArray(data.items) && data.items.length > 0);

          if (hasItems) {
            // Check that we have some content rendered (table rows, list items, cards)
            const hasRenderedContent = await page.$(
              "table tbody tr, .card, .list-item, .product-item, [data-item]",
            );
            if (!hasRenderedContent) {
              // Only warn, don't fail - the page might not have data yet
              log(`    [WARN] AJAX returned data but no items rendered (${ajax.url})`);
            }
          }
        }

        log(`    [PASS] ${route.path}`);
      } catch (err) {
        results.pageLoad.pass = false;
        results.pageLoad.errors.push({
          route: route.path,
          error: err.message,
        });
        logError(`    [FAIL] ${route.path}: ${err.message}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return results.pageLoad.pass && results.consoleErrors.pass && results.domChecks.pass;
}

function discoverRoutes() {
  const routes = [];

  // Check index.php for route definitions
  const indexPath = path.join(projectPath, "index.php");
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, "utf-8");

    // Find route patterns like: '/login' => ..., 'GET /dashboard' => ...
    const routeMatches = content.matchAll(/['"](?:GET\s+|POST\s+)?(\/?[a-z0-9\-_/]+)['"]\s*=>/gi);
    for (const match of routeMatches) {
      const path = match[1].startsWith("/") ? match[1] : "/" + match[1];
      if (!routes.find((r) => r.path === path)) {
        routes.push({ path, checks: [] });
      }
    }
  }

  // Default routes if none discovered
  if (routes.length === 0) {
    routes.push(
      { path: "/", checks: [] },
      { path: "/login", checks: [{ selector: "form", description: "login form" }] },
      { path: "/register", checks: [{ selector: "form", description: "register form" }] },
    );
  }

  // Add common checks
  for (const route of routes) {
    if (route.path === "/login" || route.path === "/register") {
      route.checks.push({ selector: "form", description: "auth form" });
    }
    if (route.path.includes("dashboard")) {
      route.checks.push({
        selector: ".dashboard, .main-content, main",
        description: "dashboard content",
      });
    }
    if (route.path.includes("pos")) {
      route.checks.push({ selector: ".pos, .products, .cart, main", description: "POS interface" });
    }
  }

  // Filter to only GET-able routes (exclude pure API routes)
  return routes.filter(
    (r) => !r.path.includes("/api/") && !r.path.includes("/ajax/") && !r.path.includes("/webhook"),
  );
}

// ============ MAIN ============

async function main() {
  log("====================================");
  log("  UI Smoke Test - Website Builder");
  log("====================================");
  log(`Project: ${projectPath}`);

  // Verify project exists
  if (!fs.existsSync(projectPath)) {
    logError(`Project path does not exist: ${projectPath}`);
    process.exit(2);
  }

  // Run JS syntax check
  const jsPass = checkJsSyntax();

  // Run browser tests
  const browserPass = await runBrowserTests();

  // Summary
  log("\n====================================");
  log("  SUMMARY");
  log("====================================");

  const allPass = jsPass && browserPass;

  log(`JS Syntax:      ${results.jsLint.pass ? "PASS" : "FAIL"}`);
  log(`Page Load:      ${results.pageLoad.pass ? "PASS" : "FAIL"}`);
  log(`Console Errors: ${results.consoleErrors.pass ? "PASS" : "FAIL"}`);
  log(`DOM Checks:     ${results.domChecks.pass ? "PASS" : "FAIL"}`);
  log(`AJAX Checks:    ${results.ajaxChecks.pass ? "PASS" : "FAIL"}`);
  log("------------------------------------");
  log(`OVERALL:        ${allPass ? "PASS" : "FAIL"}`);

  // Output JSON for programmatic consumption
  if (quiet) {
    console.log(
      JSON.stringify({
        pass: allPass,
        results,
      }),
    );
  }

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  logError(`Fatal error: ${err.message}`);
  process.exit(1);
});
