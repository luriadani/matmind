/**
 * Video Title Extractor
 * Extracts titles from various video platforms
 */

export const extractVideoTitle = async (url, platform) => {
  try {
    console.log('🎬 Extracting title for:', url, 'platform:', platform);
    
    // For YouTube, we can try to extract from URL parameters or use a simple fetch
    if (platform === 'youtube') {
      return await extractYouTubeTitle(url);
    }
    
    // For Instagram, extract from URL structure
    if (platform === 'instagram') {
      return await extractInstagramTitle(url);
    }
    
    // For Facebook, extract from URL structure
    if (platform === 'facebook') {
      return await extractFacebookTitle(url);
    }
    
    // For TikTok, extract from URL structure
    if (platform === 'tiktok') {
      return await extractTikTokTitle(url);
    }
    
    // For other platforms, try generic extraction
    return await extractGenericTitle(url);
    
  } catch (error) {
    console.error('Error extracting title:', error);
    return getDefaultTitle(platform);
  }
};

const extractYouTubeTitle = async (url) => {
  try {
    // Try to extract video ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return 'YouTube Video';
    }
    
    const videoId = videoIdMatch[1];
    
    // Try to fetch the page title (this might not work due to CORS, but we'll try)
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.title) {
          console.log('✅ YouTube title extracted:', data.title);
          return data.title;
        }
      }
    } catch (oembedError) {
      console.log('ℹ️ YouTube oEmbed failed, using fallback');
    }
    
    // Fallback: Return a generic title with video ID
    return `YouTube Video (${videoId.substring(0, 8)}...)`;
    
  } catch (error) {
    console.error('Error extracting YouTube title:', error);
    return 'YouTube Video';
  }
};

const extractInstagramTitle = async (url) => {
  try {
    // Extract post ID from URL
    const postIdMatch = url.match(/(?:\/p\/|\/reel\/)([^\/\?]+)/);
    if (postIdMatch) {
      const postId = postIdMatch[1];
      return `Instagram ${url.includes('/reel/') ? 'Reel' : 'Post'} (${postId.substring(0, 8)}...)`;
    }
    
    return 'Instagram Video';
  } catch (error) {
    console.error('Error extracting Instagram title:', error);
    return 'Instagram Video';
  }
};

const extractFacebookTitle = async (url) => {
  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(/\/videos\/([^\/\?]+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      return `Facebook Video (${videoId.substring(0, 8)}...)`;
    }
    
    return 'Facebook Video';
  } catch (error) {
    console.error('Error extracting Facebook title:', error);
    return 'Facebook Video';
  }
};

const extractTikTokTitle = async (url) => {
  try {
    // Extract video ID from URL
    const videoIdMatch = url.match(/\/video\/([^\/\?]+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      return `TikTok Video (${videoId.substring(0, 8)}...)`;
    }
    
    return 'TikTok Video';
  } catch (error) {
    console.error('Error extracting TikTok title:', error);
    return 'TikTok Video';
  }
};

const extractGenericTitle = async (url) => {
  try {
    // Try to extract domain name
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Create a title based on domain
    const platformName = domain.split('.')[0];
    const capitalizedName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
    
    return `${capitalizedName} Video`;
  } catch (error) {
    console.error('Error extracting generic title:', error);
    return 'Video Content';
  }
};

const getDefaultTitle = (platform) => {
  const defaultTitles = {
    youtube: 'YouTube Video',
    instagram: 'Instagram Video',
    facebook: 'Facebook Video',
    tiktok: 'TikTok Video',
    web: 'Web Video',
    direct: 'Video File'
  };
  
  return defaultTitles[platform] || 'Video Content';
};

// Generate technique titles based on common BJJ patterns
export const generateTechniqueTitle = (extractedTitle, platform) => {
  if (!extractedTitle || extractedTitle === getDefaultTitle(platform)) {
    return '';
  }
  
  // Clean up the title
  let cleanTitle = extractedTitle
    .replace(/\s*-\s*(YouTube|Instagram|Facebook|TikTok).*$/i, '')
    .replace(/^\s*\[.*?\]\s*/, '')
    .replace(/^\s*\(.*?\)\s*/, '')
    .trim();
  
  // If title is too long, truncate it
  if (cleanTitle.length > 50) {
    cleanTitle = cleanTitle.substring(0, 47) + '...';
  }
  
  return cleanTitle;
};








