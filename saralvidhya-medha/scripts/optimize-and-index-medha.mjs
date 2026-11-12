/**
 * Extracts inline base64 data:image/* URIs (> 2 KB) from .md and .json files in
 * public/generated_resources into standalone image files under _inline_assets/,
 * and generates public/generated_resources/file-index.json for O(1) path existence checks.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('public/generated_resources');
const DATA_URI_GLOBAL = /data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)/g;

let extractedImages = 0;
let savedBytes = 0;
let modifiedFiles = 0;

function optimizeFile(fullPath) {
  const stat = fs.statSync(fullPath);
  if (stat.size < 32 * 1024) return; // Skip small files (< 32 KB)
  const raw = fs.readFileSync(fullPath, 'utf8');
  if (!raw.includes('data:image/')) return;

  const dir = path.dirname(fullPath);
  const inlineDir = path.join(dir, '_inline_assets');
  let changed = false;

  const updated = raw.replace(DATA_URI_GLOBAL, (match, subtype, b64) => {
    const cleanB64 = b64.replace(/\s+/g, '');
    if (cleanB64.length < 2048) return match;
    const ext = subtype === 'jpeg' ? 'jpg' : subtype;
    const hash = crypto.createHash('sha1').update(cleanB64).digest('hex').slice(0, 16);
    const fileName = `inline_${hash}.${ext}`;
    fs.mkdirSync(inlineDir, { recursive: true });
    const outPath = path.join(inlineDir, fileName);
    if (!fs.existsSync(outPath)) {
      fs.writeFileSync(outPath, Buffer.from(cleanB64, 'base64'));
      extractedImages++;
    }
    savedBytes += match.length;
    changed = true;
    return `_inline_assets/${fileName}`;
  });

  if (changed) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    modifiedFiles++;
  }
}

const allRelPaths = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.md' || ext === '.json') {
        optimizeFile(full);
      }
    }
  }
}

function collectIndex(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectIndex(full);
    } else if (entry.isFile()) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (rel !== 'file-index.json') {
        allRelPaths.push(rel);
      }
    }
  }
}

walk(ROOT);
collectIndex(ROOT);
allRelPaths.sort();

const indexPayload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: allRelPaths.length,
  files: allRelPaths,
};

fs.writeFileSync(
  path.join(ROOT, 'file-index.json'),
  JSON.stringify(indexPayload),
  'utf8'
);

console.log(
  `[DONE] Modified ${modifiedFiles} files, extracted ${extractedImages} inline images, saved ${(
    savedBytes /
    (1024 * 1024)
  ).toFixed(2)} MB of inline base64 text. Indexed ${allRelPaths.length} files.`
);
