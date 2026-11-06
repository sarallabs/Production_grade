const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'public/generated_resources/Nagarjuna_University/physics');
const podcastDir = path.join(baseDir, 'physics podcast');

const mappings = [
  // Chapter 4
  { srcDir: 'Chap4 Podcast/advancecd_4', destDir: 'chapter_04/advanced' },
  { srcDir: 'Chap4 Podcast/Beginner_4', destDir: 'chapter_04/beginner' },
  { srcDir: 'Chap4 Podcast/Intermediate_4', destDir: 'chapter_04/intermediate' },
  // Chapter 5
  { srcDir: 'chap5 podcast/Advanced 5', destDir: 'chapter_05/advanced' },
  { srcDir: 'chap5 podcast/Beginner 5', destDir: 'chapter_05/beginner' },
  { srcDir: 'chap5 podcast/Intermediate 5', destDir: 'chapter_05/intermediate' },
];

for (const mapping of mappings) {
  const fullSrc = path.join(podcastDir, mapping.srcDir);
  const fullDest = path.join(baseDir, mapping.destDir);
  
  if (!fs.existsSync(fullSrc)) {
    console.log(`Source not found: ${fullSrc}`);
    continue;
  }
  if (!fs.existsSync(fullDest)) {
    console.log(`Dest not found, creating: ${fullDest}`);
    fs.mkdirSync(fullDest, { recursive: true });
  }

  const files = fs.readdirSync(fullSrc);
  for (const file of files) {
    const srcFile = path.join(fullSrc, file);
    const lfile = file.toLowerCase();
    
    let destName = '';
    if (lfile.includes('short') && lfile.endsWith('.m4a')) destName = 'short_podcast.m4a';
    else if (lfile.includes('short') && lfile.endsWith('.md')) destName = 'short_podcast.md';
    else if (lfile.includes('long') && lfile.endsWith('.m4a')) destName = 'long_podcast.m4a';
    else if (lfile.includes('long') && lfile.endsWith('.md')) destName = 'long_podcast.md';
    
    if (destName) {
      const destFile = path.join(fullDest, destName);
      console.log(`Copying ${srcFile} -> ${destFile}`);
      fs.copyFileSync(srcFile, destFile);
    }
  }
}
console.log('Done copying podcasts!');
