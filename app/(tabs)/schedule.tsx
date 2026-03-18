import { Technique, Training as TrainingEntity } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../components/Localization';
import { useNotificationScheduler } from '../../components/NotificationScheduler';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import TrainingFormModal from '../../components/TrainingFormModal';
import { formatTime, getTrainingCategoryColor } from '../../utils/formatters';

interface Training {
  id: string;
  dayOfWeek: string;
  time: string;
  category: string;
  location?: string | null;
  instructor?: string | null;
  created_by: string;
  created_date: string;
  updated_date: string;
  created_by_id?: string;
  is_sample?: boolean | null;
}

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const daysOfWeekEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaultTrainingCategories = ["gi", "no_gi", "competition", "beginner", "advanced", "open_mat"];

export default function Schedule() {
  const { t, language, settings, user, isLoading: isAppLoading } = useAppContext();
  const { scheduleReminders } = useNotificationScheduler();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentDaysOfWeek = language === 'he' ? daysOfWeek : daysOfWeekEn;
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTrainings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      console.log('Loading trainings for user:', user.email);
      // Filter trainings by the current user
      const data = await TrainingEntity.filter({ created_by: user.email });
      console.log('Loaded trainings:', data.length);
      console.log('Loaded training IDs:', data.map(t => t.id));
      data.sort((a, b) => {
        const aIndex = currentDaysOfWeek.indexOf(a.dayOfWeek);
        const bIndex = currentDaysOfWeek.indexOf(b.dayOfWeek);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      console.log('Setting trainings state with:', data.length, 'trainings');
      setTrainings(data);
    } catch (error) {
      console.error("Failed to load trainings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppLoading && user) {
      loadTrainings();
    }
  }, [user, isAppLoading, language]);

  const handleOpenEditDialog = (training: Training) => {
    setEditingTraining(training);
    setIsModalOpen(true);
  };

  const handleOpenAddDialog = () => {
    setEditingTraining(null);
    setIsModalOpen(true);
  };

  const handleSaveTraining = async (formData: any) => {
    try {
      const trainingData = {
        ...formData,
        created_by: user?.email || 'user@example.com'
      };
      
      if (editingTraining) {
        await TrainingEntity.update(editingTraining.id, trainingData);
      } else {
        await TrainingEntity.create(trainingData);
      }
      
      // Schedule notifications for the updated trainings
      if (user?.notifications_enabled === 'true') {
        const updatedTrainings = await TrainingEntity.filter({ created_by: user.email });
        const techniques = await Technique.filter({ created_by: user.email });
        await scheduleReminders(techniques, updatedTrainings);
      }
      
      Alert.alert('Success', editingTraining ? 'Training updated successfully!' : 'Training added successfully!');
    } catch (error) {
      console.error("Failed to save training:", error);
      Alert.alert('Error', 'Failed to save training. Please try again.');
    } finally {
      setIsModalOpen(false);
      loadTrainings();
    }
  };

  const handleDeleteTraining = async (id: string) => {
    console.log('=== DELETE TRAINING DEBUG ===');
    console.log('Attempting to delete training with ID:', id);
    console.log('Current trainings count:', trainings.length);
    console.log('Current trainings:', trainings.map(t => ({ id: t.id, dayOfWeek: t.dayOfWeek, created_by: t.created_by })));
    
    // Show confirmation dialog before deleting
    Alert.alert(
      'Delete Training',
      'Are you sure you want to delete this training? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Direct delete for training ID:', id);
              console.log('Training entity:', TrainingEntity);
              const result = await TrainingEntity.delete(id);
              console.log('Delete result:', result);
              
              // Reschedule notifications after deleting training
              if (user?.notifications_enabled === 'true') {
                const updatedTrainings = await TrainingEntity.filter({ created_by: user.email });
                const techniques = await Technique.filter({ created_by: user.email });
                await scheduleReminders(techniques, updatedTrainings);
              }
              
              Alert.alert('Success', 'Training deleted successfully!');
            } catch (error: any) {
              console.error("Failed to delete training:", error);
              console.error("Error details:", error.message);
              Alert.alert('Error', `Failed to delete training: ${error.message}`);
            } finally {
              console.log('Reloading trainings...');
              loadTrainings();
            }
          }
        }
      ]
    );
  };

  const getArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return [];
  };

  const validCustomCategories = getArray(settings.custom_training_categories);
  const allTrainingCategories = [...new Set([...defaultTrainingCategories, ...validCustomCategories])];

  return (
    <SubscriptionGuard requiredLevel="free">
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Training Schedule</Text>
              <Text style={styles.subtitle}>Add your regular training times to get reminders</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddDialog}>
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addButtonText}>Add New Training</Text>
            </TouchableOpacity>
          </View>

          <TrainingFormModal
            visible={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTraining}
            training={editingTraining}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>My Trainings</Text>
            </View>
            <View style={styles.cardContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : trainings.length > 0 ? (
                <View style={styles.trainingsList}>
                  {trainings.map(training => (
                    <View key={training.id} style={styles.trainingCard}>
                      <View style={styles.trainingContent}>
                        <View style={styles.trainingInfo}>
                          <View style={styles.trainingHeader}>
                            <Ionicons name="time" size={16} color="#60A5FA" />
                            <Text style={styles.trainingTime}>
                              {training.dayOfWeek} at {formatTime(training.time, settings.time_format)}
                            </Text>
                          </View>
                          <View style={styles.trainingBadges}>
                            <View style={[styles.badge, getTrainingCategoryColor(training.category)]}>
                              <Text style={[styles.badgeText, { color: (getTrainingCategoryColor(training.category) as any).color }]}>
                                {training.category}
                              </Text>
                            </View>
                          </View>
                          {training.location && (
                            <View style={styles.trainingDetail}>
                              <Ionicons name="location" size={16} color="#9CA3AF" />
                              <Text style={styles.detailText}>{training.location}</Text>
                            </View>
                          )}
                          {training.instructor && (
                            <View style={styles.trainingDetail}>
                              <Ionicons name="person" size={16} color="#9CA3AF" />
                              <Text style={styles.detailText}>{training.instructor}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.trainingActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleOpenEditDialog(training)}
                          >
                            <Ionicons name="create" size={20} color="#60A5FA" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                              console.log('Delete button pressed for training:', training.id);
                              console.log('Training details:', training);
                              // Test direct delete without Alert
                              handleDeleteTraining(training.id);
                            }}
                          >
                            <Ionicons name="trash" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No trainings scheduled</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SubscriptionGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
  },
  addButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  cardContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  trainingsList: {
    gap: 16,
  },
  trainingCard: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
  },
  trainingContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trainingInfo: {
    flex: 1,
  },
  trainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainingTime: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  trainingBadges: {
    flexDirection: 'row',
    marginBottom: 8,
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
  trainingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  trainingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
  },
}); 