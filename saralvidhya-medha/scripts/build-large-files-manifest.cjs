/**
 * Script to generate a manifest of large audio files (>5MB)
 * These files will be served from Google Drive instead of being bundled
 */
const fs = require('fs');
const path = require('path');

function generateLargeFilesManifest() {
  const THRESHOLD_MB = 5;
  const THRESHOLD_BYTES = THRESHOLD_MB * 1024 * 1024;
  const generatedResourcesPath = path.join(__dirname, '../public/generated_resources');
  
  const largeFiles = [];
  
  function walkDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        if (stats.size > THRESHOLD_BYTES) {
          largeFiles.push({
            path: relPath.replace(/\\/g, '/'),
            size: Math.round(stats.size / (1024 * 1024) * 100) / 100, // MB with 2 decimals
            extension: path.extname(entry.name),
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  }
  
  walkDirectory(generatedResourcesPath);
  
  // Sort by path for consistency
  largeFiles.sort((a, b) => a.path.localeCompare(b.path));
  
  const manifest = {
    version: '1.0',
    threshold: `${THRESHOLD_MB}MB`,
    totalFiles: largeFiles.length,
    generatedAt: new Date().toISOString(),
    note: 'These files are stored in Google Drive and fetched on-demand',
    files: largeFiles,
    instructions: {
      description: 'Files larger than 5MB are stored in Google Drive',
      action: 'Use GoogleDriveService to fetch these files',
      example: 'const url = await getGoogleDriveUrl("path/to/file.mp3")'
    }
  };
  
  // Write manifest to public directory
  const manifestPath = path.join(__dirname, '../public/large-files-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Generated manifest with ${largeFiles.length} large files`);
  console.log(`   Saved to: public/large-files-manifest.json`);
  
  // Write to dist directory if it exists
  const distManifestPath = path.join(__dirname, '../dist/large-files-manifest.json');
  if (fs.existsSync(path.dirname(distManifestPath))) {
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));
    console.log(`   Saved copy to: dist/large-files-manifest.json`);
  }
  
  return manifest;
}

if (require.main === module) {
  generateLargeFilesManifest();
}

module.exports = { generateLargeFilesManifest };
