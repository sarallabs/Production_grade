#!/usr/bin/env node
/**
 * Imports per-video generated asset bundles into public/generated_resources.
 *
 * The generation pipeline emits one zip per video, each containing a complete
 * chapter-shaped tree (Learn/ + Prepare/ + Examination/). The bundles are not
 * consistent with each other, so a straight extract is not enough — see
 * NORMALIZATIONS below.
 *
 * Usage:
 *   node scripts/import-video-assets.cjs [--from <dir>] [--dry-run] [--keep-legacy]
 *
 *   --from         directory holding the zips (default: %USERPROFILE%/Downloads)
 *   --dry-run      report what would happen, write nothing
 *   --keep-legacy  keep the superseded chapter-root Learn/Prepare/Examination
 *
 * NORMALIZATIONS applied per bundle:
 *   1. `_backups/` is never extracted — byte-identical duplicates, ~half the payload.
 *   2. `Learn/MindMaps` -> `Learn/Mindmaps`. Video 3 capitalises it, Videos 1-2
 *      don't. Cloudflare Pages serves case-sensitively and contentRepository
 *      resolves `Learn/Mindmaps`, so the odd one out would 404 in production
 *      while working fine on a case-insensitive dev box.
 *   3. Markdown link targets containing `MindMaps/` are rewritten to `Mindmaps/`.
 *      Video 3's flashcards reference infographics via `../MindMaps/...`, which
 *      rename (2) would otherwise break.
 *   4. `Prepare/Mock_Test/mock_test_chapter_*.md` -> `mock_test.md`. Video 3
 *      ships `_chapter_3`, the others `_chapter_1`; one stable name keeps the
 *      resolver from having to guess.
 *   5. Drops `Learn/Mindmaps/generated_infographics.zip` (Video 2 — the loose
 *      files are already extracted alongside it) and `Examination/
 *      examiner_interface.html` (Video 1 — never referenced by the app).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const CHAPTER_DIR = path.join(
  REPO_ROOT,
  'public/generated_resources/Nagarjuna_University/MBA/chapter_1',
);

/**
 * `topics` are the top-level branches of each bundle's own mindmap.md, so the
 * video cards describe what the video actually covers instead of the generic
 * placeholder bullets that were previously hardcoded in VideosView.
 *
 * `ytId` is seeded with the IDs VideosView used to hardcode so nothing breaks
 * today — replace them with the real lecture IDs when those are published.
 */
const BUNDLES = [
  {
    zip: 'importance_and_scope_of_marketing Video 1.zip',
    zipRoot: 'importance_and_scope_of_marketing Video 1',
    dir: 'video_1_importance_and_scope_of_marketing',
    index: 1,
    id: 'importance_and_scope',
    title: 'Importance and Scope of Marketing',
    ytId: 'SwcmRNZhlyo',
    topics: [
      'Introduction to Marketing',
      'The Nine Elements of Marketing',
      'The Evolution of Marketing Concepts',
      'Marketing Management Tasks',
      'The Marketing Environment',
      'Customer Value',
      'Industrial (B2B) Marketing',
    ],
  },
  {
    zip: 'Service Marketing Video 2.zip',
    zipRoot: 'Service Marketing Video 2',
    dir: 'video_2_service_marketing',
    index: 2,
    id: 'service_marketing',
    title: 'Service Marketing',
    ytId: 'zudAdjtoraA',
    topics: [
      'Introduction & Economic Context',
      'The Uber Case Study',
      'The Six Characteristics of Services',
      'The Extended Seven Ps Framework',
      'Service Excellence',
    ],
  },
  {
    zip: 'Global Marketing Video 3.zip',
    zipRoot: 'Global Marketing Video 3',
    dir: 'video_3_global_marketing',
    index: 3,
    id: 'global_marketing',
    title: 'Global Marketing',
    ytId: 'LEfMH2SNznY',
    // Video 3 is the only bundle that capitalises MindMaps. It cannot be fixed
    // by renaming after extraction: the infographic tree underneath reaches 279
    // characters, past MAX_PATH, and Windows refuses to rename the parent
    // directory even with LongPathsEnabled. Extracting the subtree straight into
    // the corrected path sidesteps the rename entirely.
    extractAs: [['Learn/MindMaps', 'Learn/Mindmaps']],
    topics: [
      'Definitions & Concepts',
      'Strategy Dilemma',
      'Case Studies',
      'Foundational Benefits',
      'Critical Challenges',
    ],
  },
];

