/**
 * Google Drive Service
 * Fetches large audio files (>5MB) from Google Drive instead of bundling them
 * 
 * To use:
 * 1. Upload your audio files to a shared Google Drive folder
 * 2. Get the file ID and create a publicly shareable link
 * 3. Map file paths to Google Drive IDs in the googleDriveMapping
 */

interface GoogleDriveFile {
  path: string;
  driveId: string;
  mimeType?: string;
}

// TODO: Replace with your actual Google Drive file mappings
// Format: "path/to/file.mp3" -> "google_drive_file_id"
const googleDriveMapping: Record<string, string> = {
  // Example: "cbse/class_10/english/chapter_01/beginner/long_podcast.mp3" -> "1a2b3c4d5e6f7g8h9i0j"
};

/**
 * Get a publicly accessible Google Drive file URL
 * @param filePath - Path to the file (relative path from generated_resources)
 * @param driveId - Optional Google Drive file ID. If not provided, looks it up in mapping
 * @returns Public streaming URL for the file
 */
export function getGoogleDriveUrl(filePath: string, driveId?: string): string {
  const id = driveId || googleDriveMapping[filePath];
  
  if (!id) {
    console.warn(`⚠️ No Google Drive ID found for: ${filePath}`);
    return null;
  }
  
  // Return a URL that streams directly from Google Drive without downloading
  // Using preview=false allows the browser to handle the file type natively
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

/**
 * Get a streaming URL (better for audio/video)
 */
export function getGoogleDriveStreamUrl(filePath: string, driveId?: string): string {
  const id = driveId || googleDriveMapping[filePath];
  
  if (!id) {
    console.warn(`⚠️ No Google Drive ID found for: ${filePath}`);
    return null;
  }
  
  // This URL allows previewing/streaming without download dialog
  return `https://drive.google.com/file/d/${id}/preview`;
}

/**
 * Load the large files manifest and fetch from Google Drive
 */
export async function getLargeFilesManifest() {
  try {
    const response = await fetch('/large-files-manifest.json');
    return await response.json();
  } catch (error) {
    console.error('Failed to load large files manifest:', error);
    return null;
  }
}

/**
 * Check if a file is in the large files list
 */
export async function isLargeFile(filePath: string): Promise<boolean> {
  const manifest = await getLargeFilesManifest();
  if (!manifest) return false;
  
  return manifest.files.some((file: GoogleDriveFile) => file.path === filePath);
}

/**
 * Get the appropriate URL for a file (local or Google Drive)
 */
export async function getFileUrl(filePath: string): Promise<string> {
  const filePathNormalized = filePath.replace(/\\/g, '/').replace(/^generated_resources\//, '');
  const baseUrl = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/assets` : 'http://localhost:8000/api/v1/assets';
  return `${baseUrl}/${filePathNormalized}`;
}

export default {
  getGoogleDriveUrl,
  getGoogleDriveStreamUrl,
  getLargeFilesManifest,
  isLargeFile,
  getFileUrl,
};
