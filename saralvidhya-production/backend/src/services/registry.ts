import { Firestore } from '@google-cloud/firestore';
import {
  getSignedUrlForFile,
  promoteStagingFiles,
  readJsonFile,
  resolveStorageAssetUrl,
} from './storage.js';
import { detectTools } from './toolDiscovery.js';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'saralvidhya-production';
export const firestore = new Firestore({
  projectId: PROJECT_ID,
  ignoreUndefinedProperties: true,
});

// ── In-Memory Cache (TTL: 60 seconds) + In-Flight Deduplication ────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();

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

function withInFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

function normalizeAssetPath(scopePrefix: string, relPath?: string | null): string | undefined {
  if (!relPath || typeof relPath !== 'string') return undefined;
  const trimmed = relPath.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const cleanRel = trimmed.replace(/^\/+/, '');
  const cleanScope = scopePrefix.replace(/^\/+|\/+$/g, '');
  if (!cleanScope || cleanRel.startsWith(`${cleanScope}/`)) {
    return cleanRel;
  }
  return `${cleanScope}/${cleanRel}`;
}

// ── Types ─────────────────────────────────────────────────────────────
export interface TenantPublic {
  id: string;
  name: string;
  shortName: string;
  academicTerm?: string;
  status: 'active' | 'suspended' | 'pending';
  domains: string[];
  branding: {
    appName: string;
    logoBlob?: string;
    logoUrl?: string;
    faviconBlob?: string;
    faviconUrl?: string;
    loginBannerBlob?: string;
    loginBannerUrl?: string;
    primaryColor: string;
    accentColor?: string;
    programLabel?: string;
    watermarkIcon?: string;
  };
  assets?: {
    logo?: string;
    logoUrl?: string;
    favicon?: string;
    faviconUrl?: string;
    loginBanner?: string;
    loginBannerUrl?: string;
  };
  features: {
    examinerConsole?: boolean;
    expertPanel?: boolean;
    pyq?: boolean;
    ask?: boolean;
    guidedFlow?: boolean;
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

export interface VideoManifestItem {
  id: string;
  title: string;
  provider?: 'youtube' | 'gcs' | 'external';
  videoId?: string;
  gcsPath?: string | null;
  url?: string;
  videoUrl?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  duration?: string;
  durationSeconds?: number;
  topics?: string[];
  order?: number;
}

export interface CatalogChapterSummary {
  id: string;
  number: number;
  title: string;
  shortTitle?: string;
  description?: string;
  estimatedMinutes?: number;
  status?: string;
  heroImageBlob?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  topics?: any[];
  topicCount: number;
  videoCount: number;
  tools?: Record<string, any>;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  subtitle?: string;
  programLabel?: string;
  description?: string;
  credits?: number;
  parentNodeId?: string | null;
  iconBlob?: string;
  iconUrl?: string;
  bannerUrl?: string;
  assets?: {
    icon?: string;
    iconUrl?: string;
    banner?: string;
    bannerUrl?: string;
    thumbnail?: string;
    thumbnailUrl?: string;
  };
  cardStyle?: {
    accentColor?: string;
    gradient?: string;
    badgeText?: string;
    iconBgColor?: string;
  };
  faculty?: {
    name?: string;
    title?: string;
    avatarBlob?: string;
    avatarUrl?: string;
  };
  units?: string[];
  order: number;
  status: 'active' | 'archived';
  chaptersCount?: number;
  chapters?: CatalogChapterSummary[];
}

export interface ChapterItem {
  id: string;
  number: number;
  title: string;
  shortTitle?: string;
  description?: string;
  estimatedMinutes?: number;
  heroImageBlob?: string;
  heroImageUrl?: string;
  assets?: {
    heroImage?: string;
    heroImageUrl?: string;
    thumbnail?: string;
    thumbnailUrl?: string;
    mindmapImage?: string;
    mindmapImageUrl?: string;
    watermarkSvg?: string;
  };
  status: 'draft' | 'published' | 'archived';
  currentVersion: number;
  topics?: Array<{
    id: string;
    label: string;
    title?: string;
    order?: number;
    topicNum?: number;
    estimatedMinutes?: number;
    subtopics?: string[];
  }>;
  videos?: VideoManifestItem[];
  tools?: Record<string, any>;
  files?: Record<string, { path: string; size?: number; contentType?: string }>;
  signedFiles?: Record<string, string>;
  chapterFiles?: Record<string, string>;
}

export interface PublishRequest {
  id: string;
  tenantId: string;
  scope: string;
  status: 'uploading' | 'pending' | 'approved' | 'rejected' | 'failed';
  diffSummary?: any;
  files: Array<{ path: string; stagingPath: string; size?: number; contentType?: string; sha256?: string }>;
  submittedBy: string;
  submittedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

// ── Registry Operations ───────────────────────────────────────────────

/**
 * Gets tenant public details (branding, signed asset URLs, features, storage config).
 * Omits private authentication fields.
 */
export async function getTenant(tenantId: string): Promise<TenantPublic | null> {
  const cacheKey = `tenant:${tenantId}`;
  const cached = getFromCache<TenantPublic>(cacheKey);
  if (cached) return cached;

  return withInFlight(cacheKey, async () => {
    const doc = await firestore.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    const storageCfg = data.storage || {
      bucket: 'saralvidhya-artifacts',
      prefix: `${tenantId}`,
    };
    const livePrefix = storageCfg.prefix || tenantId;
    const rawBranding = data.branding || { primaryColor: '#2563eb', appName: data.name || tenantId };
    const rawAssets = data.assets || {};

    const logoRef = rawAssets.logo || rawBranding.logoBlob;
    const faviconRef = rawAssets.favicon || rawBranding.faviconBlob;
    const loginBannerRef = rawAssets.loginBanner || rawBranding.loginBannerBlob;

    const [logoUrl, faviconUrl, loginBannerUrl] = await Promise.all([
      resolveStorageAssetUrl(livePrefix, logoRef, 60),
      resolveStorageAssetUrl(livePrefix, faviconRef, 60),
      resolveStorageAssetUrl(livePrefix, loginBannerRef, 60),
    ]);

    const tenant: TenantPublic = {
      id: tenantId,
      name: data.name || tenantId,
      shortName: data.shortName || tenantId,
      academicTerm: data.academicTerm,
      status: data.status || 'active',
      domains: data.domains || [],
      branding: {
        ...rawBranding,
        logoUrl,
        faviconUrl,
        loginBannerUrl,
      },
      assets: {
        ...rawAssets,
        logoUrl,
        faviconUrl,
        loginBannerUrl,
      },
      features: data.features || {},
      hierarchy: data.hierarchy || ['program', 'subject'],
      storage: storageCfg,
    };

    setInCache(cacheKey, tenant, 60);
    return tenant;
  });
}

/**
 * Gets private tenant authentication credentials (internal/auth use only).
 * Cached for 60s and invalidated immediately on password change.
 */
export async function getTenantAuth(tenantId: string): Promise<TenantAuth | null> {
  const cacheKey = `tenant_auth:${tenantId}`;
  const cached = getFromCache<TenantAuth>(cacheKey);
  if (cached) return cached;

  return withInFlight(cacheKey, async () => {
    const doc = await firestore.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    const auth = (data.auth as TenantAuth) || null;
    if (auth) {
      setInCache(cacheKey, auth, 60);
    }
    return auth;
  });
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
  invalidateCache(`tenant_auth:${tenantId}`);
  return newVersion;
}

/**
 * Gets catalog for a tenant (nodes + published subjects + chapter summaries with signed asset URLs).
 */
export async function getCatalog(tenantId: string): Promise<{
  nodes: any[];
  subjects: SubjectItem[];
}> {
  const cacheKey = `catalog:${tenantId}`;
  const cached = getFromCache<{ nodes: any[]; subjects: SubjectItem[] }>(cacheKey);
  if (cached) return cached;

  return withInFlight(cacheKey, async () => {
    const tenant = await getTenant(tenantId);
    const livePrefix = tenant?.storage?.prefix || tenantId;

    const tenantDocRef = firestore.collection('tenants').doc(tenantId);
    const [nodesSnap, subjectsSnap] = await Promise.all([
      tenantDocRef.collection('nodes').orderBy('order', 'asc').get(),
      tenantDocRef.collection('subjects').where('status', '==', 'active').get(),
    ]);

    const nodes = nodesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const subjects = await Promise.all(
      subjectsSnap.docs.map(async (d) => {
        const sdata = d.data();
        const sid = d.id;
        const chSnap = await d.ref.collection('chapters').get();

        const rawChapters = chSnap.docs
          .map((c) => ({ id: c.id, ...c.data() } as Record<string, any>))
          .filter((c) => (c.status || 'published') === 'published')
          .sort((a, b) => (a.number || 0) - (b.number || 0));

        const chapters: CatalogChapterSummary[] = await Promise.all(
          rawChapters.map(async (cd) => {
            const cid = cd.id;
            const chScope = `${sid}/${cid}`;
            const heroRef = normalizeAssetPath(
              chScope,
              cd.assets?.heroImage || cd.heroImageBlob
            );
            const thumbRef = normalizeAssetPath(chScope, cd.assets?.thumbnail);
            const [heroImageUrl, thumbnailUrl] = await Promise.all([
              resolveStorageAssetUrl(livePrefix, heroRef, 60),
              resolveStorageAssetUrl(livePrefix, thumbRef, 60),
            ]);
            const topics = Array.isArray(cd.topics) ? cd.topics : [];
            const videos = Array.isArray(cd.videos) ? cd.videos : [];
            const estimatedMinutes =
              typeof cd.estimatedMinutes === 'number'
                ? cd.estimatedMinutes
                : Math.max(15, topics.length * 10 || 30);

            return {
              id: cid,
              number: cd.number || 0,
              title: cd.title || cid,
              shortTitle: cd.shortTitle || cd.title || cid,
              description: cd.description,
              estimatedMinutes,
              status: cd.status || 'published',
              heroImageBlob: heroRef,
              heroImageUrl,
              thumbnailUrl: thumbnailUrl || heroImageUrl,
              topics,
              topicCount: topics.length,
              videoCount: videos.length,
              tools: cd.tools || {},
            };
          })
        );

        const iconRef = normalizeAssetPath(sid, sdata.assets?.icon || sdata.iconBlob);
        const bannerRef = normalizeAssetPath(sid, sdata.assets?.banner);
        const thumbRef = normalizeAssetPath(sid, sdata.assets?.thumbnail);
        const facultyAvatarRef = normalizeAssetPath(sid, sdata.faculty?.avatarBlob);

        const [iconUrl, bannerUrl, thumbnailUrl, avatarUrl] = await Promise.all([
          resolveStorageAssetUrl(livePrefix, iconRef, 60),
          resolveStorageAssetUrl(livePrefix, bannerRef, 60),
          resolveStorageAssetUrl(livePrefix, thumbRef, 60),
          resolveStorageAssetUrl(livePrefix, facultyAvatarRef, 60),
        ]);

        return {
          id: sid,
          ...(sdata as Omit<SubjectItem, 'id'>),
          subtitle: sdata.subtitle || sdata.programLabel || tenant?.branding?.programLabel,
          programLabel: sdata.programLabel || sdata.subtitle || tenant?.branding?.programLabel,
          iconBlob: iconRef,
          iconUrl,
          bannerUrl,
          assets: {
            ...(sdata.assets || {}),
            iconUrl,
            bannerUrl,
            thumbnailUrl,
          },
          faculty: sdata.faculty
            ? {
                ...sdata.faculty,
                avatarUrl,
              }
            : undefined,
          chapters,
          chaptersCount: chapters.length,
        } as SubjectItem;
      })
    );

    subjects.sort((a, b) => (a.order || 0) - (b.order || 0));

    const result = { nodes, subjects };
    setInCache(cacheKey, result, 60);
    return result;
  });
}

/**
 * Gets chapter details, metadata, signed asset URLs, videos, and resolved files for the active (or requested) version.
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

  return withInFlight(cacheKey, async () => {
    const tenant = await getTenant(tenantId);
    const livePrefix = tenant?.storage?.prefix || tenantId;

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

    const chScope = `${subjectId}/${chapterId}`;
    const rawAssets = chapterData.assets || {};
    const heroRef = normalizeAssetPath(chScope, rawAssets.heroImage || chapterData.heroImageBlob);
    const thumbRef = normalizeAssetPath(chScope, rawAssets.thumbnail);
    const mindmapImgRef = normalizeAssetPath(chScope, rawAssets.mindmapImage);

    const [heroImageUrl, thumbnailUrl, mindmapImageUrl] = await Promise.all([
      resolveStorageAssetUrl(livePrefix, heroRef, 60),
      resolveStorageAssetUrl(livePrefix, thumbRef, 60),
      resolveStorageAssetUrl(livePrefix, mindmapImgRef, 60),
    ]);

    const rawVideos: VideoManifestItem[] = Array.isArray(chapterData.videos)
      ? chapterData.videos
      : [];
    const videos: VideoManifestItem[] = await Promise.all(
      rawVideos.map(async (v) => {
        const vThumbRef = normalizeAssetPath(chScope, v.thumbnail);
        const vGcsRef = normalizeAssetPath(chScope, v.gcsPath);
        const [vThumbUrl, vSignedVideoUrl] = await Promise.all([
          resolveStorageAssetUrl(livePrefix, vThumbRef, 60),
          resolveStorageAssetUrl(livePrefix, vGcsRef, 60),
        ]);
        const fallbackYtThumb =
          v.videoId && !vThumbUrl
            ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`
            : undefined;
        return {
          ...v,
          thumbnailUrl: vThumbUrl || fallbackYtThumb,
          videoUrl: vSignedVideoUrl || v.url,
        };
      })
    );

    const rawFiles: Record<string, { path: string; size?: number; contentType?: string }> =
      versionData?.files || {};
    const signedFiles: Record<string, string> = {};
    const chapterFiles: Record<string, string> = {};
    const chPrefix = `${subjectId}/${chapterId}/`;

    const fileKeys = Object.keys(rawFiles);
    if (fileKeys.length > 0) {
      await Promise.all(
        fileKeys.map(async (key) => {
          const fileEntry = rawFiles[key];
          if (!fileEntry?.path) return;
          const gcsPath = `${livePrefix}/${fileEntry.path.replace(/^\/+/, '')}`;
          try {
            const signed = await getSignedUrlForFile(gcsPath, 60);
            signedFiles[key] = signed;
            const relKey = key.startsWith(chPrefix) ? key.substring(chPrefix.length) : key;
            chapterFiles[relKey] = signed;
          } catch (e) {
            console.warn(`[Registry] Failed signing URL for ${gcsPath}:`, e);
          }
        })
      );
    }

    const topics = Array.isArray(chapterData.topics) ? chapterData.topics : [];
    const estimatedMinutes =
      typeof chapterData.estimatedMinutes === 'number'
        ? chapterData.estimatedMinutes
        : Math.max(15, topics.length * 10 || 30);

    const result: ChapterItem = {
      id: chapterId,
      number: chapterData.number,
      title: chapterData.title,
      shortTitle: chapterData.shortTitle || chapterData.title,
      description: chapterData.description,
      estimatedMinutes,
      heroImageBlob: heroRef,
      heroImageUrl,
      assets: {
        ...rawAssets,
        heroImageUrl,
        thumbnailUrl: thumbnailUrl || heroImageUrl,
        mindmapImageUrl,
      },
      status: chapterData.status || 'published',
      currentVersion: targetVersion,
      topics,
      videos,
      tools: chapterData.tools || {},
      files: rawFiles,
      signedFiles,
      chapterFiles,
    };

    setInCache(cacheKey, result, 60);
    return result;
  });
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
 * and updates tenant, subject, and chapter registry metadata in Firestore.
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
  const chapterGroups = new Map<
    string,
    { subjectId: string; chapterId: string; files: Record<string, any> }
  >();
  const subjectIds = new Set<string>();
  const filePaths = new Set(req.files.map((f) => f.path));

  for (const f of req.files) {
    const parts = f.path.split('/');
    if (parts.length >= 2 && parts[0] !== 'assets' && parts[0] !== 'media') {
      const subjectId = parts[0];
      subjectIds.add(subjectId);
      if (parts.length >= 3 && parts[1] !== 'assets') {
        const chapterId = parts[1];
        const groupKey = `${subjectId}:${chapterId}`;
        if (!chapterGroups.has(groupKey)) {
          chapterGroups.set(groupKey, { subjectId, chapterId, files: {} });
        }
        chapterGroups.get(groupKey)!.files[f.path] = {
          path: f.path,
          size: f.size,
          contentType: f.contentType,
          sha256: f.sha256,
        };
      }
    }
  }

  // Read tenant.json if included
  let tenantMeta: Record<string, any> | null = null;
  if (filePaths.has('tenant.json')) {
    tenantMeta = await readJsonFile(`${livePrefix}/tenant.json`);
  }

  const subjectMeta = new Map<string, any>();
  for (const sid of subjectIds) {
    const p = `${sid}/subject.json`;
    if (filePaths.has(p)) subjectMeta.set(sid, await readJsonFile(`${livePrefix}/${p}`));
  }

  const chapterMeta = new Map<string, any>();
  const chapterVideosMeta = new Map<string, any[]>();
  for (const g of chapterGroups.values()) {
    const key = `${g.subjectId}:${g.chapterId}`;
    const p = `${g.subjectId}/${g.chapterId}/chapter.json`;
    if (filePaths.has(p)) {
      chapterMeta.set(key, await readJsonFile(`${livePrefix}/${p}`));
    }
    const vp = `${g.subjectId}/${g.chapterId}/learn/videos.json`;
    if (filePaths.has(vp)) {
      const vdata = await readJsonFile(`${livePrefix}/${vp}`);
      const vlist = Array.isArray(vdata) ? vdata : Array.isArray(vdata?.videos) ? vdata.videos : [];
      chapterVideosMeta.set(key, vlist);
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

    // Update tenant document with any new metadata from tenant.json
    const tenantUpdate: Record<string, any> = { status: 'active', updatedAt: now };
    if (tenantMeta) {
      for (const k of ['name', 'shortName', 'academicTerm', 'branding', 'assets', 'features', 'hierarchy']) {
        if (tenantMeta[k] !== undefined) tenantUpdate[k] = tenantMeta[k];
      }
      if (Array.isArray(tenantMeta.nodes)) {
        for (const node of tenantMeta.nodes) {
          if (node && node.id) {
            tx.set(tenantRef.collection('nodes').doc(node.id), node, { merge: true });
          }
        }
      }
    }
    tx.set(tenantRef, tenantUpdate, { merge: true });

    // Upsert subject docs (new subjects default to active so they show in the catalog)
    [...subjectIds].forEach((sid, i) => {
      const meta = subjectMeta.get(sid) || {};
      const exists = subjectSnaps[i].exists;
      const doc: Record<string, any> = { updatedAt: now };
      if (meta.name) doc.name = meta.name;
      else if (!exists) doc.name = sid;
      for (const k of [
        'code',
        'subtitle',
        'programLabel',
        'description',
        'credits',
        'parentNodeId',
        'order',
        'status',
        'cardStyle',
        'faculty',
        'units',
      ]) {
        if (meta[k] !== undefined) doc[k] = meta[k];
      }
      if (meta.iconBlob || meta.assets?.icon) {
        doc.iconBlob = normalizeAssetPath(sid, meta.iconBlob || meta.assets?.icon);
      }
      if (meta.assets) {
        const normAssets: Record<string, any> = {};
        for (const [ak, av] of Object.entries(meta.assets)) {
          if (typeof av === 'string') {
            normAssets[ak] = normalizeAssetPath(sid, av);
          }
        }
        doc.assets = normAssets;
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
      const groupKey = `${group.subjectId}:${group.chapterId}`;
      const meta = chapterMeta.get(groupKey) || {};
      const numMatch = group.chapterId.match(/(\d+)/);
      const chScope = `${group.subjectId}/${group.chapterId}`;

      const chDoc: Record<string, any> = {
        currentVersion: nextVer,
        status: 'published',
        updatedAt: now,
      };
      if (meta.title) chDoc.title = meta.title;
      else if (!chSnap.exists) chDoc.title = group.chapterId;
      if (meta.shortTitle !== undefined) chDoc.shortTitle = meta.shortTitle;
      if (meta.description !== undefined) chDoc.description = meta.description;
      if (meta.estimatedMinutes !== undefined) chDoc.estimatedMinutes = meta.estimatedMinutes;
      if (meta.number !== undefined) chDoc.number = meta.number;
      else if (!chSnap.exists) chDoc.number = numMatch ? parseInt(numMatch[1], 10) : 0;
      if (meta.topics) chDoc.topics = meta.topics;

      if (meta.heroImageBlob || meta.assets?.heroImage) {
        chDoc.heroImageBlob = normalizeAssetPath(
          chScope,
          meta.heroImageBlob || meta.assets?.heroImage
        );
      }
      if (meta.assets) {
        const normChAssets: Record<string, any> = {};
        for (const [ak, av] of Object.entries(meta.assets)) {
          normChAssets[ak] =
            ak === 'watermarkSvg'
              ? av
              : typeof av === 'string'
                ? normalizeAssetPath(chScope, av)
                : av;
        }
        chDoc.assets = normChAssets;
      }

      const rawVideos =
        Array.isArray(meta.videos) && meta.videos.length > 0
          ? meta.videos
          : chapterVideosMeta.get(groupKey);
      if (Array.isArray(rawVideos)) {
        chDoc.videos = rawVideos.map((v: any) => ({
          ...v,
          thumbnail: v.thumbnail ? normalizeAssetPath(chScope, v.thumbnail) : undefined,
          gcsPath: v.gcsPath ? normalizeAssetPath(chScope, v.gcsPath) : null,
        }));
      }

      // Auto-detect tools from uploaded files using contract tools.json
      const chapterPrefix = `${group.subjectId}/${group.chapterId}/`;
      const chRelFiles = Object.keys(group.files).map((p) =>
        p.startsWith(chapterPrefix) ? p.substring(chapterPrefix.length) : p
      );
      const inferredTools = detectTools(chRelFiles);
      // If chapter.json defines videos[], also register learn.videos tool
      if (Array.isArray(chDoc.videos) && chDoc.videos.length > 0 && !inferredTools['learn.videos']) {
        inferredTools['learn.videos'] = {
          id: 'learn.videos',
          section: 'learn',
          label: 'Videos',
          order: 23,
        };
      }
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
