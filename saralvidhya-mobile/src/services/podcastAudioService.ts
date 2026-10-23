import { GCS_API_BASE, formatChapterDir } from './contentService';

export type PodcastAudioMode = 'quick' | 'detailed' | 'microcasts';

/**
 * Returns the public GCS Cloud Run URL for a chapter podcast audio file (.m4a).
 * Matches the backend directory structure in saralvidhya-api / GCS:
 *   - quick: /api/content/angrau/entomology/{chDir}/podcasts/short_podcast.m4a
 *   - detailed: /api/content/angrau/entomology/{chDir}/podcasts/long_podcast.m4a
 *   - microcasts: /api/content/angrau/entomology/{chDir}/podcasts/microcast_{pad}.m4a
 */
export function getPodcastAudioUrl(
  chapterNumber: number,
  mode: PodcastAudioMode,
  microcastId: number = 1
): string {
  const chDir = formatChapterDir(chapterNumber);
  const base = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}/podcasts`;
  if (mode === 'quick') {
    return `${base}/short_podcast.m4a`;
  }
  if (mode === 'detailed') {
    return `${base}/long_podcast.m4a`;
  }
  const pad = String(microcastId).padStart(2, '0');
  return `${base}/microcast_${pad}.m4a`;
}
