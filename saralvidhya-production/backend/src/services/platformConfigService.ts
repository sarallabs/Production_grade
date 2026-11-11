import { firestore } from './registry.js';
import { getSignedUrlForFile, resolveStorageAssetUrl } from './storage.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const platformCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = platformCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  platformCache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T, ttlSeconds = 120): void {
  platformCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidatePlatformConfigCache(): void {
  platformCache.clear();
}

export interface GlobalPlatformConfig {
  uiCopy: Record<string, any>;
  translations: Record<string, Record<string, string>>;
  assets: {
    brandTreeLogo?: string;
    brandTreeLogoUrl?: string;
    boardLogos: Record<string, string>;
    boardLogoUrls: Record<string, string>;
    publicImages: Record<string, string>;
    publicImageUrls: Record<string, string>;
  };
  subjectRouting: {
    cloudRoutes: Record<string, string>;
    localSubjectMap: Record<string, string>;
    boardNames: Record<string, string>;
    boardTenantAliases: Record<string, string>;
    defaultVisibleBoards: string[];
  };
  resourceTabs: [string, string][];
  updatedAt?: string;
}

const DEFAULT_PUBLIC_IMAGES: Record<string, string> = {
  '/ask_icon.png': '_global/assets/ask_icon.png',
  '/ask_icon_black.png': '_global/assets/ask_icon_black.png',
  '/brand-logo.png': '_global/assets/brand-logo.png',
  '/brand-tree-cropped.png': '_global/assets/brand-tree-cropped.png',
  '/brand-tree-logo.png': '_global/assets/brand-tree-logo.png',
  '/chapter-dbms-hero.png': '_global/assets/chapter-dbms-hero.png',
  '/chapter-digestive-hero.png': '_global/assets/chapter-digestive-hero.png',
  '/chapter-entomology-hero.png': '_global/assets/chapter-entomology-hero.png',
  '/chapter-metamorphosis-hero.png': '_global/assets/chapter-metamorphosis-hero.png',
  '/chapter-pollination-hero.png': '_global/assets/chapter-pollination-hero.png',
  '/chapter-weathering-hero.png': '_global/assets/chapter-weathering-hero.png',
  '/key_takeaways_icon.png': '_global/assets/key_takeaways_icon.png',
  '/key_takeaways_icon_black.png': '_global/assets/key_takeaways_icon_black.png',
  '/logo-angrau.png': '_global/assets/logo-angrau.png',
  '/logo-clean.png': '_global/assets/logo-clean.png',
  '/logo-mlrit.png': '_global/assets/logo-mlrit.png',
  '/logo.jpg': '_global/assets/logo.jpg',
  '/metamorphosis-icon.png': '_global/assets/metamorphosis-icon.png',
  '/mindmap_brain.png': '_global/assets/mindmap_brain.png',
  '/mindmap_brain_black.png': '_global/assets/mindmap_brain_black.png',
  '/mindmap_brain_blue.png': '_global/assets/mindmap_brain_blue.png',
  '/mindmap_brain_dca27d.png': '_global/assets/mindmap_brain_dca27d.png',
  '/mindmap_brain_fdbe8a.png': '_global/assets/mindmap_brain_fdbe8a.png',
  '/mindmap_brain_gold.png': '_global/assets/mindmap_brain_gold.png',
  '/mindmap_brain_gold_bright.png': '_global/assets/mindmap_brain_gold_bright.png',
  '/mindmap_brain_white.png': '_global/assets/mindmap_brain_white.png',
  '/mindmap_icon.png': '_global/assets/mindmap_icon.png',
  '/mindmap_icon.svg': '_global/assets/mindmap_icon.svg',
  '/mindmap_icon_black.png': '_global/assets/mindmap_icon_black.png',
  '/neb-logo.png': '_global/assets/neb-logo.png',
  '/persona-advanced.png': '_global/assets/persona-advanced.png',
  '/persona-beginner.png': '_global/assets/persona-beginner.png',
  '/persona-intermediate.png': '_global/assets/persona-intermediate.png',
  '/saral-vidhya-logo.png': '_global/assets/saral-vidhya-logo.png',
  '/study_plan_icon.png': '_global/assets/study_plan_icon.png',
  '/study_plan_icon_black.png': '_global/assets/study_plan_icon_black.png',
  '/subject-book-icon.png': '_global/assets/subject-book-icon.png',
  '/subject-dbms-icon.png': '_global/assets/subject-dbms-icon.png',
  '/subject-entomology-icon.png': '_global/assets/subject-entomology-icon.png',
};

