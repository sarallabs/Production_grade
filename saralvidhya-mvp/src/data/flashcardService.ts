import { 
  API_BASE_URL, 
  BACKEND_SUBJECTS, 
  LEVEL_TO_PERSONA, 
  DifficultyLevel,
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  GCS_BACKEND_SUBJECTS,
  GCS_API_BASE,
  GCS_SUBJECT_MAP,
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

export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
  videoDir?: string,
): Promise<FlashCard[]> {
  await getManifest();

  // ── GCS Cloud Run subjects ──
  if (GCS_BACKEND_SUBJECTS.has(subject)) {
    const subjectPath = GCS_SUBJECT_MAP[subject];
    const chDir = getChapterDir(subject, chapterNumber);
    const url = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/practice/flashcards?persona=${level}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const cards = Array.isArray(data) ? data : (data.flashcards || data.cards || []);
        if (cards.length > 0) {
          return cards.map((c: any) => {
            let infoUrl = c.infographicUrl || c.infographic || c.image;
            if (!infoUrl && c.img) {
              const m = typeof c.img === 'string' ? c.img.match(/!\[.*?\]\((.+?)\)/) : null;
              infoUrl = m ? m[1].trim() : (typeof c.img === 'string' && c.img.startsWith('data:') ? c.img.trim() : undefined);
            }
            if (!infoUrl && typeof c.answer === 'string') {
              const m = c.answer.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i)
                     || c.answer.match(/!\[.*?\]\((data:image\/[^)]+)\)/i);
              if (m) infoUrl = m[1].trim();
            }
            if (!infoUrl && typeof c.back === 'string') {
              const m = c.back.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i)
                     || c.back.match(/!\[.*?\]\((data:image\/[^)]+)\)/i);
              if (m) infoUrl = m[1].trim();
            }
            if (!infoUrl && typeof c.definition === 'string') {
              const m = c.definition.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i)
                     || c.definition.match(/!\[.*?\]\((data:image\/[^)]+)\)/i);
              if (m) infoUrl = m[1].trim();
            }
            // Resolve relative URLs to GCS_API_BASE
            if (infoUrl && !infoUrl.startsWith('http://') && !infoUrl.startsWith('https://') && !infoUrl.startsWith('data:')) {
              if (infoUrl.startsWith('/api/')) {
                infoUrl = `${GCS_API_BASE}${infoUrl}`;
              } else if (infoUrl.includes('generated_infographics')) {
                const cleanRel = infoUrl.replace(/^.*generated_infographics\//, 'generated_infographics/');
                infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${cleanRel}`;
              } else if (infoUrl.startsWith('/')) {
                infoUrl = `${GCS_API_BASE}${infoUrl}`;
              } else {
                infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${infoUrl}`;
              }
            }
            return {
              front: c.front ?? c.question ?? c.term ?? '',
              back:  c.back  ?? c.answer  ?? c.definition ?? '',
              infographicUrl: infoUrl,
            };
          });
        }
      }
    } catch (e) {
      console.warn('[GCS] Failed to fetch flashcards', url, e);
    }
    return [{ front: 'No flashcards available yet.', back: 'Content coming soon.' }];
  }

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
          `${subjectBase}/${chDir}/${videoDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
          `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/prep_flashcards.md`,
          `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/flashcards_prep_master.md`,
        ]
      : []),
    `${subjectBase}/${chDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
    `${subjectBase}/${chDir}/unit_1/Learn/Flashcards/flashcards_${normLevel}.md`,
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
  for (const url of paths) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) continue;
      let data = await res.text();
      
      const folderUrl = url.substring(0, url.lastIndexOf('/'));
      data = data.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, rawPath) => {
        let fullUrl = rawPath;
        if (!rawPath.startsWith('http://') && !rawPath.startsWith('https://') && !rawPath.startsWith('/') && !rawPath.startsWith('data:')) {
          const parts = folderUrl.split('/').filter(Boolean);
          const relParts = rawPath.split('/');
          for (const part of relParts) {
            const dec = decodeURIComponent(part);
            if (dec === '.') continue;
            if (dec === '..') {
              parts.pop();
            } else {
              parts.push(dec);
            }
          }
          fullUrl = '/' + parts.map((p) => encodeURIComponent(p)).join('/');
        }
        return `<!-- INFOGRAPHIC_URL:${fullUrl} -->`;
      });

      let cards: FlashCard[] | undefined;
      
      try {
        const parsed = JSON.parse(data);
        let rawCards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || parsed.items || []);
        cards = rawCards.map((c: any) => {
          let infoUrl = c.image || c.infographic || c.infographicUrl || c.infographic_ref || undefined;
          if (infoUrl && !infoUrl.startsWith('http') && !infoUrl.startsWith('/') && !infoUrl.startsWith('data:')) {
            infoUrl = folderUrl + '/' + infoUrl;
          }
          return {
            front: c.front || c.term || c.question || '',
            back: c.back || c.definition || c.answer || '',
            infographicUrl: infoUrl,
          };
        });
      } catch (e) {
        const jsonMatch = data.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            let rawCards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || parsed.items || []);
            cards = rawCards.map((c: any) => {
              let infoUrl = c.image || c.infographic || c.infographicUrl || c.infographic_ref || undefined;
              if (infoUrl && !infoUrl.startsWith('http') && !infoUrl.startsWith('/') && !infoUrl.startsWith('data:')) {
                infoUrl = folderUrl + '/' + infoUrl;
              }
              return {
                front: c.front || c.term || c.question || '',
                back: c.back || c.definition || c.answer || '',
                infographicUrl: infoUrl,
              };
            });
          } catch (e2) {}
        }
        
        if (!cards?.length) {
          const regex = /(?:\*\*(?:Q|Front):\*\*|###\s*Q:)\s*([\s\S]*?)\s*(?:\*\*(?:A|Back):\*\*|###\s*Ans:)\s*([\s\S]*?)(?=\n#{1,6}[ \t]+\S|\n---\s*|\n(?:\*\*(?:Q|Front):|###\s*Q:)|$)/g;
          const matches = [...data.matchAll(regex)];
          if (matches.length > 0) {
            cards = matches.map(m => {
              const front = m[1].trim();
              let back = m[2].trim();
              let infographicUrl: string | undefined;
              const infoMatch = back.match(/<!-- INFOGRAPHIC_URL:([\s\S]*?) -->/);
              if (infoMatch) {
                infographicUrl = infoMatch[1].trim();
                back = back.replace(infoMatch[0], '').trim();
              } else {
                const imgTagMatch = back.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["'][^>]*>/i);
                if (imgTagMatch) {
                  infographicUrl = imgTagMatch[1];
                  back = back.replace(imgTagMatch[0], '').trim();
                }
              }
              const isPhysics = subject === 'anu_physics' || subject.includes('physics');
              if (isPhysics) {
                const lower = (infographicUrl || '').toLowerCase();
                if (!infographicUrl || lower.includes('placeholder') || lower.includes('generated_infographics') || lower.includes('infographic_card') || lower.includes('dummy')) {
                  const PHYSICS_REAL_INFOGRAPHICS = [
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Overview.png',
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/1.%20Klein-Gordon%20Equation/klein_gordon_infographic.png',
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/2.%20Difficulties%20of%20K-G/difficulties_infographic.png',
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/3.%20Dirac%20Equation/dirac_equation_infographic.png',
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/4.%20Hydrogen%20Atom/hydrogen_atom_infographic.png',
                    '/generated_resources/Nagarjuna_University/physics/chapter_01/Learn/MindMaps/AQM%20Infographics%20VD-1/AQM_Mind_Map.png',
                  ];
                  const cardIdx = matches.indexOf(m);
                  infographicUrl = PHYSICS_REAL_INFOGRAPHICS[(cardIdx >= 0 ? cardIdx : 0) % PHYSICS_REAL_INFOGRAPHICS.length];
                }
              }
              back = back
                .replace(
                  /(?:^|\n)\s*>?\s*\*\*(?:Infographic Prompt|Difficulty|Type|Source|Source Reference|Bloom['’]s Level|Mindmap Depth|Mindmap Node|Mindmap Location|Node Depth|Sub-Topic|Topic):\*\*[\s\S]*$/gm,
                  '',
                )
                .trim();
              return { front, back, infographicUrl };
            });
          }
        }
      }
      
      if (cards?.length) return cards;
    } catch {
    }
  }
  return [{ front: 'Error', back: 'Could not load flashcards.' }];
}
