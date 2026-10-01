const fs = require('fs');

const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add API_BASE_URL near the top
const baseStr = "const BASE = '/generated_resources';";
const apiStr = `const BASE = '/generated_resources';\nconst API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? \`\${import.meta.env.VITE_API_BASE_URL}/assets\` : 'http://localhost:8000/api/v1/assets';`;
code = code.replace(baseStr, apiStr);

// 2. Rewrite getResourceContent
const originalGetResourceContent = `export async function getResourceContent(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
): Promise<string> {
  if (!cachedManifest) await getManifest();
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);

  const tryFetch = async (url: string, fileName: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      // Vite dev server returns 200 + text/html for missing static files — detect and reject
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) return null;
      const text = await res.text();
      if (fileName === 'mindmap.json') {
        return text; // Return raw JSON instead of mermaid
      }
      return cleanAiPreamble(text);
    } catch {
      return null;
    }
  };

  for (const fileName of getResourceFileCandidates(resourceName)) {
    const leveledResult = await tryFetch(\`\${subjectBase}/\${chDir}/\${level}/\${fileName}\`, fileName);
    if (leveledResult !== null) return leveledResult;

    const rootResult = await tryFetch(\`\${subjectBase}/\${chDir}/\${fileName}\`, fileName);
    if (rootResult !== null) return rootResult;
  }

  return \`Content not available.\`;
}`;

const newGetResourceContent = `export async function getResourceContent(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
): Promise<string> {
  if (!cachedManifest) await getManifest();

  // Route Quick Study and Detailed Notes to the new API endpoint
  if (resourceName === 'summary.md' || resourceName === 'detailed_view.md') {
    try {
      const persona = level.charAt(0).toUpperCase() + level.slice(1);
      const apiUrl = \`\${API_BASE_URL}/folders/\${subject}/study-guides?persona=\${persona}\`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (resourceName === 'summary.md') return cleanAiPreamble(data.quick_study);
        if (resourceName === 'detailed_view.md') return cleanAiPreamble(data.detailed_notes);
      }
    } catch (e) {
      console.warn("Failed to fetch study guides from API", e);
    }
  }

  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);

  const tryFetch = async (url: string, fileName: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) return null;
      const text = await res.text();
      if (fileName === 'mindmap.json') {
        return text;
      }
      return cleanAiPreamble(text);
    } catch {
      return null;
    }
  };

  for (const fileName of getResourceFileCandidates(resourceName)) {
    const leveledResult = await tryFetch(\`\${subjectBase}/\${chDir}/\${level}/\${fileName}\`, fileName);
    if (leveledResult !== null) return leveledResult;

    const rootResult = await tryFetch(\`\${subjectBase}/\${chDir}/\${fileName}\`, fileName);
    if (rootResult !== null) return rootResult;
  }

  return \`Content not available.\`;
}`;

code = code.replace(originalGetResourceContent, newGetResourceContent);

// 3. Rewrite getFlashcards
const originalGetFlashcardsRegex = /export async function getFlashcards[\s\S]*?return MOCK_FLASHCARDS;\s*\}/;
const newGetFlashcards = `export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
): Promise<FlashCard[]> {
  if (!cachedManifest) await getManifest();
  
  try {
    const persona = level.charAt(0).toUpperCase() + level.slice(1);
    const apiUrl = \`\${API_BASE_URL}/folders/\${subject}/flashcards?persona=\${persona}\`;
    const res = await fetch(apiUrl);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(card => ({
          front: card.front,
          back: card.back,
          slide_image_url: card.slide_image_url,
          embedded_image_urls: card.embedded_image_urls
        }));
      }
    }
  } catch (e) {
    console.warn("Failed to fetch flashcards from API", e);
  }

  return MOCK_FLASHCARDS;
}`;
code = code.replace(originalGetFlashcardsRegex, newGetFlashcards);

// 4. Rewrite getAssessments
const originalGetAssessmentsRegex = /export async function getAssessments[\s\S]*?return questions;\s*\}/;
const newGetAssessments = `export async function getAssessments(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate'
): Promise<AssessmentQuestion[]> {
  try {
    const difficultyMap: Record<string, string> = {
      'beginner': 'Easy',
      'intermediate': 'Medium',
      'advanced': 'Hard'
    };
    const diff = difficultyMap[level] || 'Medium';
    
    const apiUrl = \`\${API_BASE_URL}/folders/\${subject}/assessments?difficulty=\${diff}\`;
    const res = await fetch(apiUrl);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((q: any, index: number) => {
          const optsObj = q.Options || {};
          const keys = ['A', 'B', 'C', 'D', 'E', 'F'].filter(k => optsObj[k]);
          const optionsList = keys.map(k => optsObj[k]);
          
          let answer: any;
          if (q.QuestionType === 'MSQ') {
            answer = (q.RightAnswers || []).map((ra: string) => keys.indexOf(ra)).filter((idx: number) => idx >= 0);
          } else {
            answer = keys.indexOf((q.RightAnswers || [])[0]);
            if (answer < 0) answer = 0;
          }
          
          return {
            id: \`q\${index}\`,
            type: q.QuestionType.toLowerCase(),
            q: q.Question,
            options: optionsList,
            answer: answer,
            explanation: q.source_reference || ''
          };
        });
      }
    }
  } catch (e) {
    console.warn("Failed to fetch assessments from API", e);
  }

  return MOCK_ASSESSMENT_QUESTIONS;
}`;
code = code.replace(originalGetAssessmentsRegex, newGetAssessments);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully patched contentRepository.ts');
