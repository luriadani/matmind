import { Technique, Training } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Filters from '../../components/dashboard/Filters';
import NextPractice from '../../components/dashboard/NextPractice';
import TechniqueCard from '../../components/dashboard/TechniqueCard';
import TechniqueGridItem from '../../components/dashboard/TechniqueGridItem';
import { useAppContext } from '../../components/Localization';
import NotificationManager from '../../components/NotificationManager';
import { useNotificationScheduler } from '../../components/NotificationScheduler';
import { useSubscriptionStatus } from '../../components/SubscriptionGuard';

export default function Dashboard() {
  const { t, user: contextUser } = useAppContext();
  const { user, subscriptionStatus, isLoading: isAppLoading } = useSubscriptionStatus();
  
  // Use context user if available, otherwise use subscription user
  const effectiveUser = contextUser || user;
  const { scheduleReminders } = useNotificationScheduler();
  const [techniques, setTechniques] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [filters, setFilters] = useState({ searchTerm: '', categories: ['All'] as string[] });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Clean up techniques that have training_id but don't have "Try Next Class" category
  const cleanupTechniques = useCallback(async () => {
    try {
      const userTechniques = await Technique.filter({ created_by: effectiveUser.email });
      let updatedCount = 0;
      
      for (const technique of userTechniques) {
        const categories = technique.category ? technique.category.split(',').map((cat: string) => cat.trim()) : [];
        const hasTryNextClass = categories.includes('Try Next Class');
        const hasTrainingId = technique.training_id;
        
        // If technique has training_id but doesn't have "Try Next Class" category, clear the training_id
        if (hasTrainingId && !hasTryNextClass) {
          await Technique.update(technique.id, {
            ...technique,
            training_id: null,
            updated_date: new Date().toISOString()
          });
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`Cleaned up ${updatedCount} techniques`);
      }
    } catch (error) {
      console.error('Error cleaning up techniques:', error);
    }
  }, [effectiveUser]);

  const loadData = useCallback(async () => {
    if (isAppLoading || !effectiveUser) return;

    setIsDataLoading(true);
    try {
      const myTechniquesPromise = Technique.filter({ created_by: effectiveUser.email });
      const trainingPromise = Training.filter({ created_by: effectiveUser.email });
      const sharedTechniquesPromise = effectiveUser.gym_id ? Technique.filter({ shared_by_gym_id: effectiveUser.gym_id }) : Promise.resolve([]);

      const [myTechniques, sharedTechniques, trainingData] = await Promise.all([
        myTechniquesPromise,
        sharedTechniquesPromise,
        trainingPromise
      ]);

      const allTechniques = [...myTechniques, ...sharedTechniques];
      const uniqueTechniques = Array.from(new Map(allTechniques.map((tech: any) => [tech.id, tech])).values());
      uniqueTechniques.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

      setTechniques(uniqueTechniques);
      setTrainings(trainingData);
      
      // Clean up techniques that have training_id but don't have "Try Next Class" category
      await cleanupTechniques();
      
      // Schedule notifications for upcoming trainings
      if (effectiveUser && effectiveUser.notifications_enabled === 'true') {
        await scheduleReminders(uniqueTechniques, trainingData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [effectiveUser, isAppLoading]);

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (e.g., after creating a technique)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteTechnique = async (id: string) => {
    try {
      const techniqueToDelete = techniques.find((t: any) => t.id === id);
      if (techniqueToDelete?.created_by !== effectiveUser.email) {
        Alert.alert("Error", "You can only delete techniques you have created.");
        return;
      }
      await Technique.delete(id);
      setTechniques(prev => prev.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete technique", err);
    }
  };

  const handleTechniqueUpdate = (updatedTechnique: any) => {
    setTechniques((prev: any[]) => prev.map((t: any) => t.id === updatedTechnique.id ? updatedTechnique : t));
  };

  const filteredTechniques = useMemo(() => {
    let resultingTechniques = [...techniques];

    // Filter by scheduling if the setting is enabled
    if (effectiveUser?.show_only_next_training_techniques === 'true' || effectiveUser?.show_only_next_training_techniques === true) {
      const nextTraining = trainings.find(training => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const trainingDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(training.dayOfWeek);
        const trainingTime = training.time.split(':').map(Number).reduce((h: number, m: number) => h * 60 + m);
        
        return (trainingDay > currentDay) || (trainingDay === currentDay && trainingTime > currentTime);
      });

      console.log('Next training found:', nextTraining);
      console.log('User setting:', effectiveUser?.show_only_next_training_techniques);
      console.log('Effective user:', effectiveUser);

      if (nextTraining) {
        const beforeFilter = resultingTechniques.length;
        resultingTechniques = resultingTechniques.filter(tech => {
          // Show techniques that are specifically assigned to this training
          if (tech.training_id === nextTraining.id) {
            return true;
          }
          
          // OR show techniques with "Try Next Class" category that have no specific training assignment
          if (tech.category && tech.category.includes('Try Next Class') && !tech.training_id) {
            return true;
          }
          
          return false;
        });
        console.log(`Filtered techniques: ${beforeFilter} -> ${resultingTechniques.length}`);
      }
    }

    // Filter by categories
    if (filters.categories.length > 0 && !filters.categories.includes('All')) {
      resultingTechniques = resultingTechniques.filter(tech => {
        if (!tech.category) return false;
        
        // Parse the technique's categories (comma-separated string)
        const techniqueCategories = tech.category.split(',').map((cat: string) => cat.trim());
        
        // Check if any of the technique's categories match the selected filter categories
        return filters.categories.some(filterCategory => 
          techniqueCategories.includes(filterCategory)
        );
      });
    }

    // Filter by search term
    if (filters.searchTerm) {
      const lowercasedSearch = filters.searchTerm.toLowerCase();
      resultingTechniques = resultingTechniques.filter(tech =>
        (tech.title && tech.title.toLowerCase().includes(lowercasedSearch)) ||
        (tech.tags && tech.tags.toLowerCase().includes(lowercasedSearch))
      );
    }

    return resultingTechniques;
  }, [techniques, filters, effectiveUser?.show_only_next_training_techniques, trainings]);

  const isLoading = isAppLoading || isDataLoading;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Technique limit warning for free users */}
        {subscriptionStatus?.level === 'free' && techniques.length >= 7 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>{t('subscription.technique_limit_reached')}</Text>
            <Text style={styles.warningText}>{t('subscription.techniques_will_be_deleted')}</Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/pricing')}
            >
              <Text style={styles.upgradeButtonText}>{t('subscription.upgrade_now')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Coming Up Next</Text>
          </View>
          <Text style={styles.subtitle}>Techniques to be reminded before next training</Text>
        </View>

        <NotificationManager />

        <NextPractice
          techniques={techniques}
          trainings={trainings}
          onTechniqueDelete={handleDeleteTechnique}
          onTechniqueUpdate={handleTechniqueUpdate}
        />

        <View style={styles.techniquesSection}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <Text style={styles.sectionSubtitle}>Here are all the techniques you've saved. Search, filter, and plan your next session.</Text>
          
          <Filters filters={filters} onFilterChange={setFilters} />
          
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={16} color={viewMode === 'list' ? 'white' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={16} color={viewMode === 'grid' ? 'white' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredTechniques.length > 0 ? (
          viewMode === 'list' ? (
            <View style={styles.listContainer}>
              {filteredTechniques.map(tech => (
                <TechniqueCard
                  key={tech.id}
                  technique={tech}
                  trainings={trainings}
                  onDelete={handleDeleteTechnique}
                  onUpdate={handleTechniqueUpdate}
                />
              ))}
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredTechniques.map(tech => (
                <TechniqueGridItem
                  key={tech.id}
                  technique={tech}
                  trainings={trainings}
                  onDelete={handleDeleteTechnique}
                  onUpdate={handleTechniqueUpdate}
                />
              ))}
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('dashboard.no_techniques_found')}</Text>
            <Text style={styles.emptyText}>{t('dashboard.no_techniques_saved')}</Text>
          </View>
        )}


      </View>
    </ScrollView>
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
  warningContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  warningText: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },

  subtitle: {
    color: '#9CA3AF',
  },
  techniquesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    marginBottom: 16,
  },

  viewModeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  viewModeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  listContainer: {
    gap: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
  },

});
