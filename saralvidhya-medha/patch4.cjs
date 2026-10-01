const fs = require('fs');
const path = 'd:/saralvidhya/saralvidhya-moocs/src/data/contentRepository.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'if (!res.ok) return [];',
  'if (!res.ok) return MOCK_ASSESSMENT_QUESTIONS;'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched contentRepository.ts');
