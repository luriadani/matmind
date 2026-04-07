// Vercel Serverless Function
// GET /api/og-image?url=https://www.instagram.com/p/xxx/
// Returns: { imageUrl: string | null }
//
// Fetches the page server-side (bypasses CORS) using a social-media
// crawler User-Agent so Instagram/Facebook serve the og:image meta tag.

module.exports = async function handler(req, res) {
  // Cache responses for 24h to avoid hammering Instagram
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Only allow social media domains
  const allowed = ['instagram.com', 'facebook.com', 'fb.com', 'tiktok.com', 'twitter.com', 'x.com'];
  const isAllowed = allowed.some((d) => parsedUrl.hostname.includes(d));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // facebookexternalhit is Meta's own crawler — Instagram serves og:image to it
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(200).json({ imageUrl: null });
    }

    const html = await response.text();

    // Try multiple og:image patterns (attribute order varies)
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].startsWith('http')) {
        return res.status(200).json({ imageUrl: match[1] });
      }
    }

    return res.status(200).json({ imageUrl: null });
  } catch (err) {
    console.error('og-image fetch error:', err.message);
    return res.status(200).json({ imageUrl: null });
  }
};
