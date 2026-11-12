/**
 * Direct Firestore REST registration script for Chalapathi University (CU) — CNS (Chapter 1)
 * Uses `gcloud auth print-access-token` to write:
 *   - tenants/cu
 *   - tenants/cu/nodes/*
 *   - tenants/cu/subjects/cns
 *   - tenants/cu/subjects/cns/chapters/chapter_01
 *   - tenants/cu/subjects/cns/chapters/chapter_01/versions/1
 *   - platformConfig/global (adds cu / chalapathi / cns routing & logo entries)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bcrypt = require('../backend/node_modules/bcryptjs');

const PROJECT_ID = 'saralvidhya-production';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const BUILD_DIR = path.resolve('tools/build/cu');

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

function collectChapterFiles(chDir, prefix = 'cns/chapter_01') {
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

async function main() {
  const token = getAccessToken();
  const tenantJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'tenant.json'), 'utf8'));
  const subjectJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'cns/subject.json'), 'utf8'));
  const chapterJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'cns/chapter_01/chapter.json'), 'utf8'));

  const now = new Date().toISOString();
  const defaultPassword = process.env.CU_TENANT_PASSWORD || 'CU@2026';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  // 1. Tenant document: tenants/cu
  console.log('Writing tenants/cu...');
  await writeDoc(
    'tenants/cu',
    toFirestoreFields({
      id: 'cu',
      name: tenantJson.name,
      shortName: tenantJson.shortName || 'Chalapathi University',
      academicTerm: tenantJson.academicTerm || 'Sem V · 2026',
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
        prefix: 'cu',
      },
      domains: [
        'saralvidhya-cu.web.app',
        'saralvidhya-cu.firebaseapp.com',
        'saralvidhya-chalapathi.web.app',
        'saralvidhya-chalapathi.firebaseapp.com',
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

  // 2. Hierarchy nodes: tenants/cu/nodes/*
  for (const node of tenantJson.nodes || []) {
    console.log(`Writing tenants/cu/nodes/${node.id}...`);
    await writeDoc(`tenants/cu/nodes/${node.id}`, toFirestoreFields(node), token);
  }

  // 3. Subject: tenants/cu/subjects/cns
  console.log('Writing tenants/cu/subjects/cns...');
  await writeDoc(
    'tenants/cu/subjects/cns',
    toFirestoreFields({
      id: 'cns',
      name: subjectJson.name,
      code: subjectJson.code,
      subtitle: subjectJson.subtitle,
      programLabel: subjectJson.programLabel,
      description: subjectJson.description,
      credits: subjectJson.credits || 3,
      order: subjectJson.order || 1,
      status: 'active',
      parentNodeId: subjectJson.parentNodeId || 'cse_s5',
      chaptersCount: 1,
      iconBlob: 'cns/assets/icon.png',
      assets: {
        icon: 'cns/assets/icon.png',
      },
      cardStyle: subjectJson.cardStyle || {
        accentColor: '#1E3A8A',
        badgeText: 'B.Tech CSE',
        iconBgColor: '#EFF6FF',
      },
      updatedAt: now,
    }),
    token
  );

  // 4. Chapter: tenants/cu/subjects/cns/chapters/chapter_01
  const chDocPath = 'tenants/cu/subjects/cns/chapters/chapter_01';
  console.log(`Writing ${chDocPath}...`);
  const subtopicsCount = (chapterJson.topics || []).reduce(
    (sum, t) => sum + ((t.subtopics || []).length || 0),
    0
  );
  await writeDoc(
    chDocPath,
    toFirestoreFields({
      number: chapterJson.number,
      title: chapterJson.title,
      shortTitle: chapterJson.shortTitle,
      description: chapterJson.description,
      estimatedMinutes: chapterJson.estimatedMinutes || 120,
      status: 'published',
      currentVersion: 2,
      heroImageBlob: 'cns/chapter_01/media/hero.png',
      assets: {
        heroImage: 'cns/chapter_01/media/hero.png',
      },
      topics: chapterJson.topics,
      videos: chapterJson.videos || [],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.deep_dive': { available: true },
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
      },
      updatedAt: now,
    }),
    token
  );

  // 5. Chapter Version 1 files map
  const chAbsDir = path.join(BUILD_DIR, 'cns/chapter_01');
  const filesMap = collectChapterFiles(chAbsDir, 'cns/chapter_01');
  await writeDoc(`${chDocPath}/versions/1`, toFirestoreFields({ version: 1, files: filesMap, registeredAt: now, registeredBy: 'sv-admin-cu' }), token); const verDocPath = `${chDocPath}/versions/2`;
  console.log(`Writing ${verDocPath} (${Object.keys(filesMap).length} files)...`);
  await writeDoc(
    verDocPath,
    toFirestoreFields({
      version: 1,
      files: filesMap,
      registeredAt: now,
      registeredBy: 'sv-admin-cu',
    }),
    token
  );

  // 6. Update platformConfig/global with CU routing & logo
  console.log('Updating platformConfig/global...');
  const existingGlobalDoc = await getDoc('platformConfig/global', token);
  const globalData = existingGlobalDoc ? fromFirestoreDoc(existingGlobalDoc) : {};
  const sr = globalData.subjectRouting || {};
  const assets = globalData.assets || {};

  sr.cloudRoutes = {
    ...(sr.cloudRoutes || {}),
    cns: 'cu/cns',
    cu_cns: 'cu/cns',
    cryptography_and_network_security: 'cu/cns',
  };
  sr.localSubjectMap = {
    ...(sr.localSubjectMap || {}),
    cns: 'cu/cns',
    cu_cns: 'cu/cns',
  };
  sr.boardNames = {
    ...(sr.boardNames || {}),
    cu: 'Chalapathi University',
    chalapathi: 'Chalapathi University',
    chalapathi_university: 'Chalapathi University',
  };
  sr.boardTenantAliases = {
    ...(sr.boardTenantAliases || {}),
    cu: 'cu',
    chalapathi: 'cu',
    chalapathi_university: 'cu',
    'chalapathi university': 'cu',
  };
  const visibleSet = new Set(sr.defaultVisibleBoards || []);
  visibleSet.add('cu');
  visibleSet.add('chalapathi');
  visibleSet.add('chalapathi_university');
  sr.defaultVisibleBoards = Array.from(visibleSet);

  assets.boardLogos = {
    ...(assets.boardLogos || {}),
    cu: '_global/assets/logo-cu.png',
    chalapathi: '_global/assets/logo-cu.png',
    chalapathi_university: '_global/assets/logo-cu.png',
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

  console.log('[SUCCESS] Registered CU tenant, subject (cns), chapter_01, versions/1, and platformConfig/global in Firestore.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
