/**
 * Sandboxed Python Execution Tool
 *
 * Provides safe Python code execution on the SERVER for workspace file operations.
 * Use this for file manipulation, text processing, and data transformations.
 *
 * WHEN TO USE THIS (server-side python_exec):
 * - Editing/fixing files in workspace (PHP, JS, CSS, etc.)
 * - Batch find-and-replace operations
 * - Text/JSON/data transformations
 * - File content analysis
 * - Code generation within workspace
 *
 * WHEN TO USE DEVICE (exec python via devices_run):
 * - User explicitly asks to run on their device
 * - Need system access (os, subprocess, network)
 * - Need packages not available in sandbox
 * - Operations outside workspace directory
 *
 * Security restrictions:
 * 1. Module blocklist - blocks os, subprocess, sys, socket, etc.
 * 2. Workspace restriction - can only access files in workspace directory
 * 3. Timeout - 30 second execution limit
 * 4. No network access
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

// Modules that are completely blocked
const BLOCKED_MODULES = new Set([
  // System access
  "os",
  "subprocess",
  "sys",
  "shutil",
  "platform",
  "ctypes",
  "multiprocessing",

  // Network access
  "socket",
  "socketserver",
  "http",
  "http.client",
  "http.server",
  "urllib",
  "urllib.request",
  "urllib.parse",
  "ftplib",
  "smtplib",
  "poplib",
  "imaplib",
  "telnetlib",
  "ssl",
  "asyncio",
  "aiohttp",
  "requests",
  "httpx",

  // Code execution
  "code",
  "codeop",
  "compile",
  "exec",
  "eval",
  "importlib",
  "__import__",
  "runpy",

  // File system escape
  "pathlib", // We provide restricted path access via our wrapper
  "tempfile",
  "glob",

  // Dangerous builtins
  "builtins",
  "__builtins__",

  // Process/signal handling
  "signal",
  "atexit",
  "threading",
  "concurrent",

  // Pickle (code execution vector)
  "pickle",
  "cPickle",
  "marshal",
  "shelve",

  // Low-level
  "gc",
  "inspect",
  "traceback",
  "linecache",
  "dis",
  "ast",
  "tokenize",
  "symtable",
  "resource",

  // FFI
  "cffi",
  "ffi",
  "_ctypes",
]);

// Safe modules that are allowed
const ALLOWED_MODULES = new Set([
  "json",
  "math",
  "random",
  "re",
  "datetime",
  "time",
  "collections",
  "itertools",
  "functools",
  "operator",
  "string",
  "textwrap",
  "unicodedata",
  "struct",
  "codecs",
  "base64",
  "hashlib",
  "hmac",
  "csv",
  "xml",
  "xml.etree",
  "xml.etree.ElementTree",
  "html",
  "html.parser",
  "typing",
  "dataclasses",
  "enum",
  "decimal",
  "fractions",
  "statistics",
  "copy",
  "pprint",
  "difflib",
  "heapq",
  "bisect",
  "array",
  "contextlib",
  "abc",
  "numbers",
  "io", // StringIO, BytesIO only (we override file access)
]);

const PythonExecSchema = Type.Object({
  code: Type.String({
    description: "Python code to execute. Must be self-contained. Cannot access network or system.",
  }),
  timeout: Type.Optional(
    Type.Number({
      description: "Execution timeout in seconds (default: 30, max: 60)",
      minimum: 1,
      maximum: 60,
    }),
  ),
});

export type PythonToolOptions = {
  /** Workspace directory - Python can only access files within this directory */
  workspaceDir: string;
  /** Maximum execution timeout in seconds */
  maxTimeoutSec?: number;
};

/**
 * Generate Python sandbox wrapper code
 * This code runs BEFORE the user code and sets up restrictions
 */
