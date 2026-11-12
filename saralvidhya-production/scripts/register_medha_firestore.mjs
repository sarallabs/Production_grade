/**
 * Direct Firestore REST registration script for Medha / ANU (tenants/medha & tenants/anu)
 * Registers:
 *   - tenants/medha & tenants/anu (with DB-driven catalog, manifest, courses, and fileIndex)
 *   - tenants/medha/subjects/{management,anu_physics,anu_characterization} + chapters
 *   - tenants/anu/subjects/{management,anu_physics,anu_characterization} + chapters
 *   - platformConfig/global (adds medha / anu / anu_university routing & logo entries)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bcrypt = require('../backend/node_modules/bcryptjs');

const PROJECT_ID = 'saralvidhya-production';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const MEDHA_GEN_DIR = path.resolve('../saralvidhya-medha/public/generated_resources');

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

async function main() {
  const token = getAccessToken();
  const catalog = JSON.parse(fs.readFileSync(path.join(MEDHA_GEN_DIR, 'catalog.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(MEDHA_GEN_DIR, 'manifest.json'), 'utf8'));
  const coursesJson = JSON.parse(fs.readFileSync(path.join(MEDHA_GEN_DIR, 'courses.json'), 'utf8'));
  const fileIndexJson = JSON.parse(fs.readFileSync(path.join(MEDHA_GEN_DIR, 'file-index.json'), 'utf8'));

  // Filter fileIndex to text/json/audio resources (.md, .json, .mp3) so Firestore doc stays compact (< 200 KB)
  const compactFileIndex = (fileIndexJson.files || []).filter((p) =>
    /\.(md|json|mp3|m4a)$/i.test(p)
  );

  // Convert resourceTabs 2D array into objects so Firestore REST API accepts it cleanly
  const safeManifest = {
    ...manifest,
    resourceTabs: (manifest.resourceTabs || []).map((t) =>
      Array.isArray(t) ? { file: t[0], label: t[1] } : t
    ),
  };

  const now = new Date().toISOString();
  const defaultPassword = process.env.MEDHA_TENANT_PASSWORD || 'Ekam@2026';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  for (const tid of ['medha', 'anu']) {
    console.log(`Writing tenants/${tid}...`);
    await writeDoc(
      `tenants/${tid}`,
      toFirestoreFields({
        id: tid,
        name: 'Acharya Nagarjuna University (ANU)',
        shortName: 'ANU',
        academicTerm: '2026',
        status: 'active',
        branding: {
          appName: 'Acharya Nagarjuna University (ANU)',
          primaryColor: '#546C60',
          accentColor: '#E7B864',
          programLabel: 'MBA & M.Sc',
          logoBlob: 'assets/logo-anu.webp',
          faviconBlob: 'assets/logo-anu.webp',
        },
        assets: {
          logo: 'assets/logo-anu.webp',
          favicon: 'assets/logo-anu.webp',
        },
        features: {
          examinerConsole: true,
          expertPanel: true,
          pyq: true,
          ask: true,
          guidedFlow: true,
          toolOrder: [
            'videos',
            'flashcards',
            'assessment',
            'summary',
            'detailed',
            'mindmap',
            'revision_flashcards',
            'mocktest',
            'prep_exam',
            'pre_final_test',
            'ask',
          ],
        },
        hierarchy: ['program', 'subject'],
        contractVersion: '1.1.0',
        storage: {
          bucket: 'saralvidhya-artifacts',
          prefix: 'medha',
        },
        domains: [
          'saralvidhya-anu.web.app',
          'saralvidhya-anu.firebaseapp.com',
          'saralvidhya-medha.web.app',
          'saralvidhya-medha.firebaseapp.com',
        ],
        uiCopy: {
          medhaPortal: {
            catalog,
            manifest: safeManifest,
            courses: coursesJson.courses || {},
            fileIndex: compactFileIndex,
            updatedAt: now,
          },
        },
        auth: {
          passwordHash,
          sessionVersion: 1,
          updatedAt: now,
        },
        updatedAt: now,
      }),
      token
    );

    // Register subjects and chapters under tenants/{tid}/subjects/*
    for (const [idx, sub] of (manifest.subjects || []).entries()) {
      const meta = (coursesJson.courses || {})[sub.id] || {};
      console.log(`Writing tenants/${tid}/subjects/${sub.id}...`);
      await writeDoc(
        `tenants/${tid}/subjects/${sub.id}`,
        toFirestoreFields({
          id: sub.id,
          name: sub.name,
          path: sub.path,
          boardId: sub.boardId || 'anu_university',
          boardName: sub.boardName || 'Acharya Nagarjuna University',
          classId: sub.classId || 'mba',
          className: sub.className || 'MBA',
          subtitle: meta.subtitle || `Learn about ${sub.name}`,
          description: meta.description || '',
          discipline: meta.discipline || 'General',
          credits: meta.credits || 3,
          durationHours: meta.durationHours || 30,
          instructor: meta.instructor || {},
          order: idx + 1,
          status: 'active',
          updatedAt: now,
        }),
        token
      );

      for (const ch of sub.chapters || []) {
        const cid = `chapter_${String(ch.number).padStart(2, '0')}`;
        await writeDoc(
          `tenants/${tid}/subjects/${sub.id}/chapters/${cid}`,
          toFirestoreFields({
            id: cid,
            number: ch.number,
            title: ch.name || `Chapter ${ch.number}`,
            shortTitle: ch.name || `Chapter ${ch.number}`,
            dir: ch.dir,
            completed: ch.completed || [],
            resourceCount: ch.resourceCount || 0,
            status: 'published',
            currentVersion: 1,
            updatedAt: now,
          }),
          token
        );
      }
    }
  }

  // Update platformConfig/global
  console.log('Updating platformConfig/global...');
  const globalDoc = await getDoc('platformConfig/global', token);
  const existingGlobal = globalDoc ? fromFirestoreDoc(globalDoc) : {};
  const assets = existingGlobal.assets || {};
  const boardLogos = {
    ...(assets.boardLogos || {}),
    medha: 'medha/assets/logo-anu.webp',
    anu: 'medha/assets/logo-anu.webp',
    anu_university: 'medha/assets/logo-anu.webp',
  };
  const sr = existingGlobal.subjectRouting || {};
  const cloudRoutes = {
    ...(sr.cloudRoutes || {}),
    management: 'medha/management',
    anu_physics: 'medha/anu_physics',
    anu_characterization: 'medha/anu_characterization',
  };
  const boardNames = {
    ...(sr.boardNames || {}),
    medha: 'Acharya Nagarjuna University (ANU)',
    anu: 'Acharya Nagarjuna University (ANU)',
    anu_university: 'Acharya Nagarjuna University (ANU)',
  };
  const boardTenantAliases = {
    ...(sr.boardTenantAliases || {}),
    medha: 'medha',
    anu: 'medha',
    anu_university: 'medha',
  };
  const defaultVisibleBoards = Array.from(
    new Set([...(sr.defaultVisibleBoards || []), 'medha', 'anu'])
  );

  await writeDoc(
    'platformConfig/global',
    toFirestoreFields({
      ...existingGlobal,
      assets: {
        ...assets,
        boardLogos,
      },
      subjectRouting: {
        ...sr,
        cloudRoutes,
        boardNames,
        boardTenantAliases,
        defaultVisibleBoards,
      },
      updatedAt: now,
    }),
    token
  );

  console.log(
    `[SUCCESS] Registered tenants/medha & tenants/anu in Firestore with ${compactFileIndex.length} indexed cloud artifacts.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
