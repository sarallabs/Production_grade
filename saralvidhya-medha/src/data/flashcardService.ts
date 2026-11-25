import { 
  API_BASE_URL, 
  BACKEND_SUBJECTS, 
  LEVEL_TO_PERSONA, 
  DifficultyLevel,
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  getChapterVideos,
  filterIndexedCandidates,
  fetchCachedText
} from './manifestService';

export interface FlashCard {
  id?: string;
  front: string;
  back: string;
  infographicUrl?: string;
}

export interface FlashCardSet {
  chapter: string;
  subject: string;
  flashcards: FlashCard[];
}

const flashcardsCache = new Map<string, Promise<FlashCard[]>>();

export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
  videoDir?: string,
): Promise<FlashCard[]> {
  const cacheKey = `${subject}:${chapterNumber}:${level}:${videoDir || ''}`;
  const cached = flashcardsCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
    await getManifest();

    if (BACKEND_SUBJECTS.has(subject)) {
      try {
        const persona = LEVEL_TO_PERSONA[level] || 'Intermediate';
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

    const chDir = getChapterDir(subject, chapterNumber);
    const subjectBase = getSubjectBaseUrl(subject);
    const lvlStr = (level as string) || 'intermediate';
    const normLevel: DifficultyLevel =
      lvlStr === 'beginner' || lvlStr === 'easy' || lvlStr === 'naive'
        ? 'beginner'
        : lvlStr === 'advanced' || lvlStr === 'hard' || lvlStr === 'above_average'
        ? 'advanced'
        : 'intermediate';

    const paths = [
      ...(videoDir
        ? [
            `${subjectBase}/${chDir}/${videoDir}/Learn/Flashcards/flashcards_${normLevel}.json`,
            `${subjectBase}/${chDir}/${videoDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
            `${subjectBase}/${chDir}/${videoDir}/Prepare/Revise/flashcards_revise.json`,
            `${subjectBase}/${chDir}/${videoDir}/Prepare/Revise/flashcards_revise.md`,
            `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/prep_flashcards.md`,
            `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/flashcards_prep_master.md`,
          ]
        : []),
      `${subjectBase}/${chDir}/Learn/Flashcards/flashcards_${normLevel}.json`,
      `${subjectBase}/${chDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
      `${subjectBase}/${chDir}/unit_1/Learn/Flashcards/flashcards_${normLevel}.md`,
      `${subjectBase}/${chDir}/Prepare/Revise/flashcards_revise.json`,
      `${subjectBase}/${chDir}/Prepare/Revise/flashcards_revise.md`,
      `${subjectBase}/${chDir}/Prepare/Flashcards/prep_flashcards.md`,
      `${subjectBase}/${chDir}/Prepare/Flashcards/flashcards_prep_master.md`,
      `${subjectBase}/${chDir}/unit_1/Prepare/Flashcards/prep_flashcards.md`,
      `${subjectBase}/${chDir}/Practice/Revise/Flashcards_Chapter/flashcards_revise_main.json`,
      `${subjectBase}/${chDir}/Practice/Revise/Flashcards_Chapter/flashcards_revise_main.md`,
      `${subjectBase}/${chDir}/${normLevel}/flashcards_${normLevel}.md`,
      `${subjectBase}/${chDir}/${normLevel}/flashcards.md`,
      `${subjectBase}/${chDir}/${normLevel}/flashcards.json`,
      `${subjectBase}/${chDir}/flashcards.md`,
      `${subjectBase}/${chDir}/flashcards.json`,
      `${subjectBase}/${chDir}/prep_flashcards.md`,
    ];

    const resolveAssetUrl = (rawVal: unknown, folderUrl: string): string | undefined => {
      let candidate: string | undefined;
      if (typeof rawVal === 'string') {
        candidate = rawVal.trim();
      } else if (rawVal && typeof rawVal === 'object') {
        const obj = rawVal as Record<string, unknown>;
        const nested = obj.base64_data_uri ?? obj.url ?? obj.src ?? obj.path;
        if (typeof nested === 'string') candidate = nested.trim();
      }
      if (!candidate) return undefined;
      if (
        candidate.startsWith('http://') ||
        candidate.startsWith('https://') ||
        candidate.startsWith('data:') ||
        candidate.startsWith('/')
      ) {
        return candidate;
      }
      const parts = folderUrl.split('/').filter(Boolean);
      for (const seg of candidate.split('/')) {
        const dec = decodeURIComponent(seg);
        if (!dec || dec === '.') continue;
        if (dec === '..') parts.pop();
        else parts.push(dec);
      }
      return '/' + parts.map((p) => encodeURIComponent(p)).join('/');
    };

    const normalizeJsonCards = (parsed: any, folderUrl: string): FlashCard[] => {
      const rawCards: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.flashcards)
          ? parsed.flashcards
          : Array.isArray(parsed?.cards)
            ? parsed.cards
            : Array.isArray(parsed?.items)
              ? parsed.items
              : [];

      return rawCards
        .map((c: any) => {
          if (!c || typeof c !== 'object') return null;
          const front = String(c.front ?? c.term ?? c.question ?? c.q ?? '').trim();
          const back = String(c.back ?? c.definition ?? c.answer ?? c.a ?? '').trim();
          if (!front || !back) return null;
          const infoUrl =
            resolveAssetUrl(c.infographicUrl, folderUrl) ||
            resolveAssetUrl(c.image, folderUrl) ||
            resolveAssetUrl(c.infographic, folderUrl) ||
            resolveAssetUrl(c.visual_base64, folderUrl);
          return {
            front,
            back,
            infographicUrl: infoUrl,
          } as FlashCard;
        })
        .filter((c): c is FlashCard => c !== null);
    };

    const indexedPaths = filterIndexedCandidates(paths);
    const candidatePaths = indexedPaths.length > 0 ? indexedPaths : paths;

    for (const url of candidatePaths) {
      try {
        let data = await fetchCachedText(url);
        if (!data) continue;

        const folderUrl = url.substring(0, url.lastIndexOf('/'));
        data = data.replace(/!\[(.*?)\]\((.*?)\)/g, (_match, _alt, rawPath) => {
          const fullUrl = resolveAssetUrl(rawPath, folderUrl) || rawPath;
          return `<!-- INFOGRAPHIC_URL:${fullUrl} -->`;
        });

        let cards: FlashCard[] = [];

        const trimmed = data.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            cards = normalizeJsonCards(parsed, folderUrl);
          } catch {
            // malformed JSON — fall through to next candidate (e.g. .md)
          }
          if (cards.length > 0) return cards;
          continue;
        }

        const jsonMatch = data.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            cards = normalizeJsonCards(parsed, folderUrl);
          } catch {
            // ignore
          }
        }

        const cleanBackMeta = (rawBack: string, cardIdx: number): { back: string; infographicUrl?: string } => {
          let back = rawBack.trim();
          let infographicUrl: string | undefined;
          const infoMatch = back.match(/<!-- INFOGRAPHIC_URL:(.*?) -->/);
          if (infoMatch) {
            infographicUrl = infoMatch[1];
            back = back.replace(infoMatch[0], '').trim();
          }
          const isPhysics = subject === 'anu_physics' || subject.includes('physics');
          if (isPhysics) {
            const lower = (infographicUrl || '').toLowerCase();
            if (!infographicUrl || lower.includes('placeholder') || lower.includes('generated_infographics') || lower.includes('infographic_card') || lower.includes('dummy')) {
              const PHYSICS_REAL_INFOGRAPHICS = [
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Overview.png',
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/1.%20Klein-Gordon%20Equation/klein_gordon_infographic.png',
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/2.%20Dirac%20Equation/dirac_equation_infographic.png',
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/3.%20Fine%20Structure/fine_structure_infographic.png',
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/4.%20Relativistic%20Corrections/relativistic_corrections_infographic.png',
                '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Mind_Map.png',
              ];
              infographicUrl = PHYSICS_REAL_INFOGRAPHICS[cardIdx % PHYSICS_REAL_INFOGRAPHICS.length];
            }
          }
          back = back
            .replace(
              /(?:^|\n)\s*>?\s*\*\*(?:Infographic Prompt|Difficulty|Type|Source|Source Reference|Bloom['’]s Level|Mindmap Depth|Mindmap Node|Mindmap Location|Node Depth|Sub-Topic|Topic|Key Takeaway):\*\*[\s\S]*$/gm,
              '',
            )
            .trim();
          return { back, infographicUrl };
        };

        if (cards.length === 0) {
          const mdNorm = data.replace(/\r\n/g, '\n');
          // Pattern 1: **Q:** / **A:**, **Front:** / **Back:**, **Q (Front):** / **A (Back):**
          const boldQaRegex =
            /\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*\s*([\s\S]*?)\s*\*\*(?:A(?:\s*\(Back\))?|Back):\*\*\s*([\s\S]*?)(?=\n#{1,6}[ \t]+\S|\n---[ \t]*\n|\n\*\*(?:Q(?:\s*\(Front\))?|Front):|$)/g;
          const boldMatches = [...mdNorm.matchAll(boldQaRegex)];
          if (boldMatches.length > 0) {
            cards = boldMatches
              .map((m, idx) => {
                const front = m[1].trim();
                const { back, infographicUrl } = cleanBackMeta(m[2], idx);
                return front && back ? ({ front, back, infographicUrl } as FlashCard) : null;
              })
              .filter((c): c is FlashCard => c !== null);
          } else {
            // Pattern 2: ### Q1 \n ... \n ### Ans \n ...
            const headingQaRegex =
              /^#{2,4}[ \t]+Q\d+[^\n]*\n([\s\S]*?)\n#{2,4}[ \t]+Ans(?:wer)?[^\n]*\n([\s\S]*?)(?=\n#{2,4}[ \t]+Q\d+|\n---[ \t]*\n#{2,4}[ \t]+Q\d+|$)/gm;
            const headingMatches = [...mdNorm.matchAll(headingQaRegex)];
            if (headingMatches.length > 0) {
              cards = headingMatches
                .map((m, idx) => {
                  const front = m[1].trim();
                  const { back, infographicUrl } = cleanBackMeta(m[2], idx);
                  return front && back ? ({ front, back, infographicUrl } as FlashCard) : null;
                })
                .filter((c): c is FlashCard => c !== null);
            }
          }
        }

        if (cards.length > 0) return cards;
      } catch {
      }
    }

    if (!videoDir) {
      try {
        const videos = await getChapterVideos(subject, chapterNumber);
        if (videos && videos.length > 0) {
          const aggregatedCards: FlashCard[] = [];
          for (const video of videos) {
            if (video.dir) {
              const videoCards = await getFlashcards(subject, chapterNumber, level, video.dir);
              if (videoCards.length > 0 && !(videoCards.length === 1 && videoCards[0].front === 'Error')) {
                aggregatedCards.push(...videoCards);
              }
            }
          }
          if (aggregatedCards.length > 0) {
            return aggregatedCards;
          }
        }
      } catch (e) {
        console.warn('Failed to aggregate flashcards from videos', e);
      }
    }

    return [{ front: 'Error', back: 'Could not load flashcards.' }];
  })();

  flashcardsCache.set(cacheKey, task);
  return task;
}
