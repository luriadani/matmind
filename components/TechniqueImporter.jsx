import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Technique } from '../entities/all';
import { useAppContext } from './Localization';

const TechniqueImporter = () => {
  const { t, user } = useAppContext();
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // Handle incoming links when app is already running
    const subscription = Linking.addEventListener('url', handleIncomingLink);
    
    // Handle initial link if app was opened via link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleIncomingLink = async ({ url }) => {
    if (!url) return;

    try {
      const parsedUrl = Linking.parse(url);
      console.log('Incoming link:', parsedUrl);

      // Handle technique import links
      if (parsedUrl.path?.startsWith('/technique')) {
        await importTechniqueFromUrl(url);
      }
    } catch (error) {
      console.error('Error handling incoming link:', error);
    }
  };

  const importTechniqueFromUrl = async (url) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to import techniques');
      return;
    }

    setIsImporting(true);
    try {
      const parsedUrl = Linking.parse(url);
      const queryParams = parsedUrl.queryParams || {};

      // Extract technique data from URL parameters
      const techniqueData = {
        title: queryParams.title || 'Imported Technique',
        video_url: queryParams.video_url || url,
        source_platform: getPlatformFromUrl(url),
        category: queryParams.category || 'Try Next Class',
        notes: queryParams.notes || '',
        tags: queryParams.tags || '',
        created_by: user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        created_by_id: user.id,
      };

      // Create the technique
      const newTechnique = await Technique.create(techniqueData);
      
      Alert.alert(
        'Success',
        `Technique "${techniqueData.title}" imported successfully!`,
        [
          { text: 'OK', onPress: () => {} },
          { text: 'View', onPress: () => router.push('/') }
        ]
      );

    } catch (error) {
      console.error('Error importing technique:', error);
      Alert.alert('Error', 'Failed to import technique. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const getPlatformFromUrl = (url) => {
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

  const shareTechnique = async (technique) => {
    try {
      const shareUrl = `matmind://technique?title=${encodeURIComponent(technique.title)}&video_url=${encodeURIComponent(technique.video_url)}&category=${encodeURIComponent(technique.category)}&notes=${encodeURIComponent(technique.notes || '')}&tags=${encodeURIComponent(technique.tags || '')}`;
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(shareUrl, {
          mimeType: 'text/plain',
          dialogTitle: `Share ${technique.title}`,
        });
      } else {
        // Fallback for web
        await navigator.clipboard.writeText(shareUrl);
        Alert.alert('Copied', 'Technique link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing technique:', error);
      Alert.alert('Error', 'Failed to share technique');
    }
  };

  const importFromClipboard = async () => {
    try {
      // This would need to be implemented with a clipboard library
      // For now, we'll show an alert with instructions
      Alert.alert(
        'Import from Clipboard',
        'To import a technique from your clipboard:\n\n1. Copy a video URL from Instagram, YouTube, Facebook, etc.\n\n2. Open this app and tap "Import from Clipboard"\n\n3. The technique will be automatically imported with the video URL.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => {} }
        ]
      );
    } catch (error) {
      console.error('Error importing from clipboard:', error);
      Alert.alert('Error', 'Failed to import from clipboard');
    }
  };

  const generateShareableLink = (technique) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="share" size={24} color="#60A5FA" />
        <Text style={styles.title}>{t('sharing.title')}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          {t('sharing.description')}
        </Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={importFromClipboard}
            disabled={isImporting}
          >
            <Ionicons name="clipboard" size={20} color="white" />
            <Text style={styles.buttonText}>
              {isImporting ? 'Importing...' : t('sharing.import_from_clipboard')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => Alert.alert('Info', 'Share a video URL from any platform to import it as a technique!')}
          >
            <Ionicons name="information-circle" size={20} color="white" />
            <Text style={styles.buttonText}>{t('sharing.how_to_import')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.supportedPlatforms}>
          <Text style={styles.platformsTitle}>{t('sharing.supported_platforms')}</Text>
          <View style={styles.platformsList}>
            {['YouTube', 'Instagram', 'Facebook', 'TikTok', 'Vimeo'].map(platform => (
              <View key={platform} style={styles.platformItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.platformText}>{platform}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  supportedPlatforms: {
    marginTop: 16,
  },
  platformsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  platformsList: {
    gap: 4,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 6,
  },
});

export default TechniqueImporter; 