import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { extractVideoTitle, generateTechniqueTitle } from '../utils/videoTitleExtractor';
import { useAppContext } from './Localization';

const ShareHandler = () => {
  const { t, user } = useAppContext();
  const [isReady, setIsReady] = useState(false);
  const hasHandledInitialShare = useRef(false);

  // Wait for app to be ready before handling shares
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log('✅ ShareHandler is ready');
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const handleIncomingShare = async (url) => {
      console.log('=== SHARE HANDLER DEBUG ===');
      console.log('🔗 Incoming share detected:', url);
      console.log('URL type:', typeof url);
      console.log('URL length:', url?.length);
      
      if (url && !url.includes('matmind://')) {
        try {
          // Parse the shared content (now async)
          console.log('📋 Parsing shared content...');
          const parsedContent = await parseSharedContent(url);
          console.log('📋 Parsed content result:', JSON.stringify(parsedContent, null, 2));
          
          if (parsedContent) {
            // Directly navigate to technique form with pre-filled data
            console.log('✅ Navigating to technique form with shared data');
            const params = new URLSearchParams({
              shared_url: parsedContent.url,
              shared_title: parsedContent.techniqueTitle || parsedContent.title || '',
              shared_platform: parsedContent.source_platform || 'web'
            });
            
            const finalUrl = `/technique-form?${params.toString()}`;
            console.log('🚀 Navigation URL:', finalUrl);
            
            // Add a small delay to ensure router is ready, then navigate
            setTimeout(() => {
              try {
                router.push(finalUrl);
                console.log('✅ Navigation triggered successfully');
              } catch (navError) {
                console.error('Navigation error:', navError);
                // Fallback: try replace if push fails
                setTimeout(() => {
                  router.replace(finalUrl);
                }, 100);
              }
            }, 100);
          } else {
            console.log('❌ No valid content to import - parsedContent is null');
          }
        } catch (error) {
          console.error('❌ Error parsing shared content:', error);
          console.error('Error stack:', error.stack);
        }
      } else {
        console.log('📋 No URL or matmind:// URL, checking clipboard...');
        // If no URL was provided, check clipboard for shared content
        await checkClipboardForSharedContent();
      }
      console.log('=== SHARE HANDLER END ===');
    };

    const checkClipboardForSharedContent = async () => {
      try {
        console.log('📋 Checking clipboard for shared video URLs...');
        const clipboardContent = await Clipboard.getStringAsync();
        
        if (clipboardContent && clipboardContent.length > 0) {
          console.log('📋 Clipboard content found:', clipboardContent);
          
          // Check if clipboard contains a video platform URL
          const isVideoURL = 
            clipboardContent.includes('youtube.com') ||
            clipboardContent.includes('youtu.be') ||
            clipboardContent.includes('instagram.com') ||
            clipboardContent.includes('facebook.com') ||
            clipboardContent.includes('tiktok.com') ||
            clipboardContent.includes('vimeo.com');
            
          if (isVideoURL && clipboardContent.startsWith('http')) {
            console.log('🎬 Video URL detected in clipboard, processing...');
            const parsedContent = await parseSharedContent(clipboardContent);
            
            if (parsedContent) {
              // Directly navigate to technique form with clipboard data
              console.log('✅ Navigating to technique form with clipboard data');
              const params = new URLSearchParams({
                shared_url: parsedContent.url,
                shared_title: parsedContent.techniqueTitle || parsedContent.title || '',
                shared_platform: parsedContent.source_platform || 'web'
              });
              
              const finalUrl = `/technique-form?${params.toString()}`;
              setTimeout(() => {
                try {
                  router.push(finalUrl);
                  console.log('✅ Clipboard navigation triggered successfully');
                } catch (navError) {
                  console.error('Clipboard navigation error:', navError);
                  setTimeout(() => {
                    router.replace(finalUrl);
                  }, 100);
                }
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('Error checking clipboard:', error);
        // Fail silently - clipboard access might not be available
      }
    };

    // Check for initial shared content
    Linking.getInitialURL().then((url) => {
      console.log('🔍 Initial URL check:', url);
      if (url && !hasHandledInitialShare.current) {
        hasHandledInitialShare.current = true;
        handleIncomingShare(url);
      } else if (!url) {
        // If no initial URL, check clipboard after a short delay
        setTimeout(() => {
          checkClipboardForSharedContent();
        }, 1000);
      }
    });

    // Listen for incoming shares
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('👂 URL event listener triggered:', url);
      handleIncomingShare(url);
    });

    return () => {
      subscription?.remove();
    };
  }, [isReady]);

  const parseSharedContent = async (url) => {
    try {
      let platform, type, source_platform;
      
      // Clean up the URL - handle various formats
      let cleanUrl = url.trim();
      
      // Sometimes Android share intents come with extra data, extract just the URL
      if (cleanUrl.includes('http://') || cleanUrl.includes('https://')) {
        const urlMatch = cleanUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          cleanUrl = urlMatch[1];
        }
      }
      
      console.log('🔍 Cleaned URL:', cleanUrl);
      
      // Handle video platforms with more comprehensive detection
      if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
        platform = 'youtube';
        type = 'video';
        source_platform = 'youtube';
        console.log('✅ Detected YouTube URL');
      } else if (cleanUrl.includes('instagram.com')) {
        // Instagram shares often work even without specific path detection
        platform = 'instagram';
        type = 'video';
        source_platform = 'instagram';
        console.log('✅ Detected Instagram URL');
      } else if (cleanUrl.includes('facebook.com') && (cleanUrl.includes('/videos/') || cleanUrl.includes('/watch/') || cleanUrl.includes('/reel/'))) {
        platform = 'facebook';
        type = 'video';
        source_platform = 'facebook';
        console.log('✅ Detected Facebook URL');
      } else if (cleanUrl.includes('tiktok.com')) {
        platform = 'tiktok';
        type = 'video';
        source_platform = 'tiktok';
        console.log('✅ Detected TikTok URL');
      } else if (cleanUrl.includes('vimeo.com')) {
        platform = 'vimeo';
        type = 'video';
        source_platform = 'vimeo';
        console.log('✅ Detected Vimeo URL');
      } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
        platform = 'twitter';
        type = 'video';
        source_platform = 'twitter';
        console.log('✅ Detected Twitter/X URL');
      } else if (cleanUrl.match(/\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv)$/i)) {
        platform = 'direct';
        type = 'video';
        source_platform = 'direct';
        console.log('✅ Detected direct video file');
      } else if (cleanUrl.startsWith('http') && !cleanUrl.includes('matmind://')) {
        platform = 'web';
        type = 'web';
        source_platform = 'web';
        console.log('✅ Detected generic web URL');
      } else {
        console.log('❌ URL format not recognized:', cleanUrl);
        return null;
      }
      
      // Extract the actual title from the video
      console.log('🎬 Extracting title for platform:', platform);
      const extractedTitle = await extractVideoTitle(cleanUrl, platform);
      const techniqueTitle = generateTechniqueTitle(extractedTitle, platform);
      console.log('📝 Generated technique title:', techniqueTitle);
      
      return {
        type,
        platform,
        url: cleanUrl,
        title: extractedTitle,
        techniqueTitle,
        source_platform
      };
      
    } catch (error) {
      console.error('❌ Error parsing shared content:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  };

  // Component doesn't render anything - it just handles incoming shares
  return null;
};

export default ShareHandler; 