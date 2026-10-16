/**
 * Inline Base64 Image Store
 *
 * Several markdown artifacts (e.g., DBMS Chapter 1 detailed/quick study notes)
 * embed 30+ multiline base64 images (`data:image/webp;base64,\n...`), inflating
 * a 113 KB markdown file to 10.07 MB (129,000+ lines).
 *
 * Passing a 10 MB string through remark/micromark/rehype-raw/React state/regexes
 * causes multi-second main-thread freezes (TBT/INP).
 *
 * `extractInlineDataImages` replaces embedded `data:image/...;base64,...` blobs
 * with compact `https://sv-inline-img.local/<id>` tokens in a single pass before
 * markdown parsing, shrinking the markdown payload by ~99%.
 * `resolveInlineImageUrl` restores the clean single-line data URI (or Object URL)
 * when `<img src=...>` renders.
 */

const INLINE_IMG_PREFIX = 'https://sv-inline-img.local/';
const MAX_STORE_ENTRIES = 250;

const tokenToDataUri = new Map<string, string>();
const hashToToken = new Map<string, string>();
let nextId = 1;

function fastHash(str: string): string {
  const len = str.length;
  let h1 = 0x811c9dc5;
  const step = Math.max(1, Math.floor(len / 64));
  for (let i = 0; i < len; i += step) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return `${len}_${(h1 >>> 0).toString(36)}`;
}

const DATA_IMAGE_REGEX = /data:image\/[a-zA-Z0-9.+-]+;base64,[\sA-Za-z0-9+/=]+/g;

export function extractInlineDataImages(markdown: string): string {
  if (!markdown || !markdown.includes('data:image/')) {
    return markdown;
  }

  return markdown.replace(DATA_IMAGE_REGEX, (match) => {
    const hash = fastHash(match);
    const existingToken = hashToToken.get(hash);
    if (existingToken && tokenToDataUri.has(existingToken)) {
      return existingToken;
    }

    const cleanDataUri = match.replace(/\s+/g, '');
    const token = `${INLINE_IMG_PREFIX}${nextId++}`;

    if (tokenToDataUri.size >= MAX_STORE_ENTRIES) {
      const oldestKey = tokenToDataUri.keys().next().value;
      if (oldestKey) {
        tokenToDataUri.delete(oldestKey);
      }
    }

    tokenToDataUri.set(token, cleanDataUri);
    hashToToken.set(hash, token);
    return token;
  });
}

export function resolveInlineImageUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith(INLINE_IMG_PREFIX)) {
    return tokenToDataUri.get(url) || url;
  }
  if (url.startsWith('data:image/')) {
    return url.replace(/\s+/g, '');
  }
  return url;
}

export function stripInlineImageTokens(text: string): string {
  if (!text) return text;
  let out = text;
  if (out.includes(INLINE_IMG_PREFIX)) {
    out = out.replace(/https:\/\/sv-inline-img\.local\/[0-9]+/g, '');
  }
  if (out.includes('data:image/')) {
    out = out.replace(DATA_IMAGE_REGEX, '');
  }
  return out;
}
