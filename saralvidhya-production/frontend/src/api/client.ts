/**
 * Central API client for the SaralVidhya backend.
 * All fetch calls go through here — never call fetch() directly in components.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function getAuthToken(): Promise<string> {
  // Import Firebase Auth lazily to avoid circular deps
  const { auth } = await import('../services/firebase');
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res;
}

// ── Content ──────────────────────────────────────────────────────

export async function fetchContent(
  university: string,
  subject: string,
  chapter: string,
  level: string,
  file: string
): Promise<string> {
  const res = await apiFetch(`/api/content/${university}/${subject}/${chapter}/${level}/${file}`);
  return res.text();
}

export function getPodcastUrl(
  university: string,
  subject: string,
  chapter: string,
  level: string
): string {
  // Returns a URL — audio element handles streaming natively
  return `${API_BASE}/api/content/${university}/${subject}/${chapter}/${level}/podcast.mp3`;
}

export async function fetchChapterMetadata(
  university: string,
  subject: string,
  chapter: string
) {
  const res = await apiFetch(`/api/content/${university}/${subject}/${chapter}/metadata`);
  return res.json();
}

// ── Gemini ───────────────────────────────────────────────────────

export async function askGemini(question: string, context: string, level: string) {
  const res = await apiFetch('/api/gemini/ask', {
    method: 'POST',
    body: JSON.stringify({ question, context, level }),
  });
  return res.json() as Promise<{ answer: string }>;
}

// ── Users ────────────────────────────────────────────────────────

export async function getUserProfile() {
  const res = await apiFetch('/api/users/profile');
  return res.json();
}

export async function saveUserProfile(profile: {
  name: string;
  university: string;
  subject: string;
  level: string;
}) {
  await apiFetch('/api/users/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function saveProgress(data: {
  university: string;
  subject: string;
  chapter: string;
  level: string;
  tool: string;
  completed: boolean;
}) {
  await apiFetch('/api/users/progress', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Assessment ───────────────────────────────────────────────────

export async function submitAssessment(data: {
  university: string;
  subject: string;
  chapter: string;
  level: string;
  score: number;
  total: number;
  answers: any[];
}) {
  const res = await apiFetch('/api/assessment/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}
