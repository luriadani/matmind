import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTechniqueCategoryColor, parseArray } from '../../utils/formatters';
import { extractThumbnailFromUrl, getFallbackThumbnail } from '../../utils/thumbnailExtractor';
import { useAppContext } from '../Localization';
import PlatformIcon from '../PlatformIcon';

const TechniqueCard = ({ technique, trainings, onDelete, onUpdate, compact = false }) => {
  const { t, settings } = useAppContext();
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [imageError, setImageError] = useState(false);


  useEffect(() => {
    // Try to get thumbnail from the technique data first
    if (technique.thumbnail_url) {
      setThumbnailUrl(technique.thumbnail_url);
      return;
    }

    // If no thumbnail in data, try to extract from video URL
    if (technique.video_url) {
      const extractedThumbnail = extractThumbnailFromUrl(technique.video_url);
      if (extractedThumbnail) {
        setThumbnailUrl(extractedThumbnail);
      } else {
        // Use fallback thumbnail based on platform
        setThumbnailUrl(getFallbackThumbnail(technique.source_platform));
      }
    }
  }, [technique.thumbnail_url, technique.video_url, technique.source_platform]);

  const handleImageError = () => {
    setImageError(true);
    // Use fallback thumbnail on error
    setThumbnailUrl(getFallbackThumbnail(technique.source_platform));
  };

  const getCategoryColor = (category) => {
    return getTechniqueCategoryColor(category);
  };

  const handleDelete = () => {
    Alert.alert(
      t('technique.delete_title'),
      t('technique.delete_message'),
              [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(technique.id)
        }
      ]
    );
  };

  const handleEdit = () => {
    // Navigate to edit form with technique ID
    router.push(`/technique-form?techniqueId=${technique.id}`);
  };



  const handleVideoPress = () => {
    if (technique.video_url) {
      Linking.openURL(technique.video_url).catch(err => {
        console.error('Error opening video URL:', err);
        Alert.alert('Error', 'Could not open video link');
      });
    }
  };

  const tags = parseArray(technique.tags);

  const getTrainingDisplay = () => {
    if (!technique.training_id || !trainings) return null;
    
    const training = trainings.find(t => t.id === technique.training_id);
    if (!training) return null;
    
    return `${training.dayOfWeek} at ${training.time}`;
  };

  const trainingDisplay = getTrainingDisplay();

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.cardHeader, compact && styles.cardHeaderCompact]}>
        <View style={styles.cardTitle}>
          <View style={styles.titleContainer}>
            <PlatformIcon platform={technique.source_platform} size={16} color="#60A5FA" />
            <TouchableOpacity onPress={handleVideoPress}>
              <Text style={[styles.title, compact && styles.titleCompact]}>{technique.title}</Text>
            </TouchableOpacity>
          </View>
          {technique.shared_by_gym_id && (
            <View style={styles.sharedBadge}>
              <Ionicons name="people" size={12} color="#34C759" />
              <Text style={styles.sharedText}>{t('technique.shared_by_gym')}</Text>
            </View>
          )}
        </View>
        {!compact && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="create" size={16} color="#60A5FA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.categorySection}>
          <View style={styles.categoriesList}>
            {parseArray(technique.category).map(category => {
              const categoryColor = getCategoryColor(category);
              return (
                <View key={category} style={[styles.categoryBadge, { 
                  backgroundColor: categoryColor.backgroundColor,
                  borderColor: categoryColor.borderColor 
                }]}>
                  <Text style={[styles.categoryText, { color: categoryColor.color }]}>
                    {category}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {trainingDisplay && (
          <View style={styles.trainingSection}>
            <Text style={styles.trainingText}>Scheduled for: {trainingDisplay}</Text>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>{t('technique.tags')}</Text>
            <View style={styles.tagsList}>
              {tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{tags.length - 3} {t('technique.more')}</Text>
              )}
            </View>
          </View>
        )}

        {technique.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>{t('technique.notes')}</Text>
            <Text style={styles.notesText}>{technique.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  cardCompact: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cardHeaderCompact: {
    padding: 12,
  },
  cardTitle: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 16,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sharedText: {
    fontSize: 10,
    color: '#34C759',
    marginLeft: 2,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  categorySection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  videoSection: {
    gap: 8,
  },
  videoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#60A5FA',
    alignSelf: 'flex-start',
  },
  videoButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  scheduledSection: {
    gap: 8,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledText: {
    color: '#F59E0B',
    fontSize: 14,
    marginLeft: 8,
  },
  tagsSection: {
    gap: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  moreTagsText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  notesSection: {
    gap: 8,
  },
  notesText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  trainingSection: {
    gap: 8,
  },
  trainingText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TechniqueCard; 