const fs = require('fs');

const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AssessmentQuestion')) {
  content = "import { type AssessmentQuestion } from '@/utils/assessmentTypes';\n" + content;
}

// 2. Fix regex
content = content.replace(
  /const regex = \/\\\*\\\*(?:\?:Q\|Front):\\\*\\\*\\s\*\(\[\\s\\S\]\*\?\)\\n\\n\\\*\\\*(?:\?:A\|Back):\\\*\\\*\\s\*\(\[\\s\\S\]\*\?\)\(\?\=\\n\\n\-\-\-\|\$\)\/g;/,
  ''
);
content = content.replace(
  "const regex = /\\*\\*(?:Q|Front):\\*\\*\\s*([\\s\\S]*?)\\n\\n\\*\\*(?:A|Back):\\*\\*\\s*([\\s\\S]*?)(?=\\n\\n---|$)/g;",
  "const regex = /\\*\\*(?:Q|Front):\\*\\*\\s*([\\s\\S]*?)\\s*\\*\\*(?:A|Back):\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)/g;"
);

// 3. Remove early returns to ALWAYS fetch, but KEEP variables to not break getSubjectResourcePath
content = content.replace("  if (cachedCatalog) return cachedCatalog;\n", "");
content = content.replace("  if (cachedManifest) return cachedManifest;\n", "");
content = content.replace("  if (cachedCoursesJson) return cachedCoursesJson;\n", "");

// Add cache busters with escaped backticks and $
content = content.replace(
  "const res = await fetch(`${BASE}/catalog.json`, { cache: 'no-cache' });",
  "const res = await fetch(`${BASE}/catalog.json?t=${Date.now()}`, { cache: 'no-cache' });".replace('${Date.now()}', '\\${Date.now()}')
);
content = content.replace(
  "const res = await fetch(`${BASE}/manifest.json`);",
  "const res = await fetch(`${BASE}/manifest.json?t=${Date.now()}`, { cache: 'no-cache' });".replace('${Date.now()}', '\\${Date.now()}')
);
content = content.replace(
  "const res = await fetch(`${BASE}/courses.json`);",
  "const res = await fetch(`${BASE}/courses.json?t=${Date.now()}`, { cache: 'no-cache' });".replace('${Date.now()}', '\\${Date.now()}')
);

// 4. Append getAssessments if not exists
if (!content.includes('getAssessments(')) {
  content += `\n
export async function getAssessments(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate'
): Promise<AssessmentQuestion[]> {
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);
  
  // Convert persona level to assessment diff level
  const diff = level === 'beginner' ? 'easy' : level === 'intermediate' ? 'medium' : 'hard';
  const fetchUrl = \`\${subjectBase}/\${chDir}/\${level}/mcq.md\`;
  
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return [];
    const text = await res.text();
    return parseMcqMarkdown(text);
  } catch (e) {
    return [];
  }
}

function parseMcqMarkdown(md: string): AssessmentQuestion[] {
  const questions: AssessmentQuestion[] = [];
  const qBlocks = md.split(/## Question \\d+/).filter(b => b.trim());
  
  for (let i = 0; i < qBlocks.length; i++) {
    const block = qBlocks[i];
    const qMatch = block.match(/\\*\\*Question:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*Options:\\*\\*)/);
    const optionsMatch = block.match(/\\*\\*Options:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*Correct Answer:\\*\\*)/);
    const correctMatch = block.match(/\\*\\*Correct Answer:\\*\\*\\s*([A-Z])/);
    const rationaleMatch = block.match(/\\*\\*Rationale:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*Source Reference:\\*\\*|---|\\$)/);
    
    if (qMatch && optionsMatch && correctMatch) {
      const qText = qMatch[1].trim();
      const optsText = optionsMatch[1].trim();
      const options = optsText.split('\\n').map(l => l.replace(/^- [A-Z]\\)\\s*/, '').trim()).filter(l => l);
      
      const ansChar = correctMatch[1].trim();
      let ansIndex = ansChar.charCodeAt(0) - 65;
      if (ansIndex < 0 || ansIndex >= options.length) ansIndex = 0;
      
      const explanation = rationaleMatch ? rationaleMatch[1].trim() : '';
      
      questions.push({
        id: \`q\${i}\`,
        type: 'mcq',
        q: qText,
        options,
        answer: ansIndex,
        explanation
      });
    }
  }
  return questions;
}
`;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched contentRepository.ts');
