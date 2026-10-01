/**
 * Post-build script to remove large audio files from dist
 * These files are served from Google Drive instead
 */
const fs = require('fs');
const path = require('path');

function cleanupLargeFilesFromDist() {
  // Increased to 24MB since Cloudflare Pages allows files up to 25MB.
  // Files larger than 24MB will be cleaned up and served externally.
  const THRESHOLD_MB = 24;
  const THRESHOLD_BYTES = THRESHOLD_MB * 1024 * 1024;
  const distResourcesPath = path.join(__dirname, '../dist/generated_resources');
  
  if (!fs.existsSync(distResourcesPath)) {
    console.log('✓ No generated_resources in dist, skipping cleanup');
    return;
  }
  
  let removedCount = 0;
  let savedMB = 0;
  
  function walkAndClean(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkAndClean(fullPath);
        // Remove empty directories
        try {
          if (fs.readdirSync(fullPath).length === 0) {
            fs.rmdirSync(fullPath);
          }
        } catch (e) {
          // Ignore errors from removing directories
        }
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        
        // Remove ANY file larger than threshold (audio, markdown with embedded images, etc.)
        if (stats.size > THRESHOLD_BYTES) {
          try {
            fs.unlinkSync(fullPath);
            removedCount++;
            savedMB += Math.round((stats.size / (1024 * 1024)) * 100) / 100;
            console.log(`  Removed: ${entry.name} (${Math.round(stats.size / (1024 * 1024))}MB)`);
          } catch (e) {
            // File may be locked by dev server (Windows EBUSY) — skip and warn
            console.warn(`  ⚠ Skipped (locked): ${entry.name} — ${e.message}`);
          }
        }
      }
    }
  }
  
  walkAndClean(distResourcesPath);
  
  if (removedCount > 0) {
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Removed ${removedCount} audio files`);
    console.log(`   Saved ${savedMB}MB in dist size`);
    console.log(`   These files will be served from Google Drive\n`);
  } else {
    console.log('✓ No large audio files found to remove');
  }
}

if (require.main === module) {
  cleanupLargeFilesFromDist();
}

module.exports = { cleanupLargeFilesFromDist };
