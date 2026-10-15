import {
  API_BASE_URL,
  BACKEND_SUBJECTS,
  LEVEL_TO_PERSONA,
  DifficultyLevel,
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  getLocalSubjectBaseUrl,
  GCS_BACKEND_SUBJECTS,
  GCS_API_BASE,
  GCS_SUBJECT_MAP,
  resolveSubjectId,
  getRegistryChapterData,
} from './manifestService';

export interface FlashCard {
  id?: string;
  front: string;
  back: string;
  infographicUrl?: string;
  mermaidDiagram?: string;
}

export interface FlashCardSet {
  chapter: string;
  subject: string;
  flashcards: FlashCard[];
}

function mapRawCards(
  cards: any[],
  chapterFiles: Record<string, string>,
  subjectPath?: string,
  chDir?: string,
  normLevel: DifficultyLevel = 'intermediate',
  localBase?: string
): FlashCard[] {
  return cards.map((c: any, index: number) => {
    let infoUrl = c.infographicUrl || c.infographic || c.image || c.infographic_ref;
    if (!infoUrl && c.img) {
      const m = typeof c.img === 'string' ? c.img.match(/!\[.*?\]\((.+?)\)/) : null;
      infoUrl = m
        ? m[1].trim()
        : typeof c.img === 'string' && c.img.startsWith('data:')
        ? c.img.trim()
        : undefined;
    }
    for (const field of [c.answer, c.back, c.definition]) {
      if (!infoUrl && typeof field === 'string') {
        const m =
          field.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i) ||
          field.match(/!\[.*?\]\((data:image\/[^)]+)\)/i);
        if (m) infoUrl = m[1].trim();
      }
    }

    // Conventional per-card infographic path when card JSON does not inline infographicUrl
    const conventionalRel = `practice/flashcards/images/card_${normLevel}_${index + 1}.webp`;
    if (!infoUrl) {
      if (chapterFiles[conventionalRel]) {
        infoUrl = chapterFiles[conventionalRel];
      } else if (localBase && chDir) {
        infoUrl = `${import.meta.env.BASE_URL || '/'}${localBase.replace(/^\//, '')}/${chDir}/${conventionalRel}`.replace(
          /\/\//g,
          '/'
        );
      }
    }

    // Resolve relative paths via chapterFiles signed URLs first
    if (
      infoUrl &&
      !infoUrl.startsWith('http://') &&
      !infoUrl.startsWith('https://') &&
      !infoUrl.startsWith('data:')
    ) {
      const cleanRel = infoUrl.replace(/^\.?\//, '');
      const signedCandidate =
        chapterFiles[`practice/flashcards/${cleanRel}`] ||
        chapterFiles[cleanRel] ||
        chapterFiles[`media/${cleanRel}`];
      if (signedCandidate) {
        infoUrl = signedCandidate;
      } else if (infoUrl.startsWith('/api/')) {
        infoUrl = `${GCS_API_BASE}${infoUrl}`;
      } else if (infoUrl.startsWith('/generated_resources/')) {
        infoUrl = `${import.meta.env.BASE_URL || '/'}${infoUrl.replace(/^\//, '')}`.replace(/\/\//g, '/');
      } else if (subjectPath && chDir) {
        infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${cleanRel}`;
      }
    }

    return {
      id: c.id || c.card_id,
      front: c.front ?? c.question ?? c.term ?? '',
      back: c.back ?? c.answer ?? c.definition ?? '',
      infographicUrl: infoUrl,
      mermaidDiagram: c.mermaid_diagram || c.mermaid || undefined,
    };
  });
}

export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
  videoDir?: string
): Promise<FlashCard[]> {
  await getManifest();

  const normSubject = resolveSubjectId(subject) || subject;
  const lvlStr = (level as string) || 'intermediate';
  const normLevel: DifficultyLevel =
    lvlStr === 'beginner' || lvlStr === 'easy' || lvlStr === 'naive'
      ? 'beginner'
      : lvlStr === 'advanced' || lvlStr === 'hard' || lvlStr === 'above_average'
      ? 'advanced'
      : 'intermediate';

  const localBase = getLocalSubjectBaseUrl(normSubject);
  const subjectPath = GCS_SUBJECT_MAP[normSubject] || GCS_SUBJECT_MAP[subject];
  const chDir = getChapterDir(normSubject, chapterNumber);

  // 1. Primary Cloud-Native Path: V4 Signed URLs from v2 Registry Chapter files
  const regCh = await getRegistryChapterData(normSubject, chapterNumber);
  const chapterFiles = regCh?.files || {};
  const signedDeckUrl =
    chapterFiles[`practice/flashcards/${normLevel}.json`] ||
    chapterFiles['practice/flashcards/revise.json'] ||
    chapterFiles['practice/flashcards/flashcards.json'];

  if (signedDeckUrl) {
    try {
      const res = await fetch(signedDeckUrl);
      if (res.ok) {
        const data = await res.json();
        const cards = Array.isArray(data) ? data : data.flashcards || data.cards || [];
        if (cards.length > 0) {
          return mapRawCards(cards, chapterFiles, subjectPath, chDir, normLevel, localBase);
        }
      }
    } catch (e) {
      console.warn('[Registry] Failed fetching signed flashcard deck', e);
    }
  }

  // 2. Cloud Run /api/content fallback
  const isGcs = GCS_BACKEND_SUBJECTS.has(normSubject) || GCS_BACKEND_SUBJECTS.has(subject);
  if (isGcs) {
    const url = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/practice/flashcards?persona=${normLevel}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const cards = Array.isArray(data) ? data : data.flashcards || data.cards || [];
        if (cards.length > 0) {
          return mapRawCards(cards, chapterFiles, subjectPath, chDir, normLevel, localBase);
        }
      }
    } catch (e) {
      console.warn('[GCS] Failed or timed out fetching flashcards', url, e);
    }
    return [];
  }

  if (BACKEND_SUBJECTS.has(subject)) {
    try {
      const persona = LEVEL_TO_PERSONA[normLevel] || 'Intermediate';
      const res = await fetch(`${API_BASE_URL}/folders/${subject}/flashcards?persona=${persona}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({
            front: c.front ?? '',
            back: c.back ?? '',
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch flashcards from API', e);
    }
  }

  const subjectBase = getSubjectBaseUrl(subject);

  const chDirsToTry = Array.from(
    new Set([chDir, `chapter_${String(chapterNumber).padStart(2, '0')}`, `chapter_${chapterNumber}`])
  );

  const basesToTry = Array.from(new Set([localBase, subjectBase]));

  const paths: string[] = [];
  for (const base of basesToTry) {
    for (const ch of chDirsToTry) {
      if (videoDir) {
        paths.push(
          `${base}/${ch}/${videoDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
          `${base}/${ch}/${videoDir}/Prepare/Flashcards/prep_flashcards.md`
        );
      }
      paths.push(
        `${base}/${ch}/practice/flashcards/${normLevel}.json`,
        `${base}/${ch}/Learn/Flashcards/flashcards_${normLevel}.md`,
        `${base}/${ch}/Prepare/Flashcards/prep_flashcards.md`,
        `${base}/${ch}/${normLevel}/flashcards_${normLevel}.md`,
        `${base}/${ch}/${normLevel}/flashcards.json`,
        `${base}/${ch}/flashcards.json`
      );
    }
  }

  for (const url of paths) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) continue;
      const data = await res.text();
      const parsed = JSON.parse(data);
      const rawCards = Array.isArray(parsed)
        ? parsed
        : parsed.flashcards || parsed.cards || parsed.items || [];
      if (rawCards.length > 0) {
        return mapRawCards(rawCards, chapterFiles, subjectPath, chDir, normLevel, localBase);
      }
    } catch {
      // try next
    }
  }
  return [{ front: 'Error', back: 'Could not load flashcards.' }];
}