function generateSandboxWrapper(workspaceDir: string): string {
  const escapedWorkspace = workspaceDir.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `
import sys
import builtins

# Workspace restriction
WORKSPACE_DIR = '${escapedWorkspace}'

# Blocked modules
BLOCKED = ${JSON.stringify(Array.from(BLOCKED_MODULES))}
ALLOWED = ${JSON.stringify(Array.from(ALLOWED_MODULES))}

# Store original import
_original_import = builtins.__import__

def _restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
    # Get the base module name
    base_module = name.split('.')[0]

    # Check if module is blocked
    if base_module in BLOCKED or name in BLOCKED:
        raise ImportError(f"Module '{name}' is not allowed in sandbox")

    # Allow only explicitly allowed modules
    if base_module not in ALLOWED and name not in ALLOWED:
        raise ImportError(f"Module '{name}' is not allowed in sandbox. Allowed: {', '.join(sorted(ALLOWED))}")

    return _original_import(name, globals, locals, fromlist, level)

# Replace import
builtins.__import__ = _restricted_import

# Restrict open() to workspace only
_original_open = builtins.open

def _restricted_open(file, mode='r', *args, **kwargs):
    import os.path
    # Resolve to absolute path
    if not os.path.isabs(file):
        file = os.path.join(WORKSPACE_DIR, file)
    file = os.path.normpath(os.path.realpath(file))

    # Check if path is within workspace
    if not file.startswith(WORKSPACE_DIR):
        raise PermissionError(f"Cannot access files outside workspace: {file}")

    # Block write to sensitive files
    filename = os.path.basename(file)
    if filename.startswith('.') and 'w' in mode:
        raise PermissionError(f"Cannot write to hidden files: {filename}")

    return _original_open(file, mode, *args, **kwargs)

builtins.open = _restricted_open

# Remove dangerous builtins
del builtins.__import__
builtins.__import__ = _restricted_import

# Remove exec/eval/compile from accessible scope
_restricted_builtins = {
    'exec': None,
    'eval': None,
    'compile': None,
    '__import__': _restricted_import,
    'open': _restricted_open,
    'input': lambda *args: '',  # Disable input
    'help': lambda *args: 'Help is disabled in sandbox',
    'exit': lambda *args: None,
    'quit': lambda *args: None,
}

for name, replacement in _restricted_builtins.items():
    if replacement is None:
        if hasattr(builtins, name):
            delattr(builtins, name)
    else:
        setattr(builtins, name, replacement)

# Clean up sys.modules to prevent access to pre-imported dangerous modules
_modules_to_remove = [m for m in sys.modules if m.split('.')[0] in BLOCKED]
for m in _modules_to_remove:
    del sys.modules[m]

# Disable sys functions that could be dangerous
sys.exit = lambda *args: None
sys.path = [WORKSPACE_DIR]  # Restrict import path to workspace

# Start user code
# ---USER_CODE_MARKER---
`;
}

/**
 * Validate Python code for obvious security issues before execution
 */
