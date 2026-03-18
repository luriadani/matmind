import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSupportedPlatforms, shareTechnique, shareTechniqueToExternalApp } from '../utils/sharing';
import { useAppContext } from './Localization';

const ShareTechniqueModal = ({ visible, onClose, technique }) => {
  const { t } = useAppContext();
  const platforms = getSupportedPlatforms();

  const handleShareToPlatform = async (platformName) => {
    try {
      const result = await shareTechniqueToExternalApp(technique, platformName);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
      onClose();
    } catch (error) {
      console.error('Error sharing to platform:', error);
      Alert.alert('Error', 'Failed to share technique');
    }
  };

  const handleGeneralShare = async () => {
    try {
      const result = await shareTechnique(technique);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
      onClose();
    } catch (error) {
      console.error('Error sharing technique:', error);
      Alert.alert('Error', 'Failed to share technique');
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `https://matmind.app/technique?title=${encodeURIComponent(technique.title)}&video_url=${encodeURIComponent(technique.video_url)}`;
      
      if (navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        Alert.alert('Copied', 'Technique link copied to clipboard!');
      } else {
        Alert.alert('Error', 'Clipboard not available');
      }
      onClose();
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('sharing.share_technique')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.techniqueTitle}>{technique?.title}</Text>
            
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={handleGeneralShare}>
                <Ionicons name="share-outline" size={24} color="#60A5FA" />
                <Text style={styles.shareOptionText}>{t('sharing.general_share')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
                <Ionicons name="link-outline" size={24} color="#60A5FA" />
                <Text style={styles.shareOptionText}>{t('sharing.copy_link')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.platformsSection}>
              <Text style={styles.sectionTitle}>{t('sharing.share_to_platform')}</Text>
              <View style={styles.platformsGrid}>
                {platforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.name}
                    style={styles.platformButton}
                    onPress={() => handleShareToPlatform(platform.name)}
                  >
                    <Ionicons name={platform.icon} size={24} color={platform.color} />
                    <Text style={styles.platformText}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  shareOptions: {
    marginBottom: 24,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginBottom: 8,
  },
  shareOptionText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  platformsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 16,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    minWidth: 80,
  },
  platformText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ShareTechniqueModal; 