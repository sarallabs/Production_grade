const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'public/generated_resources/Nagarjuna_University/physics');

const mappings = [
  // Chapter 4 mindmaps
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/mindmaps/aqm_chapter_4/advanced', dest: 'chapter_04/advanced' },
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/mindmaps/aqm_chapter_4/beginner', dest: 'chapter_04/beginner' },
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/mindmaps/aqm_chapter_4/intermediate', dest: 'chapter_04/intermediate' },
  
  // Chapter 4 quizzes
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/quizzes/aqm_chapter_4/advanced', dest: 'chapter_04/advanced' },
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/quizzes/aqm_chapter_4/beginner', dest: 'chapter_04/beginner' },
  { src: 'chapter_04/AQM Chapter 4 mindmaps assets/quizzes/aqm_chapter_4/intermediate', dest: 'chapter_04/intermediate' },

  // Chapter 5 mindmaps
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/mindmaps/analytics_chapter_5/advanced', dest: 'chapter_05/advanced' },
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/mindmaps/analytics_chapter_5/beginner', dest: 'chapter_05/beginner' },
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/mindmaps/analytics_chapter_5/intermediate', dest: 'chapter_05/intermediate' },
  
  // Chapter 5 quizzes
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/quizzes/analytics_chapter_5/advanced', dest: 'chapter_05/advanced' },
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/quizzes/analytics_chapter_5/beginner', dest: 'chapter_05/beginner' },
  { src: 'chapter_05/Analytics_Chapter 5 mindmaps assets/quizzes/analytics_chapter_5/intermediate', dest: 'chapter_05/intermediate' },
];

for (const mapping of mappings) {
  const fullSrc = path.join(baseDir, mapping.src);
  const fullDest = path.join(baseDir, mapping.dest);
  
  if (!fs.existsSync(fullSrc)) {
    console.log(`Source not found: ${fullSrc}`);
    continue;
  }
  if (!fs.existsSync(fullDest)) {
    fs.mkdirSync(fullDest, { recursive: true });
  }

  console.log(`Copying ${fullSrc} -> ${fullDest}`);
  fs.cpSync(fullSrc, fullDest, { recursive: true, force: true });
}

console.log('Cleaning up asset folders...');
const toRemove = [
  path.join(baseDir, 'chapter_04/AQM Chapter 4 mindmaps assets'),
  path.join(baseDir, 'chapter_05/Analytics_Chapter 5 mindmaps assets')
];

for (const p of toRemove) {
  if (fs.existsSync(p)) {
    console.log(`Removing ${p}`);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

console.log('Done!');
