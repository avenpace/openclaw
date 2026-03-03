/**
 * Post-build script to fix __exportAll imports in bundled files.
 *
 * tsdown sometimes generates code that imports __exportAll from another chunk,
 * which can cause issues with ESM module resolution in some environments.
 * This script inlines the __exportAll function in files that import it.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const INLINED_EXPORT_ALL = `//#region inlined
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => { let target = {}; for (var name in all) { __defProp(target, name, { get: all[name], enumerable: true }); } if (!no_symbols) { __defProp(target, Symbol.toStringTag, { value: "Module" }); } return target; };
//#endregion
`;

// Pattern to find the __exportAll import specifier within an import statement
// Matches: "ki as __exportAll," or ", ki as __exportAll" or "ki as __exportAll"
const SPECIFIER_PATTERNS = [
  /,\s*ki as __exportAll\b/g,    // ", ki as __exportAll" (when not first)
  /\bki as __exportAll\s*,\s*/g, // "ki as __exportAll, " (when first or middle)
  /\bki as __exportAll\b/g,      // "ki as __exportAll" (when only one, but this shouldn't happen alone)
];

function fixFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');

  if (!content.includes('ki as __exportAll')) {
    return false;
  }

  // Remove just the __exportAll specifier from import statements
  let fixed = content;
  for (const pattern of SPECIFIER_PATTERNS) {
    fixed = fixed.replace(pattern, '');
  }

  // Add inlined __exportAll at the beginning
  fixed = INLINED_EXPORT_ALL + fixed;

  writeFileSync(filePath, fixed);
  return true;
}

function fixDirectory(dir: string, label: string): number {
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));
  let fixedCount = 0;
  for (const file of files) {
    const filePath = join(dir, file);
    if (fixFile(filePath)) {
      console.log(`[fix-exportall] Fixed ${label}/${file}`);
      fixedCount++;
    }
  }
  return fixedCount;
}

function main() {
  const baseDir = join(import.meta.dirname, '..');
  let totalFixed = 0;

  // Fix dist/ directory
  totalFixed += fixDirectory(join(baseDir, 'dist'), 'dist');

  // Fix worker/ directory
  totalFixed += fixDirectory(join(baseDir, 'worker'), 'worker');

  console.log(`[fix-exportall] Done. Fixed ${totalFixed} files.`);
}

main();
