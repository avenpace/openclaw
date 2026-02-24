import fs from "node:fs";
const OPEN_READ_FLAGS = fs.constants.O_RDONLY |
    (typeof fs.constants.O_NOFOLLOW === "number" ? fs.constants.O_NOFOLLOW : 0);
function isExpectedPathError(error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    return code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP";
}
export function sameFileIdentity(left, right) {
    return left.dev === right.dev && left.ino === right.ino;
}
export function openVerifiedFileSync(params) {
    let fd = null;
    try {
        if (params.rejectPathSymlink) {
            const candidateStat = fs.lstatSync(params.filePath);
            if (candidateStat.isSymbolicLink()) {
                return { ok: false, reason: "validation" };
            }
        }
        const realPath = params.resolvedPath ?? fs.realpathSync(params.filePath);
        const preOpenStat = fs.lstatSync(realPath);
        if (!preOpenStat.isFile()) {
            return { ok: false, reason: "validation" };
        }
        if (params.maxBytes !== undefined && preOpenStat.size > params.maxBytes) {
            return { ok: false, reason: "validation" };
        }
        fd = fs.openSync(realPath, OPEN_READ_FLAGS);
        const openedStat = fs.fstatSync(fd);
        if (!openedStat.isFile()) {
            return { ok: false, reason: "validation" };
        }
        if (params.maxBytes !== undefined && openedStat.size > params.maxBytes) {
            return { ok: false, reason: "validation" };
        }
        if (!sameFileIdentity(preOpenStat, openedStat)) {
            return { ok: false, reason: "validation" };
        }
        const opened = { ok: true, path: realPath, fd, stat: openedStat };
        fd = null;
        return opened;
    }
    catch (error) {
        if (isExpectedPathError(error)) {
            return { ok: false, reason: "path", error };
        }
        return { ok: false, reason: "io", error };
    }
    finally {
        if (fd !== null) {
            fs.closeSync(fd);
        }
    }
}
//# sourceMappingURL=safe-open-sync.js.map