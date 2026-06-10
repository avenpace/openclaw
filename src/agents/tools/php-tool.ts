/**
 * Sandboxed PHP Execution Tool
 *
 * Provides safe PHP script execution on the SERVER for website-builder.
 * Use this for running PHP tests, validation scripts, and lint checks.
 *
 * WHEN TO USE THIS (server-side php_exec):
 * - Running tests/run.php for website-builder
 * - PHP syntax checks (lint)
 * - Running eval-runner.php for validation
 * - Executing PHP scripts within workspace
 *
 * Security restrictions:
 * 1. Script must be within workspace directory
 * 2. Dangerous functions blocked via disable_functions
 * 3. Timeout - 60 second execution limit
 * 4. No network access (allow_url_fopen=0)
 * 5. open_basedir restricted to workspace
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, normalize, relative, isAbsolute } from "node:path";
import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

const PhpExecSchema = Type.Object({
  script: Type.String({
    description: "Path to PHP script to execute (relative to workspace, e.g., 'tests/run.php')",
  }),
  args: Type.Optional(
    Type.Array(Type.String(), {
      description: "Optional command-line arguments to pass to the script",
    }),
  ),
  timeout: Type.Optional(
    Type.Number({
      description: "Execution timeout in seconds (default: 60, max: 120)",
      minimum: 1,
      maximum: 120,
    }),
  ),
});

export type PhpToolOptions = {
  /** Workspace directory - PHP can only access files within this directory */
  workspaceDir: string;
  /** Maximum execution timeout in seconds */
  maxTimeoutSec?: number;
  /** Optional database path for SQLite */
  databasePath?: string;
};

/**
 * PHP functions that are blocked for security
 */
const DISABLED_FUNCTIONS = [
  // Code execution
  "exec",
  "shell_exec",
  "system",
  "passthru",
  "popen",
  "proc_open",
  "pcntl_exec",
  "eval",
  "assert",
  "create_function",
  "call_user_func",
  "call_user_func_array",
  "preg_replace_callback",
  // File operations outside workspace (handled by open_basedir)
  "link",
  "symlink",
  "readlink",
  // Network
  "fsockopen",
  "pfsockopen",
  "stream_socket_client",
  "stream_socket_server",
  "curl_init",
  "curl_exec",
  "curl_multi_init",
  "curl_multi_exec",
  "file_get_contents", // When used with URLs - controlled via allow_url_fopen
  "fopen", // When used with URLs - controlled via allow_url_fopen
  // Info disclosure
  "phpinfo",
  "php_uname",
  "getmyuid",
  "getmypid",
  "get_current_user",
  "getmyinode",
  "disk_free_space",
  "disk_total_space",
  "diskfreespace",
  // Process control
  "pcntl_fork",
  "pcntl_waitpid",
  "pcntl_signal",
  "posix_kill",
  "posix_mkfifo",
  "posix_setpgid",
  "posix_setsid",
  "posix_setuid",
  // Mail (spam prevention)
  "mail",
  // Dangerous
  "putenv",
  "ini_set",
  "ini_restore",
  "dl",
  "set_time_limit",
  "ignore_user_abort",
].join(",");

/**
 * Validate PHP script path for security
 */
function validateScriptPath(
  scriptPath: string,
  workspaceDir: string,
): { valid: boolean; resolvedPath?: string; error?: string } {
  // Reject empty path
  if (!scriptPath || typeof scriptPath !== "string") {
    return { valid: false, error: "Script path is required" };
  }

  // Reject absolute paths
  if (isAbsolute(scriptPath)) {
    return { valid: false, error: "Script path must be relative to workspace" };
  }

  // Reject path traversal
  if (scriptPath.includes("..")) {
    return { valid: false, error: "Path traversal (..) is not allowed" };
  }

  // Resolve to absolute path
  const resolvedPath = resolve(workspaceDir, scriptPath);
  const normalizedPath = normalize(resolvedPath);

  // Ensure path is within workspace
  const relativePath = relative(workspaceDir, normalizedPath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    return { valid: false, error: "Script must be within workspace directory" };
  }

  // Check file exists
  if (!existsSync(normalizedPath)) {
    return { valid: false, error: `Script not found: ${scriptPath}` };
  }

  // Must be .php file
  if (!normalizedPath.endsWith(".php")) {
    return { valid: false, error: "Only .php files can be executed" };
  }

  return { valid: true, resolvedPath: normalizedPath };
}

/**
 * Execute PHP script in a sandboxed environment
 */
