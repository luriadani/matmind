import { Technique, Training as TrainingEntity } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../components/Localization';
import { useNotificationScheduler } from '../../components/NotificationScheduler';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import TrainingFormModal from '../../components/TrainingFormModal';
import { Button } from '../../components/ui/Button';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Brand, Colors, TrainingCategoryColors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../hooks/useColorScheme';
import { formatTime } from '../../utils/formatters';

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

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Schedule() {
  const { t, language, settings, user, isLoading: isAppLoading } = useAppContext();
  const { scheduleReminders } = useNotificationScheduler();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentDaysOfWeek = language === 'he' ? daysOfWeek : daysOfWeekEn;

  const loadTrainings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await TrainingEntity.filter({ created_by: user.id });
      data.sort((a, b) => {
        const ai = currentDaysOfWeek.indexOf(a.dayOfWeek);
        const bi = currentDaysOfWeek.indexOf(b.dayOfWeek);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      setTrainings(data);
    } catch (error) {
      console.error('Failed to load trainings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAppLoading && user) loadTrainings();
  }, [user, isAppLoading, language]);

  const handleSaveTraining = async (formData: any) => {
    try {
      const trainingData = { ...formData, created_by: user?.id || "" };
      if (editingTraining) {
        await TrainingEntity.update(editingTraining.id, trainingData);
      } else {
        await TrainingEntity.create(trainingData);
      }
      if (user?.notifications_enabled === 'true') {
        const updated = await TrainingEntity.filter({ created_by: user.id });
        const techniques = await Technique.filter({ created_by: user.id });
        await scheduleReminders(techniques, updated);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save training. Please try again.');
    } finally {
      setIsModalOpen(false);
      loadTrainings();
    }
  };

  const handleDeleteTraining = (id: string) => {
    Alert.alert('Delete Training', 'Are you sure you want to delete this training?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await TrainingEntity.delete(id);
            if (user?.notifications_enabled === 'true') {
              const updated = await TrainingEntity.filter({ created_by: user.id });
              const techniques = await Technique.filter({ created_by: user.id });
              await scheduleReminders(techniques, updated);
            }
          } catch (error: any) {
            Alert.alert('Error', `Failed to delete training: ${error.message}`);
          } finally {
            loadTrainings();
          }
        },
      },
    ]);
  };

  const getCategoryAccent = (category: string): string => {
    const colors = TrainingCategoryColors[category as keyof typeof TrainingCategoryColors]
      ?? TrainingCategoryColors.default;
    return colors.text;
  };

  return (
    <SubscriptionGuard requiredLevel="free">
      <ScrollView
        style={[styles.container, { backgroundColor: palette.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t('schedule.title') || 'My Schedule'}
          subtitle={t('schedule.subtitle') || 'Add regular training times to get reminders'}
          right={
            <Button
              label={t('schedule.add_new_training') || 'Add Training'}
              icon="add"
              variant="primary"
              size="sm"
              onPress={() => { setEditingTraining(null); setIsModalOpen(true); }}
            />
          }
        />

        <TrainingFormModal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTraining}
          training={editingTraining}
        />

        {isLoading ? (
          <View style={styles.skeletons}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.skeletonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              />
            ))}
          </View>
        ) : trainings.length === 0 ? (
          <EmptyState
            variant="schedule"
            onCta={() => { setEditingTraining(null); setIsModalOpen(true); }}
            ctaLabel={t('schedule.add_new_training') || 'Add Training'}
          />
        ) : (
          <View style={styles.list}>
            {trainings.map((training) => {
              const accent = getCategoryAccent(training.category);
              return (
                <View
                  key={training.id}
                  style={[
                    styles.trainingCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                >
                  {/* Left accent bar */}
                  <View style={[styles.accentBar, { backgroundColor: accent }]} />

                  <View style={styles.cardBody}>
                    {/* Day + Time */}
                    <View style={styles.cardTop}>
                      <View style={styles.timeBlock}>
                        <Text style={[styles.dayLabel, { color: accent }]}>
                          {training.dayOfWeek}
                        </Text>
                        <Text style={[styles.timeLabel, { color: palette.text }]}>
                          {formatTime(training.time, settings.time_format)}
                        </Text>
                      </View>

                      {/* Actions */}
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
                          onPress={() => { setEditingTraining(training); setIsModalOpen(true); }}
                          hitSlop={8}
                        >
                          <Ionicons name="create-outline" size={16} color={Brand.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: palette.surfaceSunken }]}
                          onPress={() => handleDeleteTraining(training.id)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={16} color={Brand.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Category + meta */}
                    <View style={styles.cardMeta}>
                      <CategoryBadge category={training.category} compact />
                      {training.location && (
                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={13} color={palette.textSecondary} />
                          <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                            {training.location}
                          </Text>
                        </View>
                      )}
                      {training.instructor && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person-outline" size={13} color={palette.textSecondary} />
                          <Text style={[styles.metaText, { color: palette.textSecondary }]}>
                            {training.instructor}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SubscriptionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.screenPaddingH,
    paddingTop: Spacing.screenPaddingV,
    paddingBottom: 32,
  },
  list: { gap: Spacing.itemGap },
  skeletons: { gap: Spacing.itemGap },
  skeletonCard: {
    height: 100,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  trainingCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBlock: {
    gap: 2,
  },
  dayLabel: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeLabel: {
    ...Typography.title,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
  },
});
