import path from "node:path";
import type { ExecCommandAnalysis, ExecCommandSegment } from "./exec-command-analysis-types.js";
// Shared exec approval analysis types and Windows-only shell enforcement helpers.
import { rebuildWindowsShellCommandFromSource, windowsEscapeArg } from "./windows-shell-command.js";
import { splitShellArgs } from "../utils/shell-argv.js";
import { analyzeArgvCommand } from "./exec-argv-analysis.js";

export { analyzeArgvCommand };

export {
  matchAllowlist,
  parseExecArgvToken,
  buildHashedArgPatternFromArgv,
  resolveAllowlistCandidatePath,
  resolveApprovalAuditCandidatePath,
  resolveApprovalAuditTrustPath,
  resolveCommandResolution,
  resolveCommandResolutionFromArgv,
  resolveExecutionTargetCandidatePath,
  resolveExecutionTargetResolution,
  resolveExecutionTargetTrustPath,
  resolvePolicyAllowlistCandidatePath,
  resolvePolicyTargetCandidatePath,
  resolvePolicyTargetResolution,
  resolvePolicyTargetTrustPath,
  resolveExecutableTrustPath,
  type CommandResolution,
  type ExecutableResolution,
  type ExecArgvToken,
} from "./exec-command-resolution.js";

export {
  analyzeWindowsShellCommand,
  isWindowsPlatform,
  tokenizeWindowsSegment,
  windowsEscapeArg,
} from "./windows-shell-command.js";
export type {
  ExecCommandAnalysis,
  ExecCommandSegment,
  ShellChainOperator,
} from "./exec-command-analysis-types.js";

function renderWindowsQuotedArgv(argv: readonly string[]):
  | { ok: true; rendered: string }
  | {
      ok: false;
      reason: string;
    } {
  const parts: string[] = [];
  for (const token of argv) {
    const result = windowsEscapeArg(token);
    if (!result.ok) {
      return { ok: false, reason: `unsafe windows token: ${token}` };
    }
    parts.push(result.escaped);
  }
  return { ok: true, rendered: parts.join(" ") };
}

export function resolvePlannedSegmentArgv(segment: ExecCommandSegment): string[] | null {
  if (segment.resolution?.policyBlocked === true) {
    return null;
  }
  const baseArgv =
    segment.resolution?.effectiveArgv && segment.resolution.effectiveArgv.length > 0
      ? segment.resolution.effectiveArgv
      : segment.argv;
  if (baseArgv.length === 0) {
    return null;
  }
  const argv = [...baseArgv];
  const execution = segment.resolution?.execution;
  const resolvedExecutable =
    execution?.resolvedRealPath?.trim() ?? execution?.resolvedPath?.trim() ?? "";
  if (resolvedExecutable) {
    argv[0] = resolvedExecutable;
  }
  return argv;
}

export function buildEnforcedShellCommand(params: {
  command: string;
  segments: ExecCommandSegment[];
  platform?: string | null;
}): { ok: boolean; command?: string; reason?: string } {
  if (params.platform !== "win32") {
    return { ok: false, reason: "unsupported platform" };
  }

  const rebuilt = rebuildWindowsShellCommandFromSource({
    command: params.command,
    renderSegment: (_raw, segmentIndex) => {
      const segment = params.segments[segmentIndex];
      if (!segment) {
        return { ok: false, reason: "segment mapping failed" };
      }
      const argv = resolvePlannedSegmentArgv(segment);
      if (!argv) {
        return { ok: false, reason: "segment execution plan unavailable" };
      }
      return renderWindowsQuotedArgv(argv);
    },
  });
  if (!rebuilt.ok) {
    return { ok: false, reason: rebuilt.reason };
  }
  if (rebuilt.segmentCount !== params.segments.length) {
    return { ok: false, reason: "segment count mismatch" };
  }
  return { ok: true, command: rebuilt.command };
}

/**
 * Safe binaries that can be executed locally for external channel requests
 * (e.g., skills triggered from WhatsApp/Telegram) without requiring device pairing.
 * These are read-only or data-processing commands that don't modify the system.
 */