async function executePhpSandboxed(
  scriptPath: string,
  workspaceDir: string,
  args: string[],
  timeoutSec: number,
  databasePath?: string,
): Promise<{ success: boolean; output?: string; error?: string; exitCode?: number }> {
  return new Promise((resolve) => {
    const phpPath = process.env.PHP_PATH || "/usr/bin/php";

    // Build PHP CLI arguments with security restrictions
    const phpArgs = [
      // Disable dangerous functions
      "-d",
      `disable_functions=${DISABLED_FUNCTIONS}`,
      // Restrict file access to workspace (and database dir if provided)
      "-d",
      `open_basedir=${workspaceDir}${databasePath ? `:${databasePath}` : ""}:/tmp`,
      // Disable URL file access
      "-d",
      "allow_url_fopen=0",
      "-d",
      "allow_url_include=0",
      // Memory limit
      "-d",
      "memory_limit=128M",
      // Error reporting
      "-d",
      "display_errors=1",
      "-d",
      "error_reporting=E_ALL",
      // Disable output buffering for real-time output
      "-d",
      "output_buffering=0",
      // The script to run
      scriptPath,
      // User arguments
      ...args,
    ];

    // Spawn PHP process with restrictions
    const proc = spawn(phpPath, phpArgs, {
      cwd: workspaceDir,
      timeout: timeoutSec * 1000,
      env: {
        // Minimal environment
        PATH: process.env.PATH,
        HOME: workspaceDir,
        // Pass database path if provided
        ...(databasePath && { DATABASE_PATH: databasePath }),
        // Disable Composer/etc
        COMPOSER_HOME: "/dev/null",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timeout = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeoutSec * 1000);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      // Limit output size
      if (stdout.length > 200000) {
        killed = true;
        proc.kill("SIGKILL");
      }
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 100000) {
        killed = true;
        proc.kill("SIGKILL");
      }
    });

    proc.on("close", (exitCode) => {
      clearTimeout(timeout);

      if (killed) {
        resolve({
          success: false,
          error: "Execution terminated: timeout or output limit exceeded",
          exitCode: -1,
        });
        return;
      }

      // Combine output
      const output = [stdout, stderr].filter(Boolean).join("\n").trim();

      if (exitCode !== 0) {
        resolve({
          success: false,
          output: output || undefined,
          error: stderr || `PHP exited with code ${exitCode}`,
          exitCode: exitCode ?? 1,
        });
        return;
      }

      resolve({
        success: true,
        output: output || "(no output)",
        exitCode: 0,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to execute PHP: ${err.message}`,
        exitCode: -1,
      });
    });

    // Close stdin immediately
    proc.stdin.end();
  });
}

/**
 * Create the sandboxed PHP execution tool
 *
 * @param options Configuration options
 * @returns Agent tool for PHP execution
 */
export function createPhpTool(options: PhpToolOptions): AnyAgentTool {
  const { workspaceDir, maxTimeoutSec = 60, databasePath } = options;

  return {
    label: "PHP (Server Sandbox)",
    name: "php_exec",
    description: `Execute PHP scripts on server for running tests and validation.

**WHEN TO USE**:
- Running tests: php_exec with script="tests/run.php"
- PHP lint check: Use exec with "php -l file.php" for syntax checking
- Running eval-runner.php for build validation
- Any PHP script execution within workspace

**EXAMPLES**:
- Run tests: { "script": "tests/run.php" }
- Run with args: { "script": "tests/run.php", "args": ["--verbose"] }

**SECURITY**:
- Scripts must be within workspace
- No shell commands (exec, system, etc.)
- No network access (curl, file_get_contents with URLs)
- No path traversal
- 60s timeout

WORKSPACE: ${workspaceDir}
TIMEOUT: ${maxTimeoutSec}s`,
    parameters: PhpExecSchema,
    execute: async (_toolCallId, params) => {
      const script = (params as { script: string; args?: string[]; timeout?: number }).script;
      const args = (params as { script: string; args?: string[]; timeout?: number }).args ?? [];
      const timeout = Math.min(
        (params as { script: string; args?: string[]; timeout?: number }).timeout ?? maxTimeoutSec,
        maxTimeoutSec,
      );

      // Validate script path
      const validation = validateScriptPath(script, workspaceDir);
      if (!validation.valid) {
        return jsonResult({ success: false, error: validation.error });
      }

      // Verify workspace exists
      if (!existsSync(workspaceDir)) {
        return jsonResult({
          success: false,
          error: `Workspace directory does not exist: ${workspaceDir}`,
        });
      }

      try {
        const result = await executePhpSandboxed(
          validation.resolvedPath!,
          workspaceDir,
          args,
          timeout,
          databasePath,
        );

        return jsonResult({
          success: result.success,
          output: result.output,
          error: result.error,
          exitCode: result.exitCode,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          success: false,
          error: `PHP execution failed: ${message}`,
        });
      }
    },
  };
}

/**
 * Convenience function to check if PHP is available
 */
export async function isPhpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const phpPath = process.env.PHP_PATH || "/usr/bin/php";
    const proc = spawn(phpPath, ["--version"], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    });

    proc.on("close", (code) => {
      resolve(code === 0);
    });

    proc.on("error", () => {
      resolve(false);
    });
  });
}
