import { API_BASE } from '../tenant/TenantProvider';

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  parentNodeId?: string | null;
  iconBlob?: string;
  order: number;
  status: 'active' | 'archived';
  chaptersCount?: number;
  faculty?: {
    name: string;
    title: string;
    avatarBlob?: string;
  };
  units?: string[];
}

export interface ChapterDetails {
  id: string;
  number: number;
  title: string;
  currentVersion: number;
  topics?: Array<{ id: string; label: string; order: number; topicNum?: number }>;
  tools?: Record<string, any>;
}

export interface ChapterResponse {
  chapter: ChapterDetails;
  files: Record<string, string>; // tool/file relative key -> signed URL
}

function getAuthHeaders(tenantId: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem(`sv_session_${tenantId}`);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Registry client providing typed, authenticated access to v2 multi-tenant endpoints.
 */
export const registryClient = {
  /**
   * Fetches published catalog of subjects and nodes for the given tenant.
   */
  async getCatalog(tenantId: string): Promise<{ nodes: any[]; subjects: SubjectItem[] }> {
    const res = await fetch(`${API_BASE}/v2/t/${tenantId}/catalog`, {
      headers: getAuthHeaders(tenantId),
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
   * Fetches chapter metadata and signed file URLs.
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
      headers: getAuthHeaders(tenantId),
    });

    if (!res.ok) {
      throw new Error(`Failed to load chapter ${chapterId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Requests a signed URL for a specific asset path inside the tenant's bucket prefix.
   */
  async getSignedUrl(tenantId: string, filePath: string): Promise<string> {
    const url = new URL(`${API_BASE}/v2/t/${tenantId}/signed-url`);
    url.searchParams.set('path', filePath);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(tenantId),
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
        headers: getAuthHeaders(tenantId),
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
        headers: getAuthHeaders(tenantId),
      });
      if (!res.ok) return {};
      const data = await res.json();
      return data.progress || {};
    } catch {
      return {};
    }
  },
};

export default registryClient;
