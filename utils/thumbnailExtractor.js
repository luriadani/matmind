// All extraction uses regex only — no `new URL()` which can fail in React Native.

// YouTube video ID patterns (watch, short URL, embed, Shorts)
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

const extractYouTubeVideoId = (url) => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVimeoVideoId = (url) => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Returns a direct, publicly accessible thumbnail URL for YouTube and Vimeo.
 * Returns null for all other platforms — those need the og:image proxy.
 */
export const extractThumbnailFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const lower = url.toLowerCase();

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const id = extractYouTubeVideoId(url);
    // hqdefault (480x360) always exists; maxresdefault sometimes 404s
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }

  if (lower.includes('vimeo.com')) {
    const id = extractVimeoVideoId(url);
    return id ? `https://vumbnail.com/${id}.jpg` : null;
  }

  return null;
};

export const getFallbackThumbnail = () => null; // unused — VideoCard handles placeholder
