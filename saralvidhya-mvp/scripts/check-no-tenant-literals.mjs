#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');
const allowlistFile = path.resolve(__dirname, 'tenant-literals.allowlist');

// Forbidden client/tenant literals and browser-dependent storage that should never appear in generic code
const FORBIDDEN_PATTERNS = [
  { pattern: /\bento_131\b/g, name: 'ento_131' },
  { pattern: /['"`]angrau['"`]/gi, name: 'angrau literal' },
  { pattern: /['"`]mlrit['"`]/gi, name: 'mlrit literal' },
  { pattern: /ANGRAU_CHAPTER_CONFIG/g, name: 'ANGRAU_CHAPTER_CONFIG' },
  { pattern: /NGRanga@\d+/g, name: 'hardcoded password' },
  { pattern: /\blocalStorage\b/g, name: 'browser localStorage' },
  { pattern: /\bsessionStorage\b/g, name: 'browser sessionStorage' },
];

// Load allowlist of legacy files currently permitted to contain legacy literals
let allowlist = new Set();
if (fs.existsSync(allowlistFile)) {
  const lines = fs.readFileSync(allowlistFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      allowlist.add(path.normalize(trimmed));
    }
  }
}

function scanDir(dir, errors) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.normalize(path.relative(srcDir, fullPath));

    if (entry.isDirectory()) {
      scanDir(fullPath, errors);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      if (allowlist.has(relPath)) {
        continue; // Permitted under legacy migration allowlist
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Skip comment lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        for (const { pattern, name } of FORBIDDEN_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            errors.push({
              file: relPath,
              line: index + 1,
              matched: name,
              snippet: trimmed.substring(0, 100),
            });
          }
        }
      });
    }
  }
}

const errors = [];
scanDir(srcDir, errors);

if (errors.length > 0) {
  console.error(`\x1b[31m[ERROR] Found ${errors.length} forbidden tenant/client literal(s) in non-allowlisted code:\x1b[0m\n`);
  for (const err of errors) {
    console.error(`  \x1b[33m${err.file}:${err.line}\x1b[0m - Matched \x1b[1m${err.matched}\x1b[0m`);
    console.error(`    > ${err.snippet}\n`);
  }
  console.error(`\x1b[31mAll client-specific data must reside in the Firestore registry and GCS bucket.\x1b[0m`);
  console.error(`If this is an existing legacy file awaiting refactoring, add it to 'scripts/tenant-literals.allowlist'.\n`);
  process.exit(1);
} else {
  console.log(`\x1b[32m[PASS] No forbidden tenant literals found in non-allowlisted files (${allowlist.size} files in allowlist).\x1b[0m`);
}
