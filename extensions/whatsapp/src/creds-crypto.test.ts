import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { useClawkuMultiFileAuthState } from "./creds-auth-state.js";
import {
  isSealed,
  openForDir,
  registerWhatsAppAuthKeys,
  sealForDir,
  SEALED_PREFIX,
} from "./creds-crypto.js";
import { readWebCredsJsonRaw, readWebCredsJsonRawSync } from "./creds-files.js";
import { writeWebCredsRawAtomically } from "./creds-persistence.js";

const dir = () => mkdtempSync(path.join(tmpdir(), "wa-seal-"));

describe("WhatsApp credentials at rest (Clawku)", () => {
  it("seals and opens with the registered key; a folder without a key stays plain", () => {
    const a = dir();
    const b = dir();
    registerWhatsAppAuthKeys(a, [randomBytes(32)]);
    const sealed = sealForDir(a, '{"x":1}');
    expect(isSealed(sealed)).toBe(true);
    expect(sealed).not.toContain('"x"');
    expect(openForDir(a, sealed)).toBe('{"x":1}');
    expect(sealForDir(b, '{"x":1}')).toBe('{"x":1}');
    expect(openForDir(b, '{"plain":true}')).toBe('{"plain":true}');
  });

  it("opens with the previous key during a rotation, and refuses a sealed file with no key", () => {
    const a = dir();
    const oldKey = randomBytes(32);
    registerWhatsAppAuthKeys(a, [oldKey]);
    const sealedOld = sealForDir(a, "secret");
    registerWhatsAppAuthKeys(a, [randomBytes(32), oldKey]);
    expect(openForDir(a, sealedOld)).toBe("secret");
    const c = dir();
    expect(() => openForDir(c, sealedOld)).toThrow(/No registered key/);
  });

  it("an existing plain session keeps working and is sealed as it is written", async () => {
    const a = dir();
    // A session saved before encryption existed: plain creds and a signal key.
    writeFileSync(
      path.join(a, "creds.json"),
      JSON.stringify({ me: { id: "6281200000001:3@s.whatsapp.net" }, registered: true }),
    );
    writeFileSync(
      path.join(a, "pre-key-1.json"),
      JSON.stringify({ public: "AAA", private: "BBB" }),
    );
    registerWhatsAppAuthKeys(a, [randomBytes(32)]);
    const { state, saveCreds } = await useClawkuMultiFileAuthState(a);
    expect((state.creds as any).me.id).toBe("6281200000001:3@s.whatsapp.net");
    expect((await state.keys.get("pre-key", ["1"]))["1"]).toEqual({
      public: "AAA",
      private: "BBB",
    });
    await saveCreds();
    await state.keys.set({ "pre-key": { "2": { public: "CCC", private: "DDD" } as any } });
    for (const f of ["creds.json", "pre-key-2.json"])
      expect(readFileSync(path.join(a, f), "utf-8").startsWith(SEALED_PREFIX)).toBe(true);
    // Reopened from disk, the sealed files read back the same.
    const again = await useClawkuMultiFileAuthState(a);
    expect((again.state.creds as any).me.id).toBe("6281200000001:3@s.whatsapp.net");
    expect((await again.state.keys.get("pre-key", ["2"]))["2"]).toEqual({
      public: "CCC",
      private: "DDD",
    });
    // The extension's own readers see plain JSON.
    expect(JSON.parse(readWebCredsJsonRawSync(path.join(a, "creds.json"))!).registered).toBe(true);
    expect(JSON.parse((await readWebCredsJsonRaw(path.join(a, "creds.json")))!).registered).toBe(
      true,
    );
  });

  it("a sealed creds.json nobody can open is an error, never fresh creds over the real session", async () => {
    const a = dir();
    registerWhatsAppAuthKeys(a, [randomBytes(32)]);
    writeFileSync(path.join(a, "creds.json"), sealForDir(a, JSON.stringify({ registered: true })));
    const other = dir();
    writeFileSync(path.join(other, "creds.json"), readFileSync(path.join(a, "creds.json")));
    await expect(useClawkuMultiFileAuthState(other)).rejects.toThrow(/No registered key/);
    expect(readFileSync(path.join(other, "creds.json"), "utf-8").startsWith(SEALED_PREFIX)).toBe(
      true,
    );
    expect(readWebCredsJsonRawSync(path.join(other, "creds.json"))).toBeNull();
  });

  it("raw writes (creds, backups, restores) are sealed too", async () => {
    const a = dir();
    registerWhatsAppAuthKeys(a, [randomBytes(32)]);
    await writeWebCredsRawAtomically({
      filePath: path.join(a, "creds.json.bak"),
      content: '{"b":1}',
      tempPrefix: ".t",
    });
    expect(readFileSync(path.join(a, "creds.json.bak"), "utf-8").startsWith(SEALED_PREFIX)).toBe(
      true,
    );
    expect(readWebCredsJsonRawSync(path.join(a, "creds.json.bak"))).toBe('{"b":1}');
    expect(readdirSync(a).filter((n) => n.startsWith(".t"))).toEqual([]);
  });
});
