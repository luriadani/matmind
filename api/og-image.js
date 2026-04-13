// Vercel Serverless Function
// GET /api/og-image?url=<encoded_url>
// Returns: { imageUrl: string | null }
//
// Strategy per platform:
//  TikTok   → TikTok oEmbed API (public, reliable, same as WhatsApp uses)
//  Vimeo    → Vimeo oEmbed API  (public, always works)
//  Instagram/Facebook → microlink.io (best available without auth)
//  Others   → direct OG scrape → microlink fallback

const ALLOWED_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'vimeo.com',
  'twitter.com',
  'x.com',
];

// ── TikTok oEmbed ─────────────────────────────────────────────────────────────
const tryTikTokOembed = async (url) => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.thumbnail_url;
    return thumb?.startsWith('http') ? thumb : null;
  } catch {
    return null;
  }
};

// ── Vimeo oEmbed ──────────────────────────────────────────────────────────────
const tryVimeoOembed = async (url) => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.thumbnail_url;
    return thumb?.startsWith('http') ? thumb : null;
  } catch {
    return null;
  }
};

// ── Direct OG scrape (tries social crawler User-Agents) ──────────────────────
const USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
];

const extractOgImage = (html) => {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:url["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.startsWith('http')) return match[1];
  }
  return null;
};

const tryDirectScrape = async (url) => {
  for (const ua of USER_AGENTS) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) continue;

      // Read only first 50KB — og:image is always in <head>
      const reader = response.body?.getReader();
      if (!reader) continue;
      let html = '';
      let done = false;
      while (!done && html.length < 50000) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) html += new TextDecoder().decode(chunk.value);
      }
      reader.cancel();

      const imageUrl = extractOgImage(html);
      if (imageUrl) return imageUrl;
    } catch {
      // try next UA
    }
  }
  return null;
};

// ── Microlink.io fallback ─────────────────────────────────────────────────────
const tryMicrolink = async (url) => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const imageUrl = data?.data?.image?.url || data?.data?.logo?.url || null;
    return imageUrl?.startsWith('http') ? imageUrl : null;
  } catch {
    return null;
  }
};

// ── Main handler ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const isAllowed = ALLOWED_DOMAINS.some((d) => url.includes(d));
  if (!isAllowed) return res.status(403).json({ error: 'Domain not allowed' });

  const urlLower = url.toLowerCase();

  // TikTok: oEmbed is the official public API — fastest and most reliable
  if (urlLower.includes('tiktok.com')) {
    const result = await tryTikTokOembed(url);
    if (result) return res.status(200).json({ imageUrl: result });
  }

  // Vimeo: oEmbed API is reliable (though client-side vumbnail.com handles most cases)
  if (urlLower.includes('vimeo.com')) {
    const result = await tryVimeoOembed(url);
    if (result) return res.status(200).json({ imageUrl: result });
  }

  // Instagram / Facebook / others: try direct scrape first, then microlink
  const direct = await tryDirectScrape(url);
  if (direct) return res.status(200).json({ imageUrl: direct });

  const ml = await tryMicrolink(url);
  return res.status(200).json({ imageUrl: ml ?? null });
};
