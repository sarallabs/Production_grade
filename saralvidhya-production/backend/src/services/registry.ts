import { Firestore } from '@google-cloud/firestore';
import { promoteStagingFiles, readJsonFile } from './storage.js';
import { detectTools } from './toolDiscovery.js';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'saralvidhya-production';
const firestore = new Firestore({ projectId: PROJECT_ID });

// ── In-Memory Cache (TTL: 60 seconds) ──────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setInCache<T>(key: string, data: T, ttlSeconds = 60): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// ── Types ─────────────────────────────────────────────────────────────
export interface TenantPublic {
  id: string;
  name: string;
  shortName: string;
  status: 'active' | 'suspended' | 'pending';
  domains: string[];
  branding: {
    appName: string;
    logoBlob?: string;
    faviconBlob?: string;
    primaryColor: string;
    programLabel?: string;
  };
  features: {
    examinerConsole?: boolean;
    expertPanel?: boolean;
    pyq?: boolean;
    ask?: boolean;
    toolOrder?: string[];
  };
  hierarchy: string[];
  storage: {
    bucket: string;
    prefix: string;
  };
}

export interface TenantAuth {
  passwordHash: string;
  sessionVersion: number;
  updatedAt: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  parentNodeId?: string | null;
  iconBlob?: string;
  order: number;
  status: 'active' | 'archived';
  chaptersCount?: number;
  chapters?: Array<{ id: string; number: number; title: string; status?: string; topics?: any[] }>;
}

export interface ChapterItem {
  id: string;
  number: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  currentVersion: number;
  topics?: Array<{ id: string; label: string; order: number; topicNum?: number }>;
  tools?: Record<string, any>;
  files?: Record<string, { path: string; size?: number; contentType?: string }>;
}

