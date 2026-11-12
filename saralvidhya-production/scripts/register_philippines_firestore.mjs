/**
 * Direct Firestore REST registration script for De La Salle University (DLSU / philippines)
 * Subjects:
 *   - filipino (chapter_01)
 *   - oral_communication (chapter_01, chapter_02)
 *   - rw (chapter_01)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bcrypt = require('../backend/node_modules/bcryptjs');

const PROJECT_ID = 'saralvidhya-production';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const BUILD_DIR = path.resolve('tools/build/philippines');

function getAccessToken() {
  return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

function fromFirestoreValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const out = {};
    for (const [k, fv] of Object.entries(v.mapValue.fields || {})) {
      out[k] = fromFirestoreValue(fv);
    }
    return out;
  }
  return null;
}

function fromFirestoreDoc(doc) {
  const out = {};
  for (const [k, fv] of Object.entries(doc.fields || {})) {
    out[k] = fromFirestoreValue(fv);
  }
  return out;
}

async function getDoc(docPath, token) {
  const url = `${BASE_URL}/${docPath}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function writeDoc(docPath, data, token) {
  const url = `${BASE_URL}/${docPath}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed writing ${docPath}: ${res.status} ${errText}`);
  }
  return res.json();
}

function collectChapterFiles(chDir, prefix) {
  const filesMap = {};
  const mimeMap = {
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
  };
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const relToCh = path.relative(chDir, full).replace(/\\/g, '/');
        const stat = fs.statSync(full);
        const ext = path.extname(entry.name).toLowerCase();
        filesMap[relToCh] = {
          path: `${prefix}/${relToCh}`,
          size: stat.size,
          contentType: mimeMap[ext] || 'application/octet-stream',
        };
      }
    }
  }
  walk(chDir);
  return filesMap;
}

async function registerTenantTree(tenantId, storagePrefix, passwordHash, tenantJson, now, token) {
  console.log(`Writing tenants/${tenantId}...`);
  await writeDoc(
    `tenants/${tenantId}`,
    toFirestoreFields({
      id: tenantId,
      name: tenantJson.name,
      shortName: tenantJson.shortName || 'DLSU',
      academicTerm: tenantJson.academicTerm || 'SY 2025–2026',
      status: 'active',
      branding: {
        ...tenantJson.branding,
        logoBlob: 'assets/logo.png',
        faviconBlob: 'assets/favicon.png',
      },
      assets: {
        logo: 'assets/logo.png',
        favicon: 'assets/favicon.png',
      },
      features: tenantJson.features,
      hierarchy: tenantJson.hierarchy,
      nodes: tenantJson.nodes,
      contractVersion: tenantJson.contractVersion || '1.1.0',
      storage: {
        bucket: 'saralvidhya-artifacts',
        prefix: storagePrefix,
      },
      domains: [
        'saralvidhya-dlsu.web.app',
        'saralvidhya-dlsu.firebaseapp.com',
        'saralvidhya-philippines.web.app',
        'saralvidhya-philippines.firebaseapp.com',
      ],
      auth: {
        passwordHash,
        sessionVersion: 1,
        updatedAt: now,
      },
      updatedAt: now,
    }),
    token
  );

  for (const node of tenantJson.nodes || []) {
    await writeDoc(`tenants/${tenantId}/nodes/${node.id}`, toFirestoreFields(node), token);
  }

  const subjectIds = ['filipino', 'oral_communication', 'rw'];
  for (const sid of subjectIds) {
    const subjDir = path.join(BUILD_DIR, sid);
    const subjectJson = JSON.parse(fs.readFileSync(path.join(subjDir, 'subject.json'), 'utf8'));
    const chapterDirs = fs
      .readdirSync(subjDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('chapter_'))
      .map((e) => e.name)
      .sort();

    console.log(`Writing tenants/${tenantId}/subjects/${sid} (${chapterDirs.length} chapter(s))...`);
    await writeDoc(
      `tenants/${tenantId}/subjects/${sid}`,
      toFirestoreFields({
        id: sid,
        name: subjectJson.name,
        code: subjectJson.code,
        subtitle: subjectJson.subtitle,
        programLabel: subjectJson.programLabel,
        description: subjectJson.description,
        credits: subjectJson.credits || 4,
        order: subjectJson.order || 1,
        status: 'active',
        parentNodeId: subjectJson.parentNodeId || 'grade_11_sem_1',
        chaptersCount: chapterDirs.length,
        iconBlob: `${sid}/assets/icon.png`,
        assets: {
          icon: `${sid}/assets/icon.png`,
        },
        cardStyle: subjectJson.cardStyle,
        updatedAt: now,
      }),
      token
    );

    for (const cid of chapterDirs) {
      const chAbsDir = path.join(subjDir, cid);
      const chapterJson = JSON.parse(fs.readFileSync(path.join(chAbsDir, 'chapter.json'), 'utf8'));
      const chDocPath = `tenants/${tenantId}/subjects/${sid}/chapters/${cid}`;
      const subtopicsCount = (chapterJson.topics || []).reduce(
        (sum, t) => sum + ((t.subtopics || []).length || 0),
        0
      );
      const hasGlossary = fs.existsSync(path.join(chAbsDir, 'read/glossary.md'));
      const hasPodcasts = fs.existsSync(path.join(chAbsDir, 'podcasts'));

      const tools = {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.key_takeaways': { available: true },
        'learn.mindmap': { interactive: true, levels: 3 },
        'learn.study_plan': { available: true },
        'learn.topics': { count: (chapterJson.topics || []).length, subtopicsCount },
        'learn.videos': { count: (chapterJson.videos || []).length },
        'practice.flashcards': { personas: ['beginner', 'intermediate', 'advanced', 'revise'] },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.msq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.question_bank': { available: true },
        'practice.mock_test': { available: true },
        'prepare.previous_year': { available: true },
        'prepare.mock_test': { available: true },
        'prepare.pre_final_exam': { available: true },
        'prepare.certification_exam': { available: true },
      };
      if (hasGlossary) tools['read.glossary'] = { available: true };
      if (fs.existsSync(path.join(chAbsDir, 'read/deep_dive.md'))) tools['read.deep_dive'] = { available: true };
      if (hasPodcasts) tools['podcasts'] = { tracks: 2 };

      await writeDoc(
        chDocPath,
        toFirestoreFields({
          number: chapterJson.number,
          title: chapterJson.title,
          shortTitle: chapterJson.shortTitle,
          description: chapterJson.description,
          estimatedMinutes: chapterJson.estimatedMinutes || 90,
          status: 'published',
          currentVersion: 1,
          heroImageBlob: `${sid}/${cid}/media/hero.png`,
          assets: {
            heroImage: `${sid}/${cid}/media/hero.png`,
          },
          topics: chapterJson.topics,
          videos: chapterJson.videos || [],
          tools,
          updatedAt: now,
        }),
        token
      );

      const filesMap = collectChapterFiles(chAbsDir, `${sid}/${cid}`);
      const verDocPath = `${chDocPath}/versions/1`;
      console.log(`Writing ${verDocPath} (${Object.keys(filesMap).length} files)...`);
      await writeDoc(
        verDocPath,
        toFirestoreFields({
          version: 1,
          files: filesMap,
          registeredAt: now,
          registeredBy: `sv-admin-${tenantId}`,
        }),
        token
      );
    }
  }
}

async function main() {
  const token = getAccessToken();
  const tenantJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'tenant.json'), 'utf8'));

  const now = new Date().toISOString();
  const defaultPassword = process.env.DLSU_TENANT_PASSWORD || 'DLSU@2026';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  // Register primary tenant 'dlsu' and legacy alias 'philippines'
  await registerTenantTree('dlsu', 'dlsu', passwordHash, tenantJson, now, token);
  await registerTenantTree('philippines', 'philippines', passwordHash, tenantJson, now, token);

  // Update platformConfig/global with dlsu routing & logo
  console.log('Updating platformConfig/global...');
  const existingGlobalDoc = await getDoc('platformConfig/global', token);
  const globalData = existingGlobalDoc ? fromFirestoreDoc(existingGlobalDoc) : {};
  const sr = globalData.subjectRouting || {};
  const assets = globalData.assets || {};

  sr.cloudRoutes = {
    ...(sr.cloudRoutes || {}),
    filipino: 'dlsu/filipino',
    oral_communication: 'dlsu/oral_communication',
    'oral communication': 'dlsu/oral_communication',
    rw: 'dlsu/rw',
    reading_and_writing: 'dlsu/rw',
  };
  sr.localSubjectMap = {
    ...(sr.localSubjectMap || {}),
    filipino: 'philippines/filipino',
    oral_communication: 'philippines/oral_communication',
    'oral communication': 'philippines/oral_communication',
    rw: 'philippines/rw',
  };
  sr.boardNames = {
    ...(sr.boardNames || {}),
    dlsu: 'De La Salle University',
    de_la_salle: 'De La Salle University',
    philippines: 'De La Salle University',
    ph: 'De La Salle University',
    deped: 'De La Salle University',
  };
  sr.boardTenantAliases = {
    ...(sr.boardTenantAliases || {}),
    dlsu: 'dlsu',
    de_la_salle: 'dlsu',
    philippines: 'dlsu',
    ph: 'dlsu',
    deped: 'dlsu',
  };
  const visibleSet = new Set(sr.defaultVisibleBoards || []);
  visibleSet.delete('philippines');
  visibleSet.add('dlsu');
  sr.defaultVisibleBoards = Array.from(visibleSet);

  assets.boardLogos = {
    ...(assets.boardLogos || {}),
    dlsu: '_global/assets/logo-dlsu.png',
    de_la_salle: '_global/assets/logo-dlsu.png',
    philippines: '_global/assets/logo-dlsu.png',
    ph: '_global/assets/logo-dlsu.png',
    deped: '_global/assets/logo-dlsu.png',
  };

  await writeDoc(
    'platformConfig/global',
    toFirestoreFields({
      ...globalData,
      subjectRouting: sr,
      assets,
      updatedAt: now,
    }),
    token
  );

  console.log('[SUCCESS] Registered DLSU (tenants/dlsu & tenants/philippines), 3 subjects, 4 chapters, and platformConfig/global in Firestore.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
