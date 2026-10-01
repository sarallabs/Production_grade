const fs = require('fs');
const path = require('path');

const dirs = ['beginner', 'intermediate', 'advanced'];

dirs.forEach(d => {
  const dir = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Entomology/chapter_11/' + d;
  
  // quiz.md
  fs.writeFileSync(path.join(dir, 'quiz.md'), '## Quiz\n\nThis is a placeholder for the Quiz markdown.', 'utf8');
  
  // question_bank.md
  fs.writeFileSync(path.join(dir, 'question_bank.md'), '## Question Bank\n\nThis is a placeholder for the Question Bank.', 'utf8');
  
  // youtube_links.md
  const ytContent = `[
  {
    "title": "Placeholder Video",
    "videoId": "dQw4w9WgXcQ",
    "description": "This is a placeholder video."
  }
]`;
  fs.writeFileSync(path.join(dir, 'youtube_links.md'), ytContent, 'utf8');
});

console.log('Created more placeholders.');
