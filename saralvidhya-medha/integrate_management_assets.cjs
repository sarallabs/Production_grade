const fs = require('fs');
const path = require('path');

const rootDir = 'd:/saralvidhya/saralvidhya-moocs';
const srcNew = path.join(rootDir, 'marketing_management (1)/marketing_management/Chapter -1');
const targetChapter1 = path.join(rootDir, 'public/generated_resources/Nagarjuna_University/MBA/chapter_1');

const v1Source = path.join(srcNew, 'importance_and_scope_of_marketing Video 1');
const v2Source = path.join(srcNew, 'Service Marketing Video 2');

const v1Target = path.join(targetChapter1, 'unit_1');
const v2Target = path.join(targetChapter1, 'unit_2');
const v1AliasTarget = path.join(targetChapter1, 'importance_and_scope_of_marketing');
const v2AliasTarget = path.join(targetChapter1, 'service_marketing');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('Copying Unit 1 (Video 1) assets to unit_1 and importance_and_scope_of_marketing...');
copyRecursiveSync(v1Source, v1Target);
copyRecursiveSync(v1Source, v1AliasTarget);

console.log('Copying Unit 2 (Video 2) assets to unit_2 and service_marketing...');
copyRecursiveSync(v2Source, v2Target);
copyRecursiveSync(v2Source, v2AliasTarget);

// Remove old nested marketing_management folder inside chapter_1
const oldNested = path.join(targetChapter1, 'marketing_management');
if (fs.existsSync(oldNested)) {
  console.log('Deleting old nested marketing_management assets in public...');
  fs.rmSync(oldNested, { recursive: true, force: true });
}

// Remove marketing_management (1) root folder
const rootPasted = path.join(rootDir, 'marketing_management (1)');
if (fs.existsSync(rootPasted)) {
  console.log('Deleting marketing_management (1) from root...');
  fs.rmSync(rootPasted, { recursive: true, force: true });
}

console.log('Asset integration and cleanup completed successfully!');
