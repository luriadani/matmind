// Vercel Serverless Function
// GET /api/og-image?url=<encoded_url>
// Returns: { imageUrl: string | null }
//
// Fetches a social media page server-side (bypasses client CORS) and
// extracts the og:image meta tag — same technique WhatsApp/Telegram use.

const USER_AGENTS = [
  // Facebook's own crawler — Instagram serves og:image to this
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  // Telegram's preview bot
  'TelegramBot (like TwitterBot)',
  // Generic Googlebot as last resort
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Validate domain
  const allowed = ['instagram.com', 'facebook.com', 'tiktok.com', 'twitter.com', 'x.com'];
  const isAllowed = allowed.some((d) => url.includes(d));
  if (!isAllowed) return res.status(403).json({ error: 'Domain not allowed' });

  // Try each User-Agent until one returns an og:image
  for (const ua of USER_AGENTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) continue;

      // Only read first 50KB — og:image is always in <head>
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
      if (imageUrl) return res.status(200).json({ imageUrl });
    } catch {
      // Try next User-Agent
    }
  }

  return res.status(200).json({ imageUrl: null });
};
