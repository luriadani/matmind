import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTime } from '../../utils/formatters';
import { useAppContext } from '../Localization';

const UpcomingDrills = ({ techniques, trainings, isLoading, onTechniqueDelete }) => {
  const { t, settings } = useAppContext();

  const getDayNumber = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getUpcomingTechniques = () => {
    if (!techniques || !trainings) return [];

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const upcomingTechniques = [];

    // Check each training for the next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDay];
      
      const dayTrainings = trainings.filter(t => t.dayOfWeek === dayName);
      
      for (const training of dayTrainings) {
        const trainingTime = parseTime(training.time);
        
        // If it's today, check if the time hasn't passed yet
        if (i === 0 && trainingTime <= currentTime) {
          continue; // This training has already passed today
        }
        
        // Find techniques scheduled for this training
        const trainingTechniques = techniques.filter(technique => 
          technique.scheduled_for === training.id ||
          technique.scheduled_for === training.dayOfWeek ||
          technique.categories?.includes('Try Next Class')
        );
        
        upcomingTechniques.push(...trainingTechniques);
      }
    }

    return upcomingTechniques.slice(0, 3);
  };

  const upcomingTechniques = getUpcomingTechniques();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('dashboard.upcoming_drills')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (upcomingTechniques.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dashboard.upcoming_drills')}</Text>
        <Text style={styles.subtitle}>{t('dashboard.upcoming_drills_subtitle')}</Text>
      </View>
      
      <View style={styles.drillsList}>
        {upcomingTechniques.map(technique => (
          <View key={technique.id} style={styles.drillCard}>
            <View style={styles.drillHeader}>
              <View style={styles.drillInfo}>
                <Text style={styles.drillTitle}>{technique.title}</Text>
                <View style={styles.drillTime}>
                  <Ionicons name="time" size={14} color="#60A5FA" />
                  <Text style={styles.drillTimeText}>
                    {technique.scheduled_for.dayOfWeek} at {formatTime(technique.scheduled_for.time)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onTechniqueDelete(technique.id)}
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
            
            {technique.video_url && (
              <TouchableOpacity style={styles.watchButton}>
                <Ionicons name="play-circle" size={14} color="#60A5FA" />
                <Text style={styles.watchButtonText}>{t('dashboard.watch_video')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  drillsList: {
    gap: 12,
  },
  drillCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  drillInfo: {
    flex: 1,
  },
  drillTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  drillTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drillTimeText: {
    color: '#60A5FA',
    fontSize: 14,
    marginLeft: 6,
  },
  deleteButton: {
    padding: 4,
  },
  watchButton: {
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
  watchButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default UpcomingDrills; 