export const EXTERNAL_CHANNEL_SAFE_BINS = [
  "curl",
  "wget",
  "jq",
  "cut",
  "head",
  "tail",
  "tr",
  "wc",
  "sort",
  "uniq",
  "grep",
  "awk",
  "sed",
  "cat",
  "echo",
  "date",
  "basename",
  "dirname",
  "base64",
  "file",
  "xxd",
  "od",
  "hexdump",
  "strings",
  "pdftotext",
  "pdfinfo",
  // File operations for workspace management (website-builder, etc.)
  // These require path validation via WORKSPACE_RESTRICTED_BINS
  "mkdir",
  "ls",
  "pwd",
  "touch",
  "cp",
  "mv",
  "rm",
  "find", // requires special handling - path validation + block -exec/-execdir
  // PHP for server-side execution (website-builder tests, etc.)
  // Script path is validated via WORKSPACE_RESTRICTED_BINS
  "php",
  // SQLite for database operations (website-builder uses SQLite)
  "sqlite3",
];

/**
 * Commands that modify filesystem and require workspace path validation.
 * All path arguments must be within the agent's workspace directory.
 */
export const WORKSPACE_RESTRICTED_BINS = new Set([
  "mkdir",
  "touch",
  "cp",
  "mv",
  "rm",
  "ls", // read-only but still restricted to workspace
  "find", // requires special handling in validateWorkspacePaths
  "php", // script path must be within workspace
]);

/**
 * Dangerous find flags that execute commands - must be blocked for security.
 */
const FIND_DANGEROUS_FLAGS = new Set(["-exec", "-execdir", "-ok", "-okdir"]);

/**
 * Validate that all path arguments in a command are within the workspace.
 * Returns { ok: true } if valid, { ok: false, reason: string } if invalid.
 */
export function validateWorkspacePaths(params: {
  argv: string[];
  workspaceRoot: string;
}): { ok: true } | { ok: false; reason: string } {
  const { argv, workspaceRoot } = params;
  if (argv.length === 0) {
    return { ok: true };
  }

  const cmd = argv[0]?.toLowerCase() ?? "";
  if (!WORKSPACE_RESTRICTED_BINS.has(cmd)) {
    return { ok: true };
  }

  const pathModule = path;
  const normalizedRoot = pathModule.resolve(workspaceRoot);

  // Special handling for 'find' command
  if (cmd === "find") {
    return validateFindCommand({ argv, workspaceRoot, normalizedRoot, pathModule });
  }

  // Check each argument (skip flags starting with -)
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg || arg.startsWith("-")) {
      continue;
    }

    const pathCheck = validateSinglePath({ arg, workspaceRoot, normalizedRoot, pathModule });
    if (!pathCheck.ok) {
      return pathCheck;
    }
  }

  return { ok: true };
}

/**
 * Validate a single path argument is within workspace.
 */
function validateSinglePath(params: {
  arg: string;
  workspaceRoot: string;
  normalizedRoot: string;
  pathModule: typeof import("node:path");
}): { ok: true } | { ok: false; reason: string } {
  const { arg, workspaceRoot, normalizedRoot, pathModule } = params;

  // Expand ~ to workspace root (not actual home)
  let resolvedPath = arg;
  if (arg === "~" || arg.startsWith("~/")) {
    resolvedPath = pathModule.join(workspaceRoot, arg.slice(1) || "");
  } else if (!pathModule.isAbsolute(arg)) {
    // Relative paths are resolved from workspace root
    resolvedPath = pathModule.join(workspaceRoot, arg);
  }

  // Normalize and check for path traversal
  const normalized = pathModule.resolve(resolvedPath);

  // Check if path is within workspace
  if (!normalized.startsWith(normalizedRoot + pathModule.sep) && normalized !== normalizedRoot) {
    // Check for path traversal patterns
    if (arg.includes("..") || normalized.includes("..")) {
      return {
        ok: false,
        reason: `Path traversal detected: "${arg}" - access outside workspace is not allowed`,
      };
    }
    return {
      ok: false,
      reason: `Path "${arg}" is outside workspace. File operations are restricted to your workspace directory.`,
    };
  }

  return { ok: true };
}

