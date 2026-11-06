#!/usr/bin/env node
/**
 * Upload Audio Files to Firebase Storage
 * 
 * Prerequisites:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Download your Firebase service account key from Firebase Console:
 *    - Go to Project Settings → Service Accounts → Generate new private key
 *    - Save as `firebase-service-account.json` in project root
 * 3. Run: node scripts/upload-audio-to-firebase.cjs
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firebase-service-account.json not found!');
  console.error('\nTo fix:');
  console.error('1. Go to Firebase Console → Your Project → Project Settings');
  console.error('2. Click "Service Accounts" tab');
  console.error('3. Click "Generate New Private Key"');
  console.error('4. Save the JSON file as firebase-service-account.json in the project root');
  process.exit(1);
}

const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'ekam-expert-prod.firebasestorage.app',
});

const bucket = admin.storage().bucket();

async function uploadAudioFiles() {
  const generatedResourcesPath = path.join(__dirname, '../public/generated_resources');
  const AUDIO_FOLDER = 'audio-resources';
  
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg'];
  let uploadedCount = 0;
  let failedCount = 0;
  
  async function walkAndUpload(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await walkAndUpload(fullPath, relPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        if (audioExtensions.includes(ext)) {
          try {
            const remoteFilePath = `${AUDIO_FOLDER}/${relPath.replace(/\\/g, '/')}`;
            
            await bucket.upload(fullPath, {
              destination: remoteFilePath,
              metadata: {
                cacheControl: 'public, max-age=86400', // Cache for 24 hours
                contentType: getContentType(ext),
              },
            });
            
            uploadedCount++;
            console.log(`✓ Uploaded: ${relPath}`);
          } catch (error) {
            failedCount++;
            console.error(`✗ Failed: ${relPath} - ${error.message}`);
          }
        }
      }
    }
  }
  
  function getContentType(ext) {
    const types = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    };
    return types[ext] || 'application/octet-stream';
  }
  
  console.log('🚀 Starting audio file upload to Firebase Storage...\n');
  
  await walkAndUpload(generatedResourcesPath);
  
  console.log(`\n✅ Upload complete!`);
  console.log(`   Uploaded: ${uploadedCount} files`);
  if (failedCount > 0) {
    console.log(`   Failed: ${failedCount} files`);
  }
  console.log(`\nFiles are now available in Firebase Storage at: ${AUDIO_FOLDER}/`);
  
  process.exit(failedCount > 0 ? 1 : 0);
}

uploadAudioFiles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
