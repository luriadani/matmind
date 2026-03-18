import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTime, getTrainingCategoryColor, parseArray } from '../../utils/formatters';
import { useAppContext } from '../Localization';
import PlatformIcon from '../PlatformIcon';

const NextPractice = ({ trainings, techniques, onTechniqueDelete, onTechniqueUpdate }) => {
  const { t, settings, user } = useAppContext();

  const getDayNumber = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const parseTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const nextTraining = useMemo(() => {
    if (!trainings || trainings.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Sort trainings by day and time
    const sortedTrainings = trainings
      .map(training => ({
        ...training,
        dayNumber: getDayNumber(training.dayOfWeek),
        timeInMinutes: parseTimeToMinutes(training.time)
      }))
      .sort((a, b) => {
        // First sort by day
        if (a.dayNumber !== b.dayNumber) {
          return a.dayNumber - b.dayNumber;
        }
        // Then sort by time
        return a.timeInMinutes - b.timeInMinutes;
      });

    // Find the next training
    for (let i = 0; i < sortedTrainings.length; i++) {
      const training = sortedTrainings[i];
      
      // If training is today and hasn't passed yet
      if (training.dayNumber === currentDay && training.timeInMinutes > currentTime) {
        return {
          ...training,
          isToday: true,
          daysUntil: 0
        };
      }
      
      // If training is in the future
      if (training.dayNumber > currentDay || (training.dayNumber === currentDay && training.timeInMinutes > currentTime)) {
        const daysUntil = training.dayNumber > currentDay 
          ? training.dayNumber - currentDay 
          : 0;
        
        return {
          ...training,
          isToday: training.dayNumber === currentDay,
          daysUntil
        };
      }
    }

    // If no future training this week, return the first training of next week
    if (sortedTrainings.length > 0) {
      const firstTraining = sortedTrainings[0];
      const daysUntil = (7 - currentDay + firstTraining.dayNumber) % 7;
      
      return {
        ...firstTraining,
        isToday: false,
        daysUntil
      };
    }

    return null;
  }, [trainings]);

  const nextTrainingTechniques = useMemo(() => {
    if (!nextTraining || !techniques) return [];

    // Get user's dashboard visible categories
    const dashboardVisibleCategories = parseArray(user?.dashboard_visible_categories || 'Try Next Class');

    return techniques.filter(technique => {
      // Parse technique categories
      const techniqueCategories = parseArray(technique.category);
      
      // Check if any of the technique's categories are enabled in dashboard settings
      const hasVisibleCategory = techniqueCategories.some(category => 
        dashboardVisibleCategories.includes(category)
      );
      
      if (!hasVisibleCategory) {
        return false;
      }

      // Show techniques that are specifically assigned to this training
      if (technique.training_id === nextTraining.id) {
        return true;
      }
      
      // OR show techniques with any visible category that have no specific training assignment
      const hasVisibleCategoryWithoutTraining = techniqueCategories.some(category => 
        dashboardVisibleCategories.includes(category) && !technique.training_id
      );
      
      if (hasVisibleCategoryWithoutTraining) {
        return true;
      }
      
      return false;
    });
  }, [nextTraining, techniques, user?.dashboard_visible_categories]);

  const getTimeDisplay = () => {
    return `${nextTraining.dayOfWeek} at ${formatTime(nextTraining.time, settings.time_format)}`;
  };

  if (!nextTraining) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="calendar" size={20} color="#60A5FA" />
          <Text style={styles.title}>Selected Drills</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming practices scheduled</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={20} color="#60A5FA" />
        <Text style={styles.title}>Selected Drills</Text>
        <View style={[styles.badge, getTrainingCategoryColor(nextTraining.category)]}>
          <Text style={[styles.badgeText, { color: getTrainingCategoryColor(nextTraining.category).color }]}>
                            {nextTraining.category}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Next training on {getTimeDisplay()}</Text>

      <View style={styles.trainingInfo}>
        <View style={styles.timeInfo}>
          <Ionicons name="time" size={16} color="#60A5FA" />
          <Text style={styles.timeText}>{getTimeDisplay()}</Text>
        </View>
        
        {nextTraining.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#9CA3AF" />
            <Text style={styles.locationText}>{nextTraining.location}</Text>
          </View>
        )}
        
        {nextTraining.instructor && (
          <View style={styles.instructorInfo}>
            <Ionicons name="person" size={16} color="#9CA3AF" />
            <Text style={styles.instructorText}>{nextTraining.instructor}</Text>
          </View>
        )}
      </View>

      {nextTrainingTechniques.length > 0 && (
        <View style={styles.techniquesSection}>
          <ScrollView 
            style={styles.techniquesScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.techniquesList}>
              {nextTrainingTechniques.map(technique => (
                <View key={technique.id} style={styles.techniqueItem}>
                  <View style={styles.techniqueInfo}>
                    <PlatformIcon platform={technique.source_platform} size={12} color="#60A5FA" />
                    <TouchableOpacity onPress={() => {
                      if (technique.video_url) {
                        Linking.openURL(technique.video_url).catch(err => {
                          console.error('Error opening video URL:', err);
                        });
                      }
                    }}>
                      <Text style={styles.techniqueTitle}>{technique.title}</Text>
                    </TouchableOpacity>
                    {technique.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {parseArray(technique.category).join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => onTechniqueDelete(technique.id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 28,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  trainingInfo: {
    marginBottom: 16,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  instructorText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  techniquesSection: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 16,
  },
  techniquesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  techniquesScrollView: {
    maxHeight: 180, // Height for approximately 3 techniques (3 * 50px + gaps)
  },
  techniquesList: {
    gap: 8,
  },
  techniqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  techniqueInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techniqueTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default NextPractice; 