/** Superseded by the per-video trees — removed unless --keep-legacy. */
const LEGACY_CHAPTER_DIRS = ['Learn', 'Prepare', 'Examination', 'extracted_images'];

const DROP_FILES = [
  'Learn/Mindmaps/generated_infographics.zip',
  'Examination/examiner_interface.html',
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const KEEP_LEGACY = args.includes('--keep-legacy');
const fromIdx = args.indexOf('--from');
const SOURCE_DIR =
  fromIdx !== -1 && args[fromIdx + 1]
    ? path.resolve(args[fromIdx + 1])
    : path.join(os.homedir(), 'Downloads');

const log = (...a) => console.log(...a);
const step = (msg) => log(`${DRY_RUN ? '[dry-run] ' : ''}${msg}`);

/**
 * Windows ships bsdtar (libarchive) at System32/tar.exe, which reads zip
 * archives. A bare `tar` on PATH may instead resolve to the GNU tar bundled
 * with Git for Windows, which cannot read zips at all and additionally parses
 * `C:\...` as a remote `host:path`. Pin the system binary when it is there.
 */
function resolveTar() {
  if (process.platform === 'win32') {
    const sysTar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
    if (fs.existsSync(sysTar)) return sysTar;
  }
  return 'tar';
}

const TAR_BIN = resolveTar();

function rmrf(target) {
  if (!fs.existsSync(target)) return false;
  // `maxRetries` covers a watcher (a running dev server, an indexer) briefly
  // holding a handle inside the tree.
  if (!DRY_RUN) fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  return true;
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function dirSizeMb(dir) {
  const total = walkFiles(dir).reduce((sum, f) => sum + fs.statSync(f).size, 0);
  return (total / (1024 * 1024)).toFixed(1);
}

/**
 * Web-safe form of a single path segment.
 *
 * Names that are already safe are returned untouched — this is what keeps the
 * rename pass and the markdown-rewrite pass in agreement, and stops `Learn` or
 * `Flashcards` from being lowercased into a broken path.
 *
 * Slugging matters because the generator emits infographic folders like
 * `1. Definition & Concept/Leaf Nodes/`, whose markdown references arrive
 * percent-encoded as `1.%20Definition%20%26%20Concept`. Whether a static host
 * decodes that back to the real directory varies by host — the dev server does
 * not — so the safe move is to remove the characters entirely.
 */
function slugSegment(name) {
  if (/^[A-Za-z0-9._-]+$/.test(name)) return name;
  // Only split off something that actually looks like a file extension.
  // `path.extname` would treat the whole of "5. Critical Challenges" as one,
  // leaving the spaces in place.
  const extMatch = name.match(/\.[A-Za-z0-9]{1,8}$/);
  const ext = extMatch ? extMatch[0] : '';
  const base = ext ? name.slice(0, -ext.length) : name;
  const slug = base
    .replace(/&/g, ' and ')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/\._/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return `${slug}${ext.toLowerCase()}`;
}

/** Renames every unsafe file and directory under `root`, deepest first. */
function slugifyTree(root) {
  let renamed = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
    }
    // Rename after descending, so child paths stay valid while walking.
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const slug = slugSegment(entry.name);
      if (slug === entry.name) continue;
      renameSyncWithRetry(path.join(dir, entry.name), path.join(dir, slug));
      renamed++;
    }
  };
  walk(root);
  return renamed;
}

