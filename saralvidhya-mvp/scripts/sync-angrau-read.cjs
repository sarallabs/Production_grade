const fs = require('fs');
const path = require('path');

const srcBase = path.resolve(__dirname, '../../saralvidhya-production/content/angrau/entomology');
const destPublicBase = path.resolve(__dirname, '../public/generated_resources');

const targets = [
  path.join(destPublicBase, 'angrau/entomology'),
  path.join(destPublicBase, 'angrau'),
];

console.log('Syncing ANGRAU Read & Quick Check assets...');

for (let chNum = 1; chNum <= 4; chNum++) {
  const chDirName = `chapter_${String(chNum).padStart(2, '0')}`;
  const chSrcDir = path.join(srcBase, chDirName, 'read');

  if (!fs.existsSync(chSrcDir)) {
    console.warn(`[WARN] Source directory not found: ${chSrcDir}`);
    continue;
  }

  for (const targetBase of targets) {
    const destLearnRead = path.join(targetBase, chDirName, 'learn/read');
    const destRead = path.join(targetBase, chDirName, 'read');

    [destLearnRead, destRead].forEach((destRoot) => {
      fs.mkdirSync(destRoot, { recursive: true });

      // 1. Copy quick study markdown
      const quickSrc = path.join(chSrcDir, 'quick');
      if (fs.existsSync(quickSrc)) {
        const destQuick = path.join(destRoot, 'quick_study');
        const destQuickAlt = path.join(destRoot, 'quick');
        [destQuick, destQuickAlt].forEach(d => fs.mkdirSync(d, { recursive: true }));
        for (const file of fs.readdirSync(quickSrc)) {
          fs.copyFileSync(path.join(quickSrc, file), path.join(destQuick, file));
          fs.copyFileSync(path.join(quickSrc, file), path.join(destQuickAlt, file));
        }
      }

      // 2. Copy detailed study markdown
      const detailedSrc = path.join(chSrcDir, 'detailed');
      if (fs.existsSync(detailedSrc)) {
        const destDetailed = path.join(destRoot, 'detailed_study');
        const destDetailedAlt = path.join(destRoot, 'detailed');
        [destDetailed, destDetailedAlt].forEach(d => fs.mkdirSync(d, { recursive: true }));
        for (const file of fs.readdirSync(detailedSrc)) {
          fs.copyFileSync(path.join(detailedSrc, file), path.join(destDetailed, file));
          fs.copyFileSync(path.join(detailedSrc, file), path.join(destDetailedAlt, file));
        }
      }

      // 3. Copy key_takeaways if present
      const ktSrc = path.join(chSrcDir, 'key_takeaways.md');
      if (fs.existsSync(ktSrc)) {
        fs.copyFileSync(ktSrc, path.join(destRoot, 'key_takeaways.md'));
      }

      // 4. Copy Quick Check files
      const qcSrc = path.join(chSrcDir, 'Quick Check');
      if (fs.existsSync(qcSrc)) {
        const tracks = [
          { srcSub: 'Quick_Study', destSubs: ['quick_study', 'Quick_Study'] },
          { srcSub: 'Detailed_Study', destSubs: ['detailed_study', 'Detailed_Study'] },
        ];

        for (const { srcSub, destSubs } of tracks) {
          const trackSrcDir = path.join(qcSrc, srcSub);
          if (!fs.existsSync(trackSrcDir)) continue;

          for (const destSub of destSubs) {
            const destQcTrack = path.join(destRoot, 'quick_check', destSub);
            fs.mkdirSync(destQcTrack, { recursive: true });

            const files = fs.readdirSync(trackSrcDir);
            for (const file of files) {
              const srcFile = path.join(trackSrcDir, file);
              const destFile = path.join(destQcTrack, file);
              fs.copyFileSync(srcFile, destFile);

              // Also create normalized alias: beginner.json, intermediate.json, advanced.json
              if (file.endsWith('.json')) {
                const lower = file.toLowerCase();
                let persona = null;
                if (lower.includes('beginner')) persona = 'beginner.json';
                else if (lower.includes('intermediate')) persona = 'intermediate.json';
                else if (lower.includes('advanced')) persona = 'advanced.json';

                if (persona) {
                  fs.copyFileSync(srcFile, path.join(destQcTrack, persona));
                }
              }
              if (file.endsWith('.md')) {
                const lower = file.toLowerCase();
                let persona = null;
                if (lower.includes('beginner')) persona = 'beginner.md';
                else if (lower.includes('intermediate')) persona = 'intermediate.md';
                else if (lower.includes('advanced')) persona = 'advanced.md';

                if (persona) {
                  fs.copyFileSync(srcFile, path.join(destQcTrack, persona));
                }
              }
            }
          }
        }
      }
    });
  }
  console.log(`Synced ${chDirName} successfully.`);
}

console.log('ANGRAU Read & Quick Check sync complete!');
