/**
 * Firebase Storage Audio Service
 * Handles streaming audio files from Firebase Storage
 */
import { ref, getBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const AUDIO_FOLDER = "audio-resources";

/**
 * Get a streaming URL for an audio file from Firebase Storage
 * @param filePath - Path relative to generated_resources (e.g., "cbse/class_10/english/chapter_01/podcasts/advanced/English_Chapter_1_Advanced_Long.mp3")
 * @returns Promise<string> - URL to stream the audio file
 */
export async function getAudioStreamUrl(filePath: string): Promise<string> {
  try {
    const normalizedPath = filePath
      .replace(/\\/g, "/") // Convert backslashes to forward slashes
      .replace(/^generated_resources\//, "") // Remove prefix if present
      .replace(/^\.\//, ""); // Remove ./ prefix

    const audioRef = ref(storage, `${AUDIO_FOLDER}/${normalizedPath}`);
    const url = await getDownloadURL(audioRef);
    return url;
  } catch (error) {
    console.error(`Failed to get audio URL for ${filePath}:`, error);
    return null;
  }
}

/**
 * Download audio file as bytes (for caching or processing)
 * @param filePath - Path to the audio file
 * @returns Promise<ArrayBuffer> - The audio file bytes
 */
export async function getAudioBytes(filePath: string): Promise<ArrayBuffer> {
  try {
    const normalizedPath = filePath
      .replace(/\\/g, "/")
      .replace(/^generated_resources\//, "")
      .replace(/^\.\//, "");

    const audioRef = ref(storage, `${AUDIO_FOLDER}/${normalizedPath}`);
    const bytes = await getBytes(audioRef);
    return bytes;
  } catch (error) {
    console.error(`Failed to download audio for ${filePath}:`, error);
    return null;
  }
}

/**
 * Check if an audio file exists in Firebase Storage
 * @param filePath - Path to check
 * @returns Promise<boolean>
 */
export async function audioExists(filePath: string): Promise<boolean> {
  try {
    const url = await getAudioStreamUrl(filePath);
    return url !== null;
  } catch {
    return false;
  }
}

export default {
  getAudioStreamUrl,
  getAudioBytes,
  audioExists,
};
