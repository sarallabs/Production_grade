/**
 * Load Google Drive mappings from JSON config
 * Returns a function to get Google Drive URLs for audio files
 */
import mappingsConfig from '../config/googleDriveMappings.json';

interface MappingsConfig {
  mappings: Record<string, string>;
  driveFolder: {
    folderId: string;
    shareLink: string;
  };
}

const config = mappingsConfig as MappingsConfig;

/**
 * Get Google Drive file ID for a given file path
 */
export function getGoogleDriveFileId(filePath: string): string | null {
  const filePathNormalized = filePath
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/^generated_resources\//, '') // Remove prefix if present
    .replace(/^\.\//, ''); // Remove ./ prefix
  
  return config.mappings[filePathNormalized] || null;
}

/**
 * Convert a local file path to Google Drive streaming URL
 */
export function getAudioUrl(localPath: string): string | null {
  const fileId = getGoogleDriveFileId(localPath);
  
  if (!fileId || fileId.includes('REPLACE_WITH')) {
    console.warn(`⚠️ No Google Drive mapping found for: ${localPath}`);
    console.warn('Please update googleDriveMappings.json with the correct file IDs');
    return null;
  }
  
  // Return a Google Drive URL that can stream the audio
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Get the configuration status
 */
export function getConfigStatus() {
  const mappedCount = Object.keys(config.mappings).filter(k => !k.startsWith('_')).length;
  const unmappedCount = mappedCount === 1 ? 72 : 0; // Approximate
  
  return {
    configured: mappedCount > 0 && !Object.values(config.mappings).some(v => v.includes('REPLACE_WITH')),
    mappedFiles: mappedCount,
    folderConfigured: !config.driveFolder.folderId.includes('REPLACE_WITH'),
  };
}

export default {
  getAudioUrl,
  getGoogleDriveFileId,
  getConfigStatus,
};
