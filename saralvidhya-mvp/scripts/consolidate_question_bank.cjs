const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../public/generated_resources/neb_nepal/class_12/biology/chapter_06/practice/Question_Bank');
const destFile = path.join(__dirname, '../public/generated_resources/neb_nepal/class_12/biology/chapter_06/question_bank.md');

let finalMarkdown = '';

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      finalMarkdown += content + '\n\n';
    }
  }
}

processDir(srcDir);

if (finalMarkdown.trim() !== '') {
  fs.writeFileSync(destFile, finalMarkdown.trim(), 'utf8');
  console.log('Consolidated question bank to ' + destFile);
} else {
  console.log('No question bank files found.');
}