/** Applies the same slug rules to a markdown link target. */
function slugifyHref(href) {
  if (/^[a-z]+:/i.test(href) || href.startsWith('/')) return href;
  const [pathPart, suffix = ''] = href.split(/(?=[?#])/, 2);
  const rebuilt = decodeURIComponent(pathPart)
    .split('/')
    .map((seg) => (seg === '.' || seg === '..' || seg === '' ? seg : slugSegment(seg)))
    .join('/');
  return `${rebuilt}${suffix}`;
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Renaming a directory moments after tar finished writing hundreds of megabytes
 * into it intermittently fails with EPERM/EBUSY on Windows, because the indexer
 * or AV still holds handles inside it. The condition clears on its own, so back
 * off and retry rather than failing the import.
 */
function renameSyncWithRetry(from, to, attempts = 10) {
  for (let i = 1; ; i++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      if ((err.code !== 'EPERM' && err.code !== 'EBUSY') || i >= attempts) throw err;
      sleepSync(250 * i);
    }
  }
}

/**
 * Rename that survives a case-only change on Windows. NTFS preserves case but
 * some layers treat `MindMaps` and `Mindmaps` as the same path, so a direct
 * rename can be a silent no-op; bouncing through a temp name is unambiguous.
 */
function renameDir(from, to) {
  if (!fs.existsSync(from)) return false;
  if (DRY_RUN) return true;
  if (from.toLowerCase() === to.toLowerCase()) {
    const tmp = `${to}__casefix__${process.pid}`;
    renameSyncWithRetry(from, tmp);
    renameSyncWithRetry(tmp, to);
  } else {
    if (fs.existsSync(to)) fs.rmSync(to, { recursive: true, force: true });
    renameSyncWithRetry(from, to);
  }
  return true;
}

function extractBundle(bundle) {
  const target = path.join(CHAPTER_DIR, bundle.dir);
  const staged = path.join(CHAPTER_DIR, bundle.zipRoot);

  if (rmrf(target)) step(`  removed previous ${bundle.dir}/`);
  rmrf(staged);

  const extractAs = bundle.extractAs ?? [];

  // bsdtar reads zip archives and honours --exclude, so the ~500 MB of
  // duplicated _backups/ trees are never written to disk in the first place.
  // --strip-components drops the zip's own root folder so contents land directly
  // in the final directory: renaming a freshly-written multi-hundred-megabyte
  // tree on Windows fails with EPERM.
  // Run from the source directory and pass a bare filename — an absolute
  // `C:\...` argument to -f is parsed as a remote host by some tar builds.
  const runTar = (extraArgs) =>
    execFileSync(
      TAR_BIN,
      ['-xf', bundle.zip, '--exclude', '*_backups/*', '--exclude', '*_backups', ...extraArgs],
      { stdio: 'inherit', cwd: SOURCE_DIR },
    );

  step(`  extracting (excluding _backups/) ...`);
  if (!DRY_RUN) {
    fs.mkdirSync(target, { recursive: true });
    runTar([
      '-C',
      target,
      '--strip-components',
      '1',
      // Subtrees that need a different destination name are handled below.
      ...extractAs.flatMap(([from]) => ['--exclude', `*/${from}/*`]),
    ]);

    for (const [from, to] of extractAs) {
      const dest = path.join(target, to);
      fs.mkdirSync(dest, { recursive: true });
      // Strip the zip root plus every segment of `from`, so the subtree's
      // contents land directly inside `to`.
      const strip = 1 + from.split('/').length;
      runTar(['-C', dest, '--strip-components', String(strip), `${bundle.zipRoot}/${from}/*`]);
      step(`  extracted ${from}/ -> ${to}/`);
    }

    if (!fs.existsSync(path.join(target, 'Learn'))) {
      throw new Error(
        `Extraction of ${bundle.zip} produced no Learn/ directory in ${bundle.dir}/.`,
      );
    }
  }
  return target;
}

function normalizeBundle(bundle, target) {
  // (2) is handled during extraction via `extractAs` — see extractBundle. Verify
  // it took, since a stray `MindMaps` would 404 on case-sensitive hosting while
  // working fine on a case-insensitive dev box.
  const learnDir = path.join(target, 'Learn');
  if (!DRY_RUN && fs.existsSync(learnDir)) {
    for (const name of fs.readdirSync(learnDir)) {
      if (name !== 'Mindmaps' && name.toLowerCase() === 'mindmaps') {
        throw new Error(
          `${bundle.dir}/Learn/${name} was not normalised to Learn/Mindmaps — ` +
            `add ['Learn/${name}', 'Learn/Mindmaps'] to this bundle's extractAs.`,
        );
      }
    }
  }

  // Nested backup folders that the tar exclude pattern can miss.
  for (const f of walkFiles(target)) {
    if (f.split(path.sep).includes('_backups')) {
      rmrf(path.join(target, '_backups'));
      break;
    }
  }
  for (const nested of ['Learn/Mindmaps/_backups', 'Learn/Flashcards/_backups']) {
    if (rmrf(path.join(target, nested))) step(`  removed nested ${nested}/`);
  }

  // (4) mock_test_chapter_*.md -> mock_test.md
  const mockDir = path.join(target, 'Prepare/Mock_Test');
  if (fs.existsSync(mockDir)) {
    for (const name of fs.readdirSync(mockDir)) {
      if (/^mock_test.*\.md$/i.test(name) && name !== 'mock_test.md') {
        if (!DRY_RUN) {
          renameSyncWithRetry(path.join(mockDir, name), path.join(mockDir, 'mock_test.md'));
        }
        step(`  renamed Prepare/Mock_Test/${name} -> mock_test.md`);
      }
    }
  }

  // (5) drop unused payload
  for (const rel of DROP_FILES) {
    const p = path.join(target, rel);
    if (fs.existsSync(p)) {
      if (!DRY_RUN) fs.rmSync(p, { force: true });
      step(`  dropped ${rel}`);
    }
  }

  // (6) web-safe names for the infographic tree
  if (!DRY_RUN) {
    const renamed = slugifyTree(target);
    if (renamed) step(`  slugified ${renamed} unsafe file/directory name(s)`);
  }

  // (3) rewrite markdown link targets: MindMaps/ -> Mindmaps/, and the slugging
  // above. Only link targets are touched, so prose keeps its original wording.
  let rewritten = 0;
  for (const file of walkFiles(target)) {
    if (!file.endsWith('.md')) continue;
    const original = fs.readFileSync(file, 'utf8');
    const updated = original.replace(/\]\(([^)]*)\)/g, (match, href) => {
      const next = slugifyHref(href.replace(/MindMaps\//g, 'Mindmaps/'));
      return next === href ? match : `](${next})`;
    });
    if (updated !== original) {
      if (!DRY_RUN) fs.writeFileSync(file, updated, 'utf8');
      rewritten++;
    }
  }
  if (rewritten) step(`  rewrote link targets in ${rewritten} markdown file(s)`);
}

function writeVideosJson() {
  const payload = {
    chapterNumber: 1,
    videos: BUNDLES.map((b) => ({
      index: b.index,
      id: b.id,
      title: b.title,
      ytId: b.ytId,
      dir: b.dir,
      topics: b.topics,
    })),
  };
  const out = path.join(CHAPTER_DIR, 'videos.json');
  if (!DRY_RUN) fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  step(`wrote videos.json (${payload.videos.length} videos)`);
}

function main() {
  log(`Source : ${SOURCE_DIR}`);
  log(`Target : ${CHAPTER_DIR}`);
  log('');

  const missing = BUNDLES.filter((b) => !fs.existsSync(path.join(SOURCE_DIR, b.zip)));
  if (missing.length) {
    console.error('Missing bundle(s) in the source directory:');
    for (const b of missing) console.error(`  - ${b.zip}`);
    console.error('\nPass --from <dir> if the zips live elsewhere.');
    process.exit(1);
  }
  if (!fs.existsSync(CHAPTER_DIR)) {
    console.error(`Chapter directory not found: ${CHAPTER_DIR}`);
    process.exit(1);
  }

  for (const bundle of BUNDLES) {
    log(`==> ${bundle.zip}`);
    const target = extractBundle(bundle);
    normalizeBundle(bundle, target);
    if (!DRY_RUN) log(`  ${bundle.dir}/  (${dirSizeMb(target)} MB)`);
    log('');
  }

  if (!KEEP_LEGACY) {
    for (const name of LEGACY_CHAPTER_DIRS) {
      if (rmrf(path.join(CHAPTER_DIR, name))) {
        step(`removed superseded chapter-root ${name}/`);
      }
    }
  }

  writeVideosJson();
  log('\nDone.');
}

main();
