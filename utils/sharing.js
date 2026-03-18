import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';

export const generateTechniqueShareUrl = (technique) => {
  const baseUrl = 'https://matmind.app/technique';
  const params = new URLSearchParams({
    title: technique.title,
    video_url: technique.video_url,
    category: technique.category,
    notes: technique.notes || '',
    tags: technique.tags || '',
  });
  
  return `${baseUrl}?${params.toString()}`;
};

export const generateTechniqueDeepLink = (technique) => {
  const params = new URLSearchParams({
    title: technique.title,
    video_url: technique.video_url,
    category: technique.category,
    notes: technique.notes || '',
    tags: technique.tags || '',
  });
  
  return `matmind://technique?${params.toString()}`;
};

export const shareTechnique = async (technique) => {
  try {
    const shareUrl = generateTechniqueShareUrl(technique);
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(shareUrl, {
        mimeType: 'text/plain',
        dialogTitle: `Share ${technique.title}`,
      });
    } else {
      // Fallback for web
      if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, message: 'Technique link copied to clipboard!' };
      } else {
        return { success: false, message: 'Sharing not available on this platform' };
      }
    }
    
    return { success: true, message: 'Technique shared successfully!' };
  } catch (error) {
    console.error('Error sharing technique:', error);
    return { success: false, message: 'Failed to share technique' };
  }
};

export const shareTechniqueToExternalApp = async (technique, platform) => {
  try {
    let shareUrl;
    
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        shareUrl = `whatsapp://send?text=${encodeURIComponent(`Check out this BJJ technique: ${technique.title}\n\n${generateTechniqueShareUrl(technique)}`)}`;
        break;
      case 'telegram':
        shareUrl = `tg://msg?text=${encodeURIComponent(`Check out this BJJ technique: ${technique.title}\n\n${generateTechniqueShareUrl(technique)}`)}`;
        break;
      case 'twitter':
        shareUrl = `twitter://post?message=${encodeURIComponent(`Check out this BJJ technique: ${technique.title}\n\n${generateTechniqueShareUrl(technique)}`)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL scheme
        // We'll copy to clipboard instead
        const instagramText = `Check out this BJJ technique: ${technique.title}\n\n${generateTechniqueShareUrl(technique)}`;
        if (navigator && navigator.clipboard) {
          await navigator.clipboard.writeText(instagramText);
          return { success: true, message: 'Content copied! Paste it in Instagram' };
        }
        break;
      default:
        return await shareTechnique(technique);
    }
    
    if (shareUrl) {
      const canOpen = await Linking.canOpenURL(shareUrl);
      if (canOpen) {
        await Linking.openURL(shareUrl);
        return { success: true, message: `Shared to ${platform}!` };
      } else {
        return { success: false, message: `${platform} is not installed` };
      }
    }
    
    return { success: false, message: 'Sharing not available' };
  } catch (error) {
    console.error('Error sharing to external app:', error);
    return { success: false, message: 'Failed to share' };
  }
};

export const parseIncomingTechniqueUrl = (url) => {
  try {
    const parsedUrl = Linking.parse(url);
    const queryParams = parsedUrl.queryParams || {};
    
    return {
      title: queryParams.title || 'Imported Technique',
      video_url: queryParams.video_url || url,
      source_platform: getPlatformFromUrl(queryParams.video_url || url),
      category: queryParams.category || 'Try Next Class',
      notes: queryParams.notes || '',
      tags: queryParams.tags || '',
    };
  } catch (error) {
    console.error('Error parsing technique URL:', error);
    return null;
  }
};

export const getPlatformFromUrl = (url) => {
  if (!url) return 'custom';
  
  const hostname = url.toLowerCase();
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'youtube';
  } else if (hostname.includes('instagram.com')) {
    return 'instagram';
  } else if (hostname.includes('facebook.com')) {
    return 'facebook';
  } else if (hostname.includes('tiktok.com')) {
    return 'tiktok';
  } else if (hostname.includes('vimeo.com')) {
    return 'vimeo';
  } else {
    return 'custom';
  }
};

export const createTechniqueFromUrl = async (url, user, Technique) => {
  try {
    const techniqueData = parseIncomingTechniqueUrl(url);
    if (!techniqueData) {
      throw new Error('Invalid technique URL');
    }
    
    // Add user data
    techniqueData.created_by = user.email;
    techniqueData.created_date = new Date().toISOString();
    techniqueData.updated_date = new Date().toISOString();
    techniqueData.created_by_id = user.id;
    
    // Create the technique
    const newTechnique = await Technique.create(techniqueData);
    return { success: true, technique: newTechnique };
  } catch (error) {
    console.error('Error creating technique from URL:', error);
    return { success: false, error: error.message };
  }
};

export const getSupportedPlatforms = () => {
  return [
    { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
    { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
    { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
    { name: 'Vimeo', icon: 'logo-vimeo', color: '#1AB7EA' },
  ];
};

export const generateQRCodeForTechnique = (technique) => {
  // This would integrate with a QR code library
  const shareUrl = generateTechniqueShareUrl(technique);
  return shareUrl; // For now, just return the URL
}; 