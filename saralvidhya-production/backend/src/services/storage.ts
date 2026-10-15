import { Storage } from '@google-cloud/storage';

export const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'saralvidhya-artifacts';
const storage = new Storage();
export const bucket = storage.bucket(BUCKET_NAME);

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Generates a v4 signed read URL for a GCS file with short expiration (default: 60 minutes).
 * Uses an in-memory cache for half the expiration window to avoid redundant signing overhead.
 */
export async function getSignedUrlForFile(
  gcsPath: string,
  expiresInMinutes = 60,
  contentType?: string
): Promise<string> {
  const cacheKey = `${gcsPath}::${contentType || ''}`;
  const now = Date.now();
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const file = bucket.file(gcsPath);
  const expiresAt = now + expiresInMinutes * 60 * 1000;

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: expiresAt,
    responseType: contentType,
  });

  // Cache for half of its validity period (e.g., 30 mins for a 60-min signed URL)
  signedUrlCache.set(cacheKey, {
    url,
    expiresAt: now + Math.floor((expiresInMinutes * 60 * 1000) / 2),
  });

  return url;
}

/**
 * Resolves a tenant/subject/chapter asset path to a signed URL, or returns external URLs as-is.
 */
export async function resolveStorageAssetUrl(
  livePrefix: string,
  assetPath?: string | null,
  expiresInMinutes = 60
): Promise<string | undefined> {
  if (!assetPath || typeof assetPath !== 'string') return undefined;
  const trimmed = assetPath.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const cleanPrefix = livePrefix.replace(/\/+$/, '');
  const cleanRel = trimmed.replace(/^\/+/, '');
  const fullGcsPath = cleanRel.startsWith(`${cleanPrefix}/`)
    ? cleanRel
    : `${cleanPrefix}/${cleanRel}`;
  try {
    return await getSignedUrlForFile(fullGcsPath, expiresInMinutes);
  } catch (err) {
    console.warn(`[Storage] Could not sign asset URL for '${fullGcsPath}':`, err);
    return undefined;
  }
}

/**
 * Generates a v4 signed PUT URL for uploading a file to the given GCS path.
 * The uploader must send the same Content-Type header used here.
 */
export async function getSignedUploadUrl(
  gcsPath: string,
  contentType: string,
  expiresInMinutes = 60
): Promise<string> {
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType,
  });
  return url;
}

/**
 * Returns the subset of paths that do NOT exist in the bucket.
 */
export async function findMissingFiles(gcsPaths: string[]): Promise<string[]> {
  const missing: string[] = [];
  const chunk = 25;
  for (let i = 0; i < gcsPaths.length; i += chunk) {
    const slice = gcsPaths.slice(i, i + chunk);
    const results = await Promise.all(slice.map((p) => bucket.file(p).exists()));
    results.forEach(([exists], idx) => {
      if (!exists) missing.push(slice[idx]);
    });
  }
  return missing;
}

/**
 * Checks whether an object exists in the artifacts bucket.
 */
export async function checkFileExists(gcsPath: string): Promise<boolean> {
  const file = bucket.file(gcsPath);
  const [exists] = await file.exists();
  return exists;
}

/**
 * Reads and parses a JSON file from the bucket. Returns null if missing or invalid.
 */
export async function readJsonFile<T = any>(gcsPath: string): Promise<T | null> {
  try {
    const [buf] = await bucket.file(gcsPath).download();
    return JSON.parse(buf.toString('utf8')) as T;
  } catch {
    return null;
  }
}

/**
 * Reads a UTF-8 text/markdown file from the bucket. Returns null if missing.
 */
export async function readTextFile(gcsPath: string): Promise<string | null> {
  try {
    const [buf] = await bucket.file(gcsPath).download();
    return buf.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Writes a JSON object to the bucket (used for server-side caching like TTS).
 */
export async function writeJsonFile(gcsPath: string, data: any): Promise<void> {
  const payload = Buffer.from(JSON.stringify(data), 'utf8');
  await bucket.file(gcsPath).save(payload, {
    contentType: 'application/json',
    resumable: false,
  });
}

/**
 * Copies a file from staging to its canonical live path, optionally preserving or updating metadata.
 */
export async function copyStagingFileToLive(
  stagingPath: string,
  livePath: string
): Promise<void> {
  const srcFile = bucket.file(stagingPath);
  const destFile = bucket.file(livePath);

  await srcFile.copy(destFile);
}

/**
 * Promotes a list of relative files from staging prefix to live prefix.
 */
export async function promoteStagingFiles(
  stagingPrefix: string,
  livePrefix: string,
  fileRelativePaths: string[]
): Promise<void> {
  const cleanStaging = stagingPrefix.replace(/\/+$/, '');
  const cleanLive = livePrefix.replace(/\/+$/, '');

  const copyPromises = fileRelativePaths.map((relPath) => {
    const src = `${cleanStaging}/${relPath.replace(/^\/+/, '')}`;
    const dest = `${cleanLive}/${relPath.replace(/^\/+/, '')}`;
    return copyStagingFileToLive(src, dest);
  });

  await Promise.all(copyPromises);
}