function validatePythonCode(code: string): { valid: boolean; error?: string } {
  // Check for common escape attempts
  const dangerousPatterns = [
    /\bimport\s+os\b/i,
    /\bfrom\s+os\b/i,
    /\bimport\s+subprocess\b/i,
    /\bfrom\s+subprocess\b/i,
    /\bimport\s+sys\b/i,
    /\bfrom\s+sys\b/i,
    /\bimport\s+socket\b/i,
    /\bfrom\s+socket\b/i,
    /\b__import__\s*\(/,
    /\bexec\s*\(/,
    /\beval\s*\(/,
    /\bcompile\s*\(/,
    /\bopen\s*\([^)]*['"]\s*\/(?!\/)/, // Absolute path access
    /\.\.\//, // Parent directory traversal
    /\bbreakpoint\s*\(/,
    /\bgetattr\s*\(\s*__builtins__/,
    /\bsetattr\s*\(\s*__builtins__/,
    /\bdelattr\s*\(\s*__builtins__/,
    /\bglobals\s*\(\s*\)/,
    /\blocals\s*\(\s*\)/,
    /\bvars\s*\(\s*\)/,
    /\bdir\s*\(\s*__/,
    /\b_+[a-z]+_+/i, // Dunder access attempts
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: `Security: Potentially dangerous pattern detected: ${pattern.source}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Execute Python code in a sandboxed environment
 */
async function executePythonSandboxed(
  code: string,
  workspaceDir: string,
  timeoutSec: number,
): Promise<{ success: boolean; output?: string; error?: string }> {
  // Pre-validate code
  const validation = validatePythonCode(code);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Generate sandbox wrapper + user code
  const sandboxCode = generateSandboxWrapper(workspaceDir);
  const fullCode = sandboxCode + "\n" + code;

  return new Promise((resolve) => {
    const pythonPath = process.env.PYTHON_PATH || "/usr/bin/python3";

    // Spawn Python process with restrictions
    const proc = spawn(pythonPath, ["-c", fullCode], {
      cwd: workspaceDir,
      timeout: timeoutSec * 1000,
      env: {
        ...process.env,
        // Minimal environment
        PATH: process.env.PATH,
        HOME: workspaceDir,
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONUNBUFFERED: "1",
        // Disable Python's import cache to prevent escapes
        PYTHONCACHEPREFIX: "/dev/null",
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
      if (stdout.length > 100000) {
        killed = true;
        proc.kill("SIGKILL");
      }
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 50000) {
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
        });
        return;
      }

      if (exitCode !== 0) {
        // Clean up error message - remove sandbox wrapper line numbers
        let cleanError = stderr;
        const match = cleanError.match(/File "<string>", line (\d+)/);
        if (match) {
          const reportedLine = parseInt(match[1], 10);
          const wrapperLines = sandboxCode.split("\n").length;
          const actualLine = reportedLine - wrapperLines;
          if (actualLine > 0) {
            cleanError = cleanError.replace(
              /File "<string>", line \d+/,
              `File "<code>", line ${actualLine}`,
            );
          }
        }

        resolve({
          success: false,
          error: cleanError || `Process exited with code ${exitCode}`,
        });
        return;
      }

      resolve({
        success: true,
        output: stdout || "(no output)",
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: `Failed to execute Python: ${err.message}`,
      });
    });

    // Close stdin immediately
    proc.stdin.end();
  });
}

/**
 * Create the sandboxed Python execution tool
 *
 * @param options Configuration options
 * @returns Agent tool for Python execution
 */
export function createPythonTool(options: PythonToolOptions): AnyAgentTool {
  const { workspaceDir, maxTimeoutSec = 30 } = options;

  return {
    label: "Python (Server Sandbox)",
    name: "python_exec",
    description: `Execute Python on server for batch file editing and text processing.

**WHEN TO USE**:
- Fixing paths/URLs across MULTIPLE files (batch operations)
- Find-and-replace patterns in PHP/JS/CSS/HTML files
- Processing file contents with regex transformations
- When you need to EDIT files programmatically

**WORKFLOW**:
1. Write Python code that opens files, makes changes, and saves them
2. Use open(path, 'w') to write changes back to files
3. Print summary of changes made
4. VERIFY changes were applied (read file again)

**EXAMPLE** - Fix absolute paths to relative:
\`\`\`python
import re
for fname in ['login.php', 'dashboard.php']:
    with open(fname, 'r') as f:
        content = f.read()
    content = re.sub(r'href="/', 'href="', content)
    content = re.sub(r'action="/', 'action="', content)
    with open(fname, 'w') as f:
        f.write(content)
    print(f'Fixed paths in {fname}')
\`\`\`

WORKSPACE: ${workspaceDir}
TIMEOUT: ${maxTimeoutSec}s | NO network | NO system access
ALLOWED: json, math, random, re, datetime, collections, itertools, string, base64, hashlib, csv
BLOCKED: os, subprocess, sys, socket, requests, exec, eval`,
    parameters: PythonExecSchema,
    execute: async (_toolCallId, params) => {
      const code = (params as { code: string; timeout?: number }).code;
      const timeout = Math.min(
        (params as { code: string; timeout?: number }).timeout ?? maxTimeoutSec,
        maxTimeoutSec,
      );

      if (!code || typeof code !== "string") {
        return jsonResult({ error: "Code parameter is required" });
      }

      if (code.length > 50000) {
        return jsonResult({ error: "Code too long (max 50000 characters)" });
      }

      // Verify workspace exists
      if (!existsSync(workspaceDir)) {
        return jsonResult({ error: `Workspace directory does not exist: ${workspaceDir}` });
      }

      try {
        const result = await executePythonSandboxed(code, workspaceDir, timeout);

        if (result.success) {
          return jsonResult({
            success: true,
            output: result.output,
          });
        } else {
          return jsonResult({
            success: false,
            error: result.error,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({
          success: false,
          error: `Python execution failed: ${message}`,
        });
      }
    },
  };
}

/**
 * Convenience function to check if Python is available
 */
export async function isPythonAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonPath = process.env.PYTHON_PATH || "/usr/bin/python3";
    const proc = spawn(pythonPath, ["--version"], {
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