/**
 * Loads the DB-driven global platform configuration (`platformConfig/global` in Firestore)
 * and resolves all global GCS assets (`_global/assets/*`) into signed URLs.
 */
export async function getGlobalPlatformConfig(): Promise<GlobalPlatformConfig> {
  const cached = getCached<GlobalPlatformConfig>('global_platform_config');
  if (cached) return cached;

  const snap = await firestore.collection('platformConfig').doc('global').get();
  const data = snap.exists ? snap.data()! : {};

  const rawAssets = data.assets || {};
  const rawBoardLogos: Record<string, string> = rawAssets.boardLogos || {
    angrau: '_global/assets/logo-angrau.png',
    angrau_university: '_global/assets/logo-angrau.png',
    mlrit: '_global/assets/logo-mlrit.png',
  };
  const rawPublicImages: Record<string, string> = {
    ...DEFAULT_PUBLIC_IMAGES,
    ...(rawAssets.publicImages || {}),
  };

  const brandTreeLogoUrl = await resolveStorageAssetUrl(
    '_global',
    rawAssets.brandTreeLogo || 'assets/brand-tree-cropped.png',
    120
  );

  const boardLogoUrls: Record<string, string> = {};
  await Promise.all(
    Object.entries(rawBoardLogos).map(async ([boardKey, gcsPath]) => {
      if (!gcsPath) return;
      try {
        if (gcsPath.startsWith('http://') || gcsPath.startsWith('https://')) {
          boardLogoUrls[boardKey] = gcsPath;
        } else {
          const clean = gcsPath.replace(/^\/+/, '');
          const signed = await getSignedUrlForFile(clean, 120);
          if (signed) boardLogoUrls[boardKey] = signed;
        }
      } catch {
        // Ignore missing optional board logo
      }
    })
  );

  const publicImageUrls: Record<string, string> = {};
  await Promise.all(
    Object.entries(rawPublicImages).map(async ([publicKey, gcsPath]) => {
      if (!gcsPath) return;
      try {
        if (gcsPath.startsWith('http://') || gcsPath.startsWith('https://')) {
          publicImageUrls[publicKey] = gcsPath;
          publicImageUrls[publicKey.replace(/^\/+/, '')] = gcsPath;
        } else {
          const clean = gcsPath.replace(/^\/+/, '');
          const signed = await getSignedUrlForFile(clean, 120);
          if (signed) {
            publicImageUrls[publicKey] = signed;
            publicImageUrls[publicKey.replace(/^\/+/, '')] = signed;
          }
        }
      } catch {
        // Ignore missing optional asset
      }
    })
  );

  const result: GlobalPlatformConfig = {
    uiCopy: data.uiCopy || {},
    translations: data.translations || {},
    assets: {
      ...rawAssets,
      brandTreeLogoUrl,
      boardLogos: rawBoardLogos,
      boardLogoUrls,
      publicImages: rawPublicImages,
      publicImageUrls,
    },
    subjectRouting: data.subjectRouting || {
      cloudRoutes: {
        ento_131: 'angrau/entomology',
        entomology: 'angrau/entomology',
        dbms: 'mlrit/dbms',
      },
      localSubjectMap: {
        ento_131: 'angrau/entomology',
        entomology: 'angrau/entomology',
        dbms: 'mlrit/dbms',
      },
      boardNames: {
        angrau: 'Acharya N. G. Ranga Agricultural University',
        angrau_university: 'Acharya N. G. Ranga Agricultural University',
        mlrit: 'MLR Institute of Technology',
      },
      boardTenantAliases: {
        angrau: 'angrau_university',
        angrau_university: 'angrau',
        mlrit: 'mlrit',
      },
      defaultVisibleBoards: ['angrau_university', 'mlrit'],
    },
    resourceTabs: Array.isArray(data.resourceTabs)
      ? data.resourceTabs.map((item: any) =>
          Array.isArray(item)
            ? [String(item[0] || ''), String(item[1] || '')]
            : [String(item?.file || ''), String(item?.label || '')]
        )
      : [
          ['summary.md', 'Quick Study'],
          ['study_guide.md', 'Study Guide'],
          ['detailed_view.md', 'Detailed View'],
          ['mindmap.md', 'Mindmap'],
          ['flashcards', 'Flashcards'],
          ['question_bank.md', 'Quiz'],
          ['study_plan.md', 'Study Plan'],
          ['learning_path.md', 'Learning Path'],
          ['podcast_script.md', 'Podcast Script'],
          ['youtube_links.md', 'YouTube Links'],
          ['course_offerings.md', 'Course Info'],
        ],
    updatedAt: data.updatedAt,
  };

  setCached('global_platform_config', result, 120);
  return result;
}

/**
 * Loads the cloud-stored fallback manifest (`platformConfig/manifest`) and catalog (`platformConfig/catalog`)
 * from Firestore + GCS so the frontend never needs local `/generated_resources/manifest.json` or `catalog.json`.
 */
export async function getCloudManifestAndCatalog(): Promise<{
  manifest: Record<string, any>;
  catalog: Record<string, any>;
}> {
  const cached = getCached<{ manifest: Record<string, any>; catalog: Record<string, any> }>(
    'cloud_manifest_catalog'
  );
  if (cached) return cached;

  const [manifestDoc, catalogDoc] = await Promise.all([
    firestore.collection('platformConfig').doc('manifest').get(),
    firestore.collection('platformConfig').doc('catalog').get(),
  ]);

  const manifestData = manifestDoc.exists ? manifestDoc.data()! : { subjects: [] };
  const catalogData = catalogDoc.exists ? catalogDoc.data()! : { version: 2, boards: [] };

  const rawManifest = manifestData.manifest || manifestData;
  if (Array.isArray(rawManifest.resourceTabs)) {
    rawManifest.resourceTabs = rawManifest.resourceTabs.map((item: any) =>
      Array.isArray(item)
        ? [String(item[0] || ''), String(item[1] || '')]
        : [String(item?.file || ''), String(item?.label || '')]
    );
  }

  const result = {
    manifest: rawManifest,
    catalog: catalogData.catalog || catalogData,
  };
  setCached('cloud_manifest_catalog', result, 120);
  return result;
}

/**
 * Loads DB-driven mock test and PYQ question banks from Firestore (`platformConfig/practiceFallbacks`
 * and optional tenant override `tenants/{tenantId}/practiceBanks/{subjectId}`).
 */
export async function getCloudPracticeBank(
  tenantId: string,
  subjectId?: string
): Promise<Record<string, any>> {
  const cacheKey = `practice_bank:${tenantId}:${subjectId || 'all'}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached) return cached;

  const [globalDoc, tenantDoc] = await Promise.all([
    firestore.collection('platformConfig').doc('practiceFallbacks').get(),
    subjectId
      ? firestore
          .collection('tenants')
          .doc(tenantId)
          .collection('practiceBanks')
          .doc(subjectId)
          .get()
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const globalData = globalDoc.exists ? globalDoc.data()! : {};
  const tenantData = tenantDoc && tenantDoc.exists ? tenantDoc.data()! : {};

  const result = {
    mockTestTemplates: {
      ...(globalData.mockTestTemplates || {}),
      ...(tenantData.mockTestTemplates || {}),
    },
    pyqQuestionsBySubject: {
      ...(globalData.pyqQuestionsBySubject || {}),
      ...(subjectId && Array.isArray(tenantData.pyqQuestions)
        ? { [subjectId]: tenantData.pyqQuestions }
        : {}),
    },
    pyqQuestions: Array.isArray(tenantData.pyqQuestions)
      ? tenantData.pyqQuestions
      : Array.isArray(globalData.pyqQuestions)
      ? globalData.pyqQuestions
      : [],
    availableSubjects: Array.isArray(globalData.availableSubjects)
      ? globalData.availableSubjects
      : [],
    subjectMeta: globalData.subjectMeta || {},
  };

  setCached(cacheKey, result, 120);
  return result;
}