export interface PublishRequest {
  id: string;
  tenantId: string;
  scope: string;
  status: 'uploading' | 'pending' | 'approved' | 'rejected' | 'failed';
  diffSummary?: any;
  files: Array<{ path: string; stagingPath: string; size?: number; contentType?: string }>;
  submittedBy: string;
  submittedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

// ── Registry Operations ───────────────────────────────────────────────

/**
 * Gets tenant public details (branding, features, storage config).
 * Omits private authentication fields.
 */
export async function getTenant(tenantId: string): Promise<TenantPublic | null> {
  const cacheKey = `tenant:${tenantId}`;
  const cached = getFromCache<TenantPublic>(cacheKey);
  if (cached) return cached;

  const doc = await firestore.collection('tenants').doc(tenantId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const tenant: TenantPublic = {
    id: tenantId,
    name: data.name || tenantId,
    shortName: data.shortName || tenantId,
    status: data.status || 'active',
    domains: data.domains || [],
    branding: data.branding || { primaryColor: '#2563eb', appName: data.name },
    features: data.features || {},
    hierarchy: data.hierarchy || ['program', 'subject'],
    storage: data.storage || {
      bucket: 'saralvidhya-artifacts',
      prefix: `${tenantId}`,
    },
  };

  setInCache(cacheKey, tenant, 60);
  return tenant;
}

/**
 * Gets private tenant authentication credentials (internal/auth use only).
 */
export async function getTenantAuth(tenantId: string): Promise<TenantAuth | null> {
  const doc = await firestore.collection('tenants').doc(tenantId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return (data.auth as TenantAuth) || null;
}

/**
 * Sets or updates the shared password hash and bumps the sessionVersion.
 */
export async function setTenantPassword(
  tenantId: string,
  passwordHash: string
): Promise<number> {
  const tenantRef = firestore.collection('tenants').doc(tenantId);
  const snap = await tenantRef.get();

  const currentVersion = snap.exists ? (snap.data()?.auth?.sessionVersion || 0) : 0;
  const newVersion = currentVersion + 1;

  await tenantRef.set(
    {
      auth: {
        passwordHash,
        sessionVersion: newVersion,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  invalidateCache(`tenant:${tenantId}`);
  return newVersion;
}

/**
 * Gets catalog for a tenant (nodes + published subjects).
 */
export async function getCatalog(tenantId: string): Promise<{
  nodes: any[];
  subjects: SubjectItem[];
}> {
  const cacheKey = `catalog:${tenantId}`;
  const cached = getFromCache<{ nodes: any[]; subjects: SubjectItem[] }>(cacheKey);
  if (cached) return cached;

  const nodesSnap = await firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('nodes')
    .orderBy('order', 'asc')
    .get();

  const nodes = nodesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const subjectsSnap = await firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('subjects')
    .where('status', '==', 'active')
    .get();

  const subjects = await Promise.all(
    subjectsSnap.docs.map(async (d) => {
      const chSnap = await d.ref.collection('chapters').get();
      const chapters = chSnap.docs
        .map((c) => {
          const cd = c.data();
          return {
            id: c.id,
            number: cd.number || 0,
            title: cd.title || c.id,
            status: cd.status || 'published',
            topics: cd.topics || [],
          };
        })
        .filter((c) => c.status === 'published')
        .sort((a, b) => a.number - b.number);
      return {
        id: d.id,
        ...(d.data() as Omit<SubjectItem, 'id'>),
        chapters,
        chaptersCount: chapters.length,
      } as SubjectItem;
    })
  );

  subjects.sort((a, b) => (a.order || 0) - (b.order || 0));


  const result = { nodes, subjects };
  setInCache(cacheKey, result, 60);
  return result;
}

/**
 * Gets chapter details, metadata, and resolved files for the active (or requested) version.
 */
export async function getChapter(
  tenantId: string,
  subjectId: string,
  chapterId: string,
  version?: number
): Promise<ChapterItem | null> {
  const cacheKey = `chapter:${tenantId}:${subjectId}:${chapterId}:${version || 'current'}`;
  const cached = getFromCache<ChapterItem>(cacheKey);
  if (cached) return cached;

  const chapterRef = firestore
    .collection('tenants')
    .doc(tenantId)
    .collection('subjects')
    .doc(subjectId)
    .collection('chapters')
    .doc(chapterId);

  const chapterDoc = await chapterRef.get();
  if (!chapterDoc.exists) return null;

  const chapterData = chapterDoc.data()!;
  const targetVersion = version || chapterData.currentVersion || 1;

  const versionDoc = await chapterRef.collection('versions').doc(String(targetVersion)).get();
  const versionData = versionDoc.exists ? versionDoc.data() : null;

  const result: ChapterItem = {
    id: chapterId,
    number: chapterData.number,
    title: chapterData.title,
    status: chapterData.status || 'published',
    currentVersion: targetVersion,
    topics: chapterData.topics || [],
    tools: chapterData.tools || {},
    files: versionData?.files || {},
  };

  setInCache(cacheKey, result, 60);
  return result;
}

/**
 * Submits a new publish request.
 */
export async function createPublishRequest(
  request: Omit<PublishRequest, 'id' | 'status' | 'submittedAt'>,
  status: 'uploading' | 'pending' = 'pending'
): Promise<string> {
  const reqRef = firestore.collection('publishRequests').doc();
  const data: PublishRequest = {
    ...request,
    id: reqRef.id,
    status,
    submittedAt: new Date().toISOString(),
  };

  await reqRef.set(data);
  return reqRef.id;
}

/**
 * Marks an 'uploading' request as 'pending' (ready for approval).
 */
export async function markPublishRequestPending(requestId: string): Promise<void> {
  await firestore.collection('publishRequests').doc(requestId).update({ status: 'pending' });
}

/**
 * Gets a publish request by ID.
 */
export async function getPublishRequest(requestId: string): Promise<PublishRequest | null> {
  const doc = await firestore.collection('publishRequests').doc(requestId).get();
  if (!doc.exists) return null;
  return doc.data() as PublishRequest;
}

/**
 * Lists pending publish requests.
 */
export async function listPendingPublishRequests(): Promise<PublishRequest[]> {
  const snap = await firestore
    .collection('publishRequests')
    .where('status', '==', 'pending')
    .orderBy('submittedAt', 'desc')
    .get();

  return snap.docs.map((d) => d.data() as PublishRequest);
}

/**
 * Approves a publish request, promotes staging files to live in GCS,
 * and updates chapter version & registry in a transaction.
 */
export async function approvePublishRequest(
  requestId: string,
  approvedBy: string
): Promise<{ generatedPassword?: string }> {
  const reqRef = firestore.collection('publishRequests').doc(requestId);
  const snap = await reqRef.get();
  if (!snap.exists) throw new Error(`Publish request ${requestId} not found.`);

  const req = snap.data() as PublishRequest;
  if (req.status !== 'pending') {
    throw new Error(`Request is in status '${req.status}', cannot approve.`);
  }

  const tenant = await getTenant(req.tenantId);
  if (!tenant) throw new Error(`Tenant '${req.tenantId}' not found.`);

  // 1. Promote files from staging to live
  const stagingPrefix = `staging/${requestId}`;
  const livePrefix = `${tenant.storage.prefix}`;
  const fileRelPaths = req.files.map((f) => f.path);

  await promoteStagingFiles(stagingPrefix, livePrefix, fileRelPaths);

  // 2. Group files by subject and chapter, and read optional metadata files
  // Path format: {subjectId}/chapter_{NN}/{relativePath}
  const chapterGroups = new Map<string, { subjectId: string; chapterId: string; files: Record<string, any> }>();
  const subjectIds = new Set<string>();
  const filePaths = new Set(req.files.map((f) => f.path));

  for (const f of req.files) {
    const parts = f.path.split('/');
    if (parts.length >= 2) {
      const subjectId = parts[0];
      subjectIds.add(subjectId);
      if (parts.length >= 3) {
        const chapterId = parts[1];
        const groupKey = `${subjectId}:${chapterId}`;
        if (!chapterGroups.has(groupKey)) {
          chapterGroups.set(groupKey, { subjectId, chapterId, files: {} });
        }
        chapterGroups.get(groupKey)!.files[f.path] = {
          path: f.path,
          size: f.size,
          contentType: f.contentType,
        };
      }
    }
  }

  const subjectMeta = new Map<string, any>();
  for (const sid of subjectIds) {
    const p = `${sid}/subject.json`;
    if (filePaths.has(p)) subjectMeta.set(sid, await readJsonFile(`${livePrefix}/${p}`));
  }
  const chapterMeta = new Map<string, any>();
  for (const g of chapterGroups.values()) {
    const p = `${g.subjectId}/${g.chapterId}/chapter.json`;
    if (filePaths.has(p)) {
      chapterMeta.set(`${g.subjectId}:${g.chapterId}`, await readJsonFile(`${livePrefix}/${p}`));
    }
  }

  // 3. Update Firestore in transaction (all reads before writes)
  await firestore.runTransaction(async (tx) => {
    const tenantRef = firestore.collection('tenants').doc(req.tenantId);
    const groups = [...chapterGroups.values()];
    const refs = groups.map((g) =>
      tenantRef.collection('subjects').doc(g.subjectId).collection('chapters').doc(g.chapterId)
    );
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    const subjectSnaps = await Promise.all(
      [...subjectIds].map((sid) => tx.get(tenantRef.collection('subjects').doc(sid)))
    );

    const now = new Date().toISOString();
    tx.update(reqRef, {
      status: 'approved',
      decidedBy: approvedBy,
      decidedAt: now,
    });

    // Ensure tenant is set to active if it was pending
    tx.set(tenantRef, { status: 'active', updatedAt: now }, { merge: true });

    // Upsert subject docs (new subjects default to active so they show in the catalog)
    [...subjectIds].forEach((sid, i) => {
      const meta = subjectMeta.get(sid) || {};
      const exists = subjectSnaps[i].exists;
      const doc: Record<string, any> = { updatedAt: now };
      if (meta.name) doc.name = meta.name;
      else if (!exists) doc.name = sid;
      for (const k of ['code', 'parentNodeId', 'order', 'status', 'faculty', 'units']) {
        if (meta[k] !== undefined) doc[k] = meta[k];
      }
      if (!exists) {
        doc.status = doc.status || 'active';
        doc.order = doc.order ?? 0;
      }
      tx.set(tenantRef.collection('subjects').doc(sid), doc, { merge: true });
    });

    groups.forEach((group, i) => {
      const chRef = refs[i];
      const chSnap = snaps[i];
      const nextVer = chSnap.exists ? ((chSnap.data()?.currentVersion || 0) + 1) : 1;
      const meta = chapterMeta.get(`${group.subjectId}:${group.chapterId}`) || {};
      const numMatch = group.chapterId.match(/(\d+)/);

      const chDoc: Record<string, any> = {
        currentVersion: nextVer,
        status: 'published',
        updatedAt: now,
      };
      if (meta.title) chDoc.title = meta.title;
      else if (!chSnap.exists) chDoc.title = group.chapterId;
      if (meta.number !== undefined) chDoc.number = meta.number;
      else if (!chSnap.exists) chDoc.number = numMatch ? parseInt(numMatch[1], 10) : 0;
      if (meta.topics) chDoc.topics = meta.topics;
      // Auto-detect tools from uploaded files using contract tools.json
      const chapterPrefix = `${group.subjectId}/${group.chapterId}/`;
      const chRelFiles = Object.keys(group.files).map((p) =>
        p.startsWith(chapterPrefix) ? p.substring(chapterPrefix.length) : p
      );
      const inferredTools = detectTools(chRelFiles);
      chDoc.tools = meta.tools ? { ...inferredTools, ...meta.tools } : inferredTools;

      tx.set(chRef, chDoc, { merge: true });

      tx.set(chRef.collection('versions').doc(String(nextVer)), {
        version: nextVer,
        files: group.files,
        requestId: requestId,
        approvedBy: approvedBy,
        approvedAt: now,
      });
    });
  });

  // Check if tenant lacks password; if so, generate and set one
  let generatedPassword = '';
  const auth = await getTenantAuth(req.tenantId);
  if (!auth?.passwordHash) {
    const crypto = await import('crypto');
    generatedPassword = `SV-${crypto.randomBytes(4).toString('hex')}@2026`;
    const bcryptModule = await import('bcryptjs');
    const hash = await bcryptModule.default.hash(generatedPassword, 10);
    await setTenantPassword(req.tenantId, hash);
  }

  invalidateCache(`tenant:${req.tenantId}`);
  invalidateCache(`catalog:${req.tenantId}`);
  invalidateCache(`chapter:${req.tenantId}`);

  return { generatedPassword };
}

/**
 * Rejects a publish request with an optional note.
 */
export async function rejectPublishRequest(
  requestId: string,
  decidedBy: string,
  note?: string
): Promise<void> {
  const reqRef = firestore.collection('publishRequests').doc(requestId);
  await reqRef.update({
    status: 'rejected',
    decidedBy,
    decidedAt: new Date().toISOString(),
    note: note || '',
  });
}

// ── Student Progress ──────────────────────────────────────────────────

export async function saveStudentProgress(
  sessionId: string,
  tenantId: string,
  subjectId: string,
  chapterId: string,
  tool: string,
  data: any
): Promise<void> {
  const progressDocId = `${tenantId}:${subjectId}:${chapterId}:${tool}`;
  const ref = firestore
    .collection('users')
    .doc(sessionId)
    .collection('progress')
    .doc(progressDocId);

  await ref.set(
    {
      tenantId,
      subjectId,
      chapterId,
      tool,
      data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getStudentProgress(
  sessionId: string,
  tenantId: string,
  subjectId: string,
  chapterId: string
): Promise<Record<string, any>> {
  const snap = await firestore
    .collection('users')
    .doc(sessionId)
    .collection('progress')
    .where('tenantId', '==', tenantId)
    .where('subjectId', '==', subjectId)
    .where('chapterId', '==', chapterId)
    .get();

  const out: Record<string, any> = {};
  snap.docs.forEach((d) => {
    const docData = d.data();
    out[docData.tool] = docData.data;
  });
  return out;
}
