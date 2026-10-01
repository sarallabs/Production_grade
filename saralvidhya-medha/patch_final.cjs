const fs = require('fs');
const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports if they don't exist
if (!code.includes('AssessmentQuestion')) {
  code = `import { type AssessmentQuestion } from '../utils/assessmentTypes';\nimport { MOCK_ASSESSMENT_QUESTIONS } from '../utils/assessmentMock';\n` + code;
}

// 2. Append getAssessments and parseMcqMarkdown if they don't exist
if (!code.includes('export async function getAssessments')) {
  code += `\n
export async function getAssessments(
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

  // Fallback to local files
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);
  
  const fetchUrl = \`\${subjectBase}/\${chDir}/\${level}/mcq.md\`;
  
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return MOCK_ASSESSMENT_QUESTIONS;
    const text = await res.text();
    return parseMcqMarkdown(text);
  } catch (e) {
    return MOCK_ASSESSMENT_QUESTIONS;
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
    const rationaleMatch = block.match(/\\*\\*Rationale:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*Source Reference:\\*\\*|---|$)/);
    
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

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully appended getAssessments');