/**
 * Special validation for 'find' command:
 * - Only validates the search path (first positional arg before any flags)
 * - Blocks dangerous flags like -exec, -execdir, -ok, -okdir
 */
function validateFindCommand(params: {
  argv: string[];
  workspaceRoot: string;
  normalizedRoot: string;
  pathModule: typeof import("node:path");
}): { ok: true } | { ok: false; reason: string } {
  const { argv, workspaceRoot, normalizedRoot, pathModule } = params;

  // Check for dangerous flags first
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]?.toLowerCase() ?? "";
    if (FIND_DANGEROUS_FLAGS.has(arg)) {
      return {
        ok: false,
        reason: `The "${argv[i]}" flag is not allowed with find for security reasons. Use find predicates like -name, -type, -printf instead.`,
      };
    }
  }

  // For find, the search path(s) come before any flags (args starting with -)
  // find [path...] [expression]
  // We validate all path arguments (everything before the first flag)
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }

    // Once we hit a flag, stop checking for paths
    if (arg.startsWith("-") || arg === "(" || arg === ")" || arg === "!" || arg === ",") {
      break;
    }

    const pathCheck = validateSinglePath({ arg, workspaceRoot, normalizedRoot, pathModule });
    if (!pathCheck.ok) {
      return pathCheck;
    }
  }

  return { ok: true };
}


// Clawku: shell control operators that separate independent commands. Used to split a
// shell command into per-command segments for external-channel safe-command routing.
const CLAWKU_SHELL_CONTROL_OPERATORS = new Set(["|", "||", "&&", ";", "&", "|&", "\n"]);

/**
 * Clawku: analyze a shell command string into command segments for external-channel
 * safe-command routing (see EXTERNAL_CHANNEL_SAFE_BINS). FAIL-CLOSED — returns
 * { ok: false } whenever the command uses command/process substitution or cannot be
 * cleanly tokenized, so the caller treats it as unsafe and routes it to the user's
 * paired device instead of running arbitrary code on the shared server. Reuses the
 * quote-aware tokenizer (splitShellArgs) and the argv resolver (analyzeArgvCommand),
 * so it does not reimplement command resolution.
 */
export function analyzeShellCommand(params: {
  command: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}): ExecCommandAnalysis {
  const command = params.command ?? "";
  // Reject constructs that can hide an executable inside an otherwise-safe command
  // (command substitution `$(...)`/backticks, process substitution `<(...)`/`>(...)`).
  if (/\$\(|`|<\(|>\(/.test(command)) {
    return { ok: false, reason: "command substitution is not allowed on external channels", segments: [] };
  }
  const tokens = splitShellArgs(command);
  if (!tokens || tokens.length === 0) {
    return { ok: false, reason: "unable to parse shell command", segments: [] };
  }
  // Group tokens into independent sub-commands split on shell control operators.
  const subArgvs: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (CLAWKU_SHELL_CONTROL_OPERATORS.has(token)) {
      if (current.length > 0) {
        subArgvs.push(current);
      }
      current = [];
      continue;
    }
    current.push(token);
  }
  if (current.length > 0) {
    subArgvs.push(current);
  }
  if (subArgvs.length === 0) {
    return { ok: false, reason: "no command segments", segments: [] };
  }
  const segments: ExecCommandSegment[] = [];
  for (const argv of subArgvs) {
    // Skip leading VAR=value environment assignments to reach the executable token.
    let idx = 0;
    while (idx < argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[idx] ?? "")) {
      idx += 1;
    }
    const effectiveArgv = argv.slice(idx);
    if (effectiveArgv.length === 0) {
      return { ok: false, reason: "empty command segment", segments: [] };
    }
    const analysis = analyzeArgvCommand({ argv: effectiveArgv, cwd: params.cwd, env: params.env });
    if (!analysis.ok || analysis.segments.length === 0) {
      return { ok: false, reason: analysis.reason ?? "unable to resolve command segment", segments: [] };
    }
    segments.push(...analysis.segments);
  }
  return { ok: true, segments };
}
