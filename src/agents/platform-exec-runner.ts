/**
 * Clawku: the host's sandbox runner for exec.
 *
 * Registered once per process by the embedding host. A run opts in with plain data
 * (`execOverrides.platformSandbox`) rather than a function, because run authority is
 * structured-cloned (reply-tool-authority) and functions cannot cross that boundary.
 */
export type PlatformSandboxContext = {
  userRoot: string;
  defaultCwd: string;
  personaId?: string;
  /** Route commands the sandbox does not run to the owner's paired device. */
  deviceFallback?: boolean;
  channel?: string;
  senderId?: string;
  sessionKey?: string;
  requestedBy?: string;
};

export type PlatformExecRunner = (
  context: PlatformSandboxContext,
  params: { command: string; workdir?: string; timeoutSec?: number },
) => Promise<{ output: string; exitCode: number; durationMs: number; timedOut?: boolean }>;

let runner: PlatformExecRunner | undefined;

export function setPlatformExecRunner(next: PlatformExecRunner | undefined): void {
  runner = next;
}

export function getPlatformExecRunner(): PlatformExecRunner | undefined {
  return runner;
}
