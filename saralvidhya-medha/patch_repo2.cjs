const fs = require('fs');

const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add API_BASE_URL near the top
const baseStr = "const BASE = '/generated_resources';";
const apiStr = `const BASE = '/generated_resources';\nconst API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? \`\${import.meta.env.VITE_API_BASE_URL}/assets\` : 'http://localhost:8000/api/v1/assets';`;
code = code.replace(baseStr, apiStr);

// 2. Patch getResourceContent
const resContentFuncStart = `export async function getResourceContent(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
): Promise<string> {
  if (!cachedManifest) await getManifest();`;

const newResContentFuncStart = `export async function getResourceContent(
  subject: string,
  chapterNumber: number,
  resourceName: string,
  level: DifficultyLevel = 'intermediate',
): Promise<string> {
  if (!cachedManifest) await getManifest();

  if (subject === 'ento_131' && (resourceName === 'summary.md' || resourceName === 'detailed_view.md')) {
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
  }`;
code = code.replace(resContentFuncStart, newResContentFuncStart);

// 3. Patch getFlashcards
const flashFuncStart = `export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
): Promise<FlashCard[]> {
  if (!cachedManifest) await getManifest();`;

const newFlashFuncStart = `export async function getFlashcards(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
): Promise<FlashCard[]> {
  if (!cachedManifest) await getManifest();

  if (subject === 'ento_131') {
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
  }`;
code = code.replace(flashFuncStart, newFlashFuncStart);

// 4. Patch getAssessments
// The original getAssessments fetches from mcq.md.
// Let's find getAssessments and insert the api call before it.
const assessFuncStart = `export async function getAssessments(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate'
): Promise<AssessmentQuestion[]> {
  const chDir = getChapterDir(subject, chapterNumber);`;

const newAssessFuncStart = `export async function getAssessments(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate'
): Promise<AssessmentQuestion[]> {
  if (subject === 'ento_131') {
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
  }

  const chDir = getChapterDir(subject, chapterNumber);`;
code = code.replace(assessFuncStart, newAssessFuncStart);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully patched contentRepository.ts with restricted metamorphosis logic');
