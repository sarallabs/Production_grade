const fs = require('fs');
const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Import MOCK_ASSESSMENT_QUESTIONS
if (!content.includes('MOCK_ASSESSMENT_QUESTIONS')) {
  content = content.replace(
    "import { type AssessmentQuestion } from '@/utils/assessmentTypes';",
    "import { type AssessmentQuestion } from '@/utils/assessmentTypes';\nimport { MOCK_ASSESSMENT_QUESTIONS } from '@/utils/assessmentMock';"
  );
}

// 2. Add mock flashcards
if (!content.includes('MOCK_FLASHCARDS')) {
  content = content.replace(
    "export interface FlashCardSet",
    "const MOCK_FLASHCARDS: FlashCard[] = [\n  { front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },\n  { front: 'What is the role of the Rough ER?', back: 'Protein synthesis and folding' },\n  { front: 'What does DNA stand for?', back: 'Deoxyribonucleic Acid' }\n];\n\nexport interface FlashCardSet"
  );
}

// 3. Patch getFlashcards to return MOCK_FLASHCARDS on failure
if (!content.includes('return MOCK_FLASHCARDS;')) {
  content = content.replace(
    /return \[\];[\s]*\}[\s]*\}[\s]*\}[\s]*return \[\];[\s]*\}/,
    `return [];
      }
    }
    return MOCK_FLASHCARDS;
  }`
  );
}

// 4. Patch getAssessments to return MOCK_ASSESSMENT_QUESTIONS on failure
if (!content.includes('return MOCK_ASSESSMENT_QUESTIONS;')) {
  content = content.replace(
    /return parseMcqMarkdown\(text\);[\s]*\} catch \(e\) \{[\s]*return \[\];[\s]*\}/,
    `return parseMcqMarkdown(text);
    } catch (e) {
      return MOCK_ASSESSMENT_QUESTIONS;
    }`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched contentRepository.ts');
