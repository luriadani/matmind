import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTechniqueCategoryColor, parseArray } from '../../utils/formatters';
import { extractThumbnailFromUrl } from '../../utils/thumbnailExtractor';
import { useAppContext } from '../Localization';
import PlatformIcon from '../PlatformIcon';

const TechniqueGridItem = ({ technique, trainings, onDelete, onUpdate }) => {
  const { t, settings } = useAppContext();
  const [imageError, setImageError] = useState(false);

  const thumbnailUrl = imageError ? null : extractThumbnailFromUrl(technique.video_url);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoPress = () => {
    if (technique.video_url) {
      Linking.openURL(technique.video_url).catch(err => {
        console.error('Error opening video URL:', err);
        Alert.alert('Error', 'Could not open video link');
      });
    }
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

  const categories = parseArray(technique.category);

  const getTrainingDisplay = () => {
    if (!technique.training_id || !trainings) return null;
    
    const training = trainings.find(t => t.id === technique.training_id);
    if (!training) return null;
    
    return `${training.dayOfWeek} at ${training.time}`;
  };

  const trainingDisplay = getTrainingDisplay();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <PlatformIcon platform={technique.source_platform} size={12} color="#60A5FA" />
          <TouchableOpacity onPress={handleVideoPress}>
            <Text style={styles.title} numberOfLines={2}>
              {technique.title}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="create" size={14} color="#60A5FA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContent}>
        {categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.slice(0, 2).map(category => {
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
            {categories.length > 2 && (
              <Text style={styles.moreCategoriesText}>+{categories.length - 2}</Text>
            )}
          </View>
        )}

        {trainingDisplay && (
          <View style={styles.trainingContainer}>
            <Text style={styles.trainingText}>Scheduled for: {trainingDisplay}</Text>
          </View>
        )}

        {technique.shared_by_gym_id && (
          <View style={styles.sharedBadge}>
            <Ionicons name="people" size={12} color="#34C759" />
            <Text style={styles.sharedText}>{t('technique.shared')}</Text>
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
    width: '48%',
    minHeight: 120,
  },
  cardHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  actionButton: {
    padding: 2,
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreCategoriesText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontStyle: 'italic',
  },
  videoButton: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  scheduledText: {
    fontSize: 10,
    color: '#F59E0B',
    marginLeft: 2,
    fontWeight: '500',
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
  trainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  trainingText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
  },
});

export default TechniqueGridItem; 