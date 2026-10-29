import { API_BASE } from '../tenant/TenantProvider';
import { getCloudAuthHeaders } from '../context/CloudStateContext';

export interface ChapterSummaryItem {
  id: string;
  number: number;
  title: string;
  shortTitle?: string;
  description?: string;
  estimatedMinutes?: number;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  mindmapImageUrl?: string;
  assets?: {
    heroImage?: string;
    thumbnail?: string;
    mindmapImage?: string;
    watermarkSvg?: string;
    heroImageUrl?: string;
    thumbnailUrl?: string;
    mindmapImageUrl?: string;
    watermarkSvgUrl?: string;
  };
  topics?: Array<{
    id: string;
    label: string;
    order: number;
    topicNum?: number;
    subtopics?: string[];
    estimatedMinutes?: number;
  }>;
  videos?: Array<{
    id: string;
    title: string;
    provider?: 'youtube' | 'gcs' | 'external';
    videoId?: string;
    gcsPath?: string;
    url?: string;
    videoUrl?: string;
    thumbnail?: string;
    thumbnailUrl?: string;
    duration?: string;
    durationSeconds?: number;
    topics?: string[];
    order?: number;
  }>;
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
  thumbnailUrl?: string;
  assets?: {
    icon?: string;
    banner?: string;
    thumbnail?: string;
    iconUrl?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
  };
  cardStyle?: {
    accentColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    badgeText?: string;
  };
  order: number;
  status: 'active' | 'archived';
  chaptersCount?: number;
  chapters?: ChapterSummaryItem[];
  faculty?: {
    name: string;
    title: string;
    avatarBlob?: string;
    avatarUrl?: string;
  };
  units?: string[];
}

export interface ChapterDetails extends ChapterSummaryItem {
  currentVersion: number;
}

export interface ChapterResponse {
  chapter: ChapterDetails;
  files: Record<string, string>; // tool/file relative key -> V4 signed URL
}

/**
 * Registry client providing typed, authenticated access to v2 multi-tenant endpoints.
 * Zero browser storage is used; authentication uses in-memory token and HttpOnly cookies.
 */
export const registryClient = {
  /**
   * Fetches published catalog of subjects and chapters (with signed icon/hero URLs) for the given tenant.
   */
  async getCatalog(tenantId: string): Promise<{ nodes: any[]; subjects: SubjectItem[] }> {
    const res = await fetch(`${API_BASE}/v2/t/${tenantId}/catalog`, {
      headers: getCloudAuthHeaders(tenantId),
    });

    if (!res.ok) {
      throw new Error(`Failed to load catalog for ${tenantId}: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      nodes: data.nodes || [],
      subjects: data.subjects || [],
    };
  },

  /**
   * Fetches chapter metadata and V4 signed file URLs.
   */
  async getChapter(
    tenantId: string,
    subjectId: string,
    chapterId: string,
    version?: number
  ): Promise<ChapterResponse> {
    const url = new URL(`${API_BASE}/v2/t/${tenantId}/subjects/${subjectId}/chapters/${chapterId}`);
    if (version) {
      url.searchParams.set('version', String(version));
    }

    const res = await fetch(url.toString(), {
      headers: getCloudAuthHeaders(tenantId),
    });

    if (!res.ok) {
      throw new Error(`Failed to load chapter ${chapterId}: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      ...data,
      files: {
        ...(data.files || {}),
        ...(data.chapterFiles || {}),
      },
    };
  },

  /**
   * Requests a signed URL for a specific asset path inside the tenant's bucket prefix.
   */
  async getSignedUrl(tenantId: string, filePath: string): Promise<string> {
    const url = new URL(`${API_BASE}/v2/t/${tenantId}/signed-url`);
    url.searchParams.set('path', filePath);

    const res = await fetch(url.toString(), {
      headers: getCloudAuthHeaders(tenantId),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate signed URL for ${filePath}`);
    }

    const data = await res.json();
    return data.signedUrl;
  },

  /**
   * Saves student progress for a specific tool.
   */
  async saveProgress(
    tenantId: string,
    subjectId: string,
    chapterId: string,
    tool: string,
    data: any
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/v2/t/${tenantId}/progress`, {
        method: 'POST',
        headers: getCloudAuthHeaders(tenantId),
        body: JSON.stringify({ subjectId, chapterId, tool, data }),
      });
      return res.ok;
    } catch (e) {
      console.warn('[registryClient] saveProgress error:', e);
      return false;
    }
  },

  /**
   * Fetches student progress for a chapter across all tools.
   */
  async getProgress(
    tenantId: string,
    subjectId: string,
    chapterId: string
  ): Promise<Record<string, any>> {
    try {
      const res = await fetch(`${API_BASE}/v2/t/${tenantId}/progress/${subjectId}/${chapterId}`, {
        headers: getCloudAuthHeaders(tenantId),
      });
      if (!res.ok) return {};
      const data = await res.json();
      return data.progress || {};
    } catch {
      return {};
    }
  },
  /**
   * Fetches the DB-driven fallback manifest and catalog from Firestore (`platformConfig/manifest` & `platformConfig/catalog`).
   */
  async getCloudManifest(tenantId: string): Promise<{ manifest: any; catalog: any }> {
    const res = await fetch(`${API_BASE}/v2/t/${tenantId}/cloud-manifest`, {
      headers: getCloudAuthHeaders(tenantId),
    });
    if (!res.ok) {
      throw new Error(`Failed to load cloud manifest for ${tenantId}: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetches DB-driven Mock Test templates and PYQ question banks from Firestore.
   */
  async getPracticeFallback(tenantId: string, subjectId?: string): Promise<Record<string, any>> {
    const url = new URL(`${API_BASE}/v2/t/${tenantId}/practice-fallback`);
    if (subjectId) url.searchParams.set('subjectId', subjectId);
    const res = await fetch(url.toString(), {
      headers: getCloudAuthHeaders(tenantId),
    });
    if (!res.ok) {
      throw new Error(`Failed to load practice fallback for ${tenantId}: HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Sends a batch of analytics telemetry events to Cloud Run + Firestore + GCP Cloud Logging.
   */
  async sendAnalyticsBatch(
    tenantId: string,
    payload: {
      events: any[];
      sessionId?: string;
      userId?: string;
      userEmail?: string;
      displayName?: string;
      path?: string;
    }
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/v2/t/${tenantId}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCloudAuthHeaders(tenantId),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

export { getRegistryChapterData, resolveAssetUrl } from './manifestService';

export default registryClient;
