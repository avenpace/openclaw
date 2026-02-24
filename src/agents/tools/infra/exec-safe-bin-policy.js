import { parseExecArgvToken } from "./exec-approvals-analysis.js";
function isPathLikeToken(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }
    if (trimmed === "-") {
        return false;
    }
    if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("~")) {
        return true;
    }
    if (trimmed.startsWith("/")) {
        return true;
    }
    return /^[A-Za-z]:[\\/]/.test(trimmed);
}
function hasGlobToken(value) {
    // Safe bins are stdin-only; globbing is both surprising and a historical bypass vector.
    // Note: we still harden execution-time expansion separately.
    return /[*?[\]]/.test(value);
}
const NO_FLAGS = new Set();
const toFlagSet = (flags) => {
    if (!flags || flags.length === 0) {
        return NO_FLAGS;
    }
    return new Set(flags);
};
function compileSafeBinProfile(fixture) {
    return {
        minPositional: fixture.minPositional,
        maxPositional: fixture.maxPositional,
        allowedValueFlags: toFlagSet(fixture.allowedValueFlags),
        deniedFlags: toFlagSet(fixture.deniedFlags),
    };
}
function compileSafeBinProfiles(fixtures) {
    return Object.fromEntries(Object.entries(fixtures).map(([name, fixture]) => [name, compileSafeBinProfile(fixture)]));
}
export const SAFE_BIN_PROFILE_FIXTURES = {
    jq: {
        maxPositional: 1,
        allowedValueFlags: ["--arg", "--argjson", "--argstr"],
        deniedFlags: [
            "--argfile",
            "--rawfile",
            "--slurpfile",
            "--from-file",
            "--library-path",
            "-L",
            "-f",
        ],
    },
    grep: {
        // Keep grep stdin-only: pattern must come from -e/--regexp.
        // Allowing one positional is ambiguous because -e consumes the pattern and
        // frees the positional slot for a filename.
        maxPositional: 0,
        allowedValueFlags: [
            "--regexp",
            "--max-count",
            "--after-context",
            "--before-context",
            "--context",
            "--devices",
            "--binary-files",
            "--exclude",
            "--include",
            "--label",
            "-e",
            "-m",
            "-A",
            "-B",
            "-C",
            "-D",
        ],
        deniedFlags: [
            "--file",
            "--exclude-from",
            "--dereference-recursive",
            "--directories",
            "--recursive",
            "-f",
            "-d",
            "-r",
            "-R",
        ],
    },
    cut: {
        maxPositional: 0,
        allowedValueFlags: [
            "--bytes",
            "--characters",
            "--fields",
            "--delimiter",
            "--output-delimiter",
            "-b",
            "-c",
            "-f",
            "-d",
        ],
    },
    sort: {
        maxPositional: 0,
        allowedValueFlags: [
            "--key",
            "--field-separator",
            "--buffer-size",
            "--temporary-directory",
            "--parallel",
            "--batch-size",
            "--random-source",
            "-k",
            "-t",
            "-S",
            "-T",
        ],
        // --compress-program can invoke an external executable and breaks stdin-only guarantees.
        deniedFlags: ["--compress-program", "--files0-from", "--output", "-o"],
    },
    uniq: {
        maxPositional: 0,
        allowedValueFlags: [
            "--skip-fields",
            "--skip-chars",
            "--check-chars",
            "--group",
            "-f",
            "-s",
            "-w",
        ],
    },
    head: {
        maxPositional: 0,
        allowedValueFlags: ["--lines", "--bytes", "-n", "-c"],
    },
    tail: {
        maxPositional: 0,
        allowedValueFlags: [
            "--lines",
            "--bytes",
            "--sleep-interval",
            "--max-unchanged-stats",
            "--pid",
            "-n",
            "-c",
        ],
    },
    tr: {
        minPositional: 1,
        maxPositional: 2,
    },
    wc: {
        maxPositional: 0,
        deniedFlags: ["--files0-from"],
    },
};
export const SAFE_BIN_PROFILES = compileSafeBinProfiles(SAFE_BIN_PROFILE_FIXTURES);
function normalizeSafeBinProfileName(raw) {
    const name = raw.trim().toLowerCase();
    return name.length > 0 ? name : null;
}
function normalizeFixtureLimit(raw) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
        return undefined;
    }
    const next = Math.trunc(raw);
    return next >= 0 ? next : undefined;
}
function normalizeFixtureFlags(flags) {
    if (!Array.isArray(flags) || flags.length === 0) {
        return undefined;
    }
    const normalized = Array.from(new Set(flags.map((flag) => flag.trim()).filter((flag) => flag.length > 0))).toSorted((a, b) => a.localeCompare(b));
    return normalized.length > 0 ? normalized : undefined;
}
function normalizeSafeBinProfileFixture(fixture) {
    const minPositional = normalizeFixtureLimit(fixture.minPositional);
    const maxPositionalRaw = normalizeFixtureLimit(fixture.maxPositional);
    const maxPositional = minPositional !== undefined &&
        maxPositionalRaw !== undefined &&
        maxPositionalRaw < minPositional
        ? minPositional
        : maxPositionalRaw;
    return {
        minPositional,
        maxPositional,
        allowedValueFlags: normalizeFixtureFlags(fixture.allowedValueFlags),
        deniedFlags: normalizeFixtureFlags(fixture.deniedFlags),
    };
}
export function normalizeSafeBinProfileFixtures(fixtures) {
    const normalized = {};
    if (!fixtures) {
        return normalized;
    }
    for (const [rawName, fixture] of Object.entries(fixtures)) {
        const name = normalizeSafeBinProfileName(rawName);
        if (!name) {
            continue;
        }
        normalized[name] = normalizeSafeBinProfileFixture(fixture);
    }
    return normalized;
}
export function resolveSafeBinProfiles(fixtures) {
    const normalizedFixtures = normalizeSafeBinProfileFixtures(fixtures);
    if (Object.keys(normalizedFixtures).length === 0) {
        return SAFE_BIN_PROFILES;
    }
    return {
        ...SAFE_BIN_PROFILES,
        ...compileSafeBinProfiles(normalizedFixtures),
    };
}
export function resolveSafeBinDeniedFlags(fixtures = SAFE_BIN_PROFILE_FIXTURES) {
    const out = {};
    for (const [name, fixture] of Object.entries(fixtures)) {
        const denied = Array.from(new Set(fixture.deniedFlags ?? [])).toSorted();
        if (denied.length > 0) {
            out[name] = denied;
        }
    }
    return out;
}
export function renderSafeBinDeniedFlagsDocBullets(fixtures = SAFE_BIN_PROFILE_FIXTURES) {
    const deniedByBin = resolveSafeBinDeniedFlags(fixtures);
    const bins = Object.keys(deniedByBin).toSorted();
    return bins
        .map((bin) => `- \`${bin}\`: ${deniedByBin[bin].map((flag) => `\`${flag}\``).join(", ")}`)
        .join("\n");
}
function isSafeLiteralToken(value) {
    if (!value || value === "-") {
        return true;
    }
    return !hasGlobToken(value) && !isPathLikeToken(value);
}
function isInvalidValueToken(value) {
    return !value || !isSafeLiteralToken(value);
}
function consumeLongOptionToken(args, index, flag, inlineValue, allowedValueFlags, deniedFlags) {
    if (deniedFlags.has(flag)) {
        return -1;
    }
    if (inlineValue !== undefined) {
        return isSafeLiteralToken(inlineValue) ? index + 1 : -1;
    }
    if (!allowedValueFlags.has(flag)) {
        return index + 1;
    }
    return isInvalidValueToken(args[index + 1]) ? -1 : index + 2;
}
function consumeShortOptionClusterToken(args, index, raw, cluster, flags, allowedValueFlags, deniedFlags) {
    for (let j = 0; j < flags.length; j += 1) {
        const flag = flags[j];
        if (deniedFlags.has(flag)) {
            return -1;
        }
        if (!allowedValueFlags.has(flag)) {
            continue;
        }
        const inlineValue = cluster.slice(j + 1);
        if (inlineValue) {
            return isSafeLiteralToken(inlineValue) ? index + 1 : -1;
        }
        return isInvalidValueToken(args[index + 1]) ? -1 : index + 2;
    }
    return hasGlobToken(raw) ? -1 : index + 1;
}
function consumePositionalToken(token, positional) {
    if (!isSafeLiteralToken(token)) {
        return false;
    }
    positional.push(token);
    return true;
}
function validatePositionalCount(positional, profile) {
    const minPositional = profile.minPositional ?? 0;
    if (positional.length < minPositional) {
        return false;
    }
    return typeof profile.maxPositional !== "number" || positional.length <= profile.maxPositional;
}
export function validateSafeBinArgv(args, profile) {
    const allowedValueFlags = profile.allowedValueFlags ?? NO_FLAGS;
    const deniedFlags = profile.deniedFlags ?? NO_FLAGS;
    const positional = [];
    let i = 0;
    while (i < args.length) {
        const rawToken = args[i] ?? "";
        const token = parseExecArgvToken(rawToken);
        if (token.kind === "empty" || token.kind === "stdin") {
            i += 1;
            continue;
        }
        if (token.kind === "terminator") {
            for (let j = i + 1; j < args.length; j += 1) {
                const rest = args[j];
                if (!rest || rest === "-") {
                    continue;
                }
                if (!consumePositionalToken(rest, positional)) {
                    return false;
                }
            }
            break;
        }
        if (token.kind === "positional") {
            if (!consumePositionalToken(token.raw, positional)) {
                return false;
            }
            i += 1;
            continue;
        }
        if (token.style === "long") {
            const nextIndex = consumeLongOptionToken(args, i, token.flag, token.inlineValue, allowedValueFlags, deniedFlags);
            if (nextIndex < 0) {
                return false;
            }
            i = nextIndex;
            continue;
        }
        const nextIndex = consumeShortOptionClusterToken(args, i, token.raw, token.cluster, token.flags, allowedValueFlags, deniedFlags);
        if (nextIndex < 0) {
            return false;
        }
        i = nextIndex;
    }
    return validatePositionalCount(positional, profile);
}
//# sourceMappingURL=exec-safe-bin-policy.js.map