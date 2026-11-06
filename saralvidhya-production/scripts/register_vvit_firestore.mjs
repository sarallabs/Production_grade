import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import bcrypt from '../backend/node_modules/bcryptjs/index.js';

const PROJECT_ID = 'saralvidhya-production';
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const BUILD_DIR = 'D:/SV-Medha_ production_grade/saralvidhya-production/tools/build/vvit';

function getGcloudToken() {
  return execSync('gcloud auth print-access-token --quiet', { encoding: 'utf-8' }).trim();
}

async function writeDoc(docPath, fields, token) {
  const url = `${BASE_FIRESTORE_URL}/${docPath}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to write ${docPath}: HTTP ${res.status} - ${txt}`);
  }
  return await res.json();
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
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'application/json';
  if (ext === '.md') return 'text/markdown';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function collectChapterFiles(chapterAbsDir, relPrefix) {
  const filesMap = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const relToCh = path.relative(chapterAbsDir, full).split(path.sep).join('/');
        const fullRel = `${relPrefix}/${relToCh}`;
        const stat = fs.statSync(full);
        filesMap[fullRel] = {
          path: fullRel,
          size: stat.size,
          contentType: guessContentType(full),
        };
      }
    }
  }
  walk(chapterAbsDir);
  return filesMap;
}

async function main() {
  console.log('[Firestore VVIT Register] Acquiring gcloud access token...');
  const token = getGcloudToken();
  const tenantJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'tenant.json'), 'utf8'));
  const subjectJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'mongodb/subject.json'), 'utf8'));
  const chapterJson = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'mongodb/chapter_01/chapter.json'), 'utf8'));
  const passwordHash = await bcrypt.hash('VVIT@2026', 10);
  const now = new Date().toISOString();

  // 1. Tenant document
  console.log('Writing tenants/vvit...');
  await writeDoc(
    'tenants/vvit',
    toFirestoreFields({
      name: tenantJson.name,
      shortName: tenantJson.shortName,
      academicTerm: tenantJson.academicTerm || '2026–27',
      status: 'active',
      domains: ['saralvidhya-vvit.web.app', 'saralvidhya-vvit.firebaseapp.com'],
      branding: {
        appName: tenantJson.branding?.appName || 'Saral Vidhya',
        primaryColor: tenantJson.branding?.primaryColor || '#546C60',
        accentColor: tenantJson.branding?.accentColor || '#9CC0B4',
        logoBlob: 'assets/logo.png',
        faviconBlob: 'assets/favicon.png',
        programLabel: tenantJson.branding?.programLabel || 'Autonomous Engineering',
      },
      assets: {
        logo: 'assets/logo.png',
        favicon: 'assets/favicon.png',
      },
      features: tenantJson.features || {},
      hierarchy: tenantJson.hierarchy || ['department', 'semester', 'subject'],
      storage: {
        bucket: 'saralvidhya-artifacts',
        prefix: 'vvit',
      },
      auth: {
        passwordHash,
        sessionVersion: 1,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    }),
    token
  );

  // 2. Hierarchy Nodes
  for (const node of tenantJson.nodes || []) {
    console.log(`Writing tenants/vvit/nodes/${node.id}...`);
    await writeDoc(`tenants/vvit/nodes/${node.id}`, toFirestoreFields(node), token);
  }

  // 3. Subject: mongodb
  console.log('Writing tenants/vvit/subjects/mongodb...');
  await writeDoc(
    'tenants/vvit/subjects/mongodb',
    toFirestoreFields({
      name: subjectJson.name,
      code: subjectJson.code,
      subtitle: subjectJson.subtitle,
      programLabel: subjectJson.programLabel,
      description: subjectJson.description,
      credits: subjectJson.credits,
      order: subjectJson.order || 1,
      status: 'active',
      parentNodeId: subjectJson.parentNodeId || 'sem_3',
      chaptersCount: 1,
      iconBlob: 'mongodb/assets/icon.png',
      assets: {
        icon: 'mongodb/assets/icon.png',
      },
      cardStyle: subjectJson.cardStyle || {
        accentColor: '#546C60',
        badgeText: 'Core NoSQL',
      },
      updatedAt: now,
    }),
    token
  );

  // 4. Chapter: chapter_01
  const chDocPath = 'tenants/vvit/subjects/mongodb/chapters/chapter_01';
  console.log(`Writing ${chDocPath}...`);
  await writeDoc(
    chDocPath,
    toFirestoreFields({
      number: chapterJson.number,
      title: chapterJson.title,
      shortTitle: chapterJson.shortTitle,
      description: chapterJson.description,
      estimatedMinutes: chapterJson.estimatedMinutes || 60,
      status: 'published',
      currentVersion: 1,
      heroImageBlob: 'mongodb/chapter_01/media/hero.png',
      assets: {
        heroImage: 'mongodb/chapter_01/media/hero.png',
      },
      topics: chapterJson.topics,
      videos: chapterJson.videos || [],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.key_takeaways': { available: true },
        'read.glossary': { available: true },
        'learn.mindmap': { interactive: true, levels: 2 },
        'learn.study_plan': { available: true },
        'learn.topics': { count: 7, subtopicsCount: 17 },
        'learn.videos': { count: (chapterJson.videos || []).length },
        'practice.flashcards': { personas: ['beginner', 'intermediate', 'advanced', 'revise'] },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.msq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.question_bank': { available: true },
        'podcasts': { tracks: 7 },
        'prepare.previous_year': { available: true },
        'prepare.mock_test': { available: true },
        'prepare.pre_final_exam': { available: true },
      },
      updatedAt: now,
    }),
    token
  );

  // 5. Chapter Version 1 files map
  const chAbsDir = path.join(BUILD_DIR, 'mongodb/chapter_01');
  const filesMap = collectChapterFiles(chAbsDir, 'mongodb/chapter_01');
  const verDocPath = `${chDocPath}/versions/1`;
  console.log(`Writing ${verDocPath} (${Object.keys(filesMap).length} files)...`);
  await writeDoc(
    verDocPath,
    toFirestoreFields({
      version: 1,
      files: filesMap,
      registeredAt: now,
      registeredBy: 'sv-admin-vvit',
    }),
    token
  );

  console.log('[SUCCESS] Registered VVIT tenant, subject (mongodb), chapter_01, and versions/1 in Firestore.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
