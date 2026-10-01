#!/usr/bin/env node

/**
 * Generate Google Drive mappings template
 * Usage: node scripts/generate-drive-mappings.cjs
 * 
 * This creates a template file with all file paths.
 * You then need to manually add the Google Drive file IDs.
 */

const fs = require('fs');
const path = require('path');

function generateMappingsTemplate() {
  const resourcesPath = path.join(__dirname, '../public/generated_resources');
  const mappings = {};
  let audioCount = 0;
  
  function walkDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.mp3', '.m4a'].includes(ext)) {
          const stats = fs.statSync(fullPath);
          // Only include files > 5MB
          if (stats.size > 5 * 1024 * 1024) {
            const filePath = relPath.replace(/\\/g, '/');
            mappings[filePath] = 'PASTE_GOOGLE_DRIVE_FILE_ID_HERE';
            audioCount++;
          }
        }
      }
    }
  }
  
  walkDirectory(resourcesPath);
  
  const template = {
    instructions: `
INSTRUCTIONS TO COMPLETE SETUP:

1. Upload all audio files to Google Drive in this structure:
   https://drive.google.com/drive/folders/YOUR_FOLDER_ID

2. For EACH file below:
   a) Find the file in Google Drive
   b) Right-click → Share → Copy link
   c) Link format: https://drive.google.com/file/d/[FILE_ID]/view
   d) Replace 'PASTE_GOOGLE_DRIVE_FILE_ID_HERE' with the FILE_ID

3. Save this file when done

4. Run: npm run build && npm run deploy:cloudflare
    `.trim(),
    folderSetup: {
      description: 'Share your Google Drive folder',
      example: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
      instruction: 'Make sure the folder is "Anyone with the link can view"',
    },
    mappings: mappings,
    stats: {
      totalFiles: audioCount,
      generatedAt: new Date().toISOString(),
      note: `You have ${audioCount} audio files to map. This may take a few minutes.`
    }
  };
  
  const outputPath = path.join(__dirname, '../src/config/googleDriveMappings.json');
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
  
  console.log(`\n✅ Generated mappings template with ${audioCount} files`);
  console.log(`\n📝 File saved: src/config/googleDriveMappings.json`);
  console.log(`\n👉 Next: Add Google Drive file IDs to the mappings\n`);
  
  return template;
}

if (require.main === module) {
  generateMappingsTemplate();
}

module.exports = { generateMappingsTemplate };
