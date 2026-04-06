import { Technique, Training } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Filters from '../../components/dashboard/Filters';
import NextPractice from '../../components/dashboard/NextPractice';
import TechniqueCard from '../../components/dashboard/TechniqueCard';
import TechniqueGridItem from '../../components/dashboard/TechniqueGridItem';
import { useAppContext } from '../../components/Localization';
import NotificationManager from '../../components/NotificationManager';
import { useNotificationScheduler } from '../../components/NotificationScheduler';
import { useSubscriptionStatus } from '../../components/SubscriptionGuard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Brand, Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../hooks/useColorScheme';

/** Staggered fade+slide-up animation for each feed card */
function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const delay = index * 55;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function Dashboard() {
  const { t, user: contextUser } = useAppContext();
  const { user, subscriptionStatus, isLoading: isAppLoading, freeTechniqueLimit } = useSubscriptionStatus();
  const effectiveUser = contextUser || user;
  const { scheduleReminders } = useNotificationScheduler();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [techniques, setTechniques] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [filters, setFilters] = useState({ searchTerm: '', categories: ['All'] as string[] });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [feedKey, setFeedKey] = useState(0); // re-triggers stagger on refresh

  const cleanupTechniques = useCallback(async () => {
    try {
      const userTechniques = await Technique.filter({ created_by: effectiveUser.email });
      for (const technique of userTechniques) {
        const categories = technique.category
          ? technique.category.split(',').map((cat: string) => cat.trim())
          : [];
        if (technique.training_id && !categories.includes('Try Next Class')) {
          await Technique.update(technique.id, {
            ...technique,
            training_id: null,
            updated_date: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning up techniques:', error);
    }
  }, [effectiveUser]);

  const loadData = useCallback(async () => {
    if (isAppLoading || !effectiveUser) return;
    setIsDataLoading(true);
    try {
      const [myTechniques, sharedTechniques, trainingData] = await Promise.all([
        Technique.filter({ created_by: effectiveUser.email }),
        effectiveUser.gym_id
          ? Technique.filter({ shared_by_gym_id: effectiveUser.gym_id })
          : Promise.resolve([]),
        Training.filter({ created_by: effectiveUser.email }),
      ]);

      const unique = Array.from(
        new Map([...myTechniques, ...sharedTechniques].map((t: any) => [t.id, t])).values()
      );
      unique.sort(
        (a: any, b: any) =>
          new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );

      setTechniques(unique);
      setTrainings(trainingData);
      setFeedKey((k) => k + 1);
      await cleanupTechniques();

      if (effectiveUser?.notifications_enabled === 'true') {
        await scheduleReminders(unique, trainingData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, [effectiveUser, isAppLoading]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDeleteTechnique = async (id: string) => {
    try {
      const target = techniques.find((t: any) => t.id === id);
      if (target?.created_by !== effectiveUser.email) return;
      await Technique.delete(id);
      setTechniques((prev) => prev.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete technique', err);
    }
  };

  const handleTechniqueUpdate = (updated: any) => {
    setTechniques((prev: any[]) =>
      prev.map((t: any) => (t.id === updated.id ? updated : t))
    );
  };

  const filteredTechniques = useMemo(() => {
    let result = [...techniques];

    if (
      effectiveUser?.show_only_next_training_techniques === 'true' ||
      effectiveUser?.show_only_next_training_techniques === true
    ) {
      const now = new Date();
      const nextTraining = trainings.find((training) => {
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(training.dayOfWeek);
        const [h, m] = training.time.split(':').map(Number);
        const trainingMins = h * 60 + m;
        const nowMins = now.getHours() * 60 + now.getMinutes();
        return day > now.getDay() || (day === now.getDay() && trainingMins > nowMins);
      });

      if (nextTraining) {
        result = result.filter(
          (tech) =>
            tech.training_id === nextTraining.id ||
            (tech.category?.includes('Try Next Class') && !tech.training_id)
        );
      }
    }

    if (filters.categories.length > 0 && !filters.categories.includes('All')) {
      result = result.filter((tech) => {
        if (!tech.category) return false;
        const techCats = tech.category.split(',').map((c: string) => c.trim());
        return filters.categories.some((fc) => techCats.includes(fc));
      });
    }

    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      result = result.filter(
        (tech) =>
          tech.title?.toLowerCase().includes(q) ||
          tech.tags?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [techniques, filters, effectiveUser?.show_only_next_training_techniques, trainings]);

  const isLoading = isAppLoading || isDataLoading;
  const atLimit = subscriptionStatus?.level === 'free' && techniques.length >= freeTechniqueLimit;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Upgrade warning ─────────────────────────────── */}
      {atLimit && (
        <View style={[styles.warningBanner, { backgroundColor: Brand.accentMuted, borderColor: Brand.accent }]}>
          <View style={styles.warningText}>
            <Text style={[styles.warningTitle, { color: Brand.accent }]}>
              {t('subscription.technique_limit_reached')}
            </Text>
            <Text style={[styles.warningBody, { color: palette.textSecondary }]}>
              {t('subscription.techniques_will_be_deleted')} ({techniques.length}/{freeTechniqueLimit})
            </Text>
          </View>
          <Button
            label={t('subscription.upgrade_now')}
            variant="primary"
            size="sm"
            onPress={() => router.push('/pricing')}
          />
        </View>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <ScreenHeader
        title={t('dashboard.title') || 'Coming Up Next'}
        subtitle={t('dashboard.subtitle') || 'Techniques to review before your next training'}
      />

      <NotificationManager />

      <NextPractice
        techniques={techniques}
        trainings={trainings}
        onTechniqueDelete={handleDeleteTechnique}
        onTechniqueUpdate={handleTechniqueUpdate}
      />

      {/* ── Library section ─────────────────────────────── */}
      <View style={styles.librarySection}>
        <SectionHeader
          title={t('dashboard.library')}
          style={styles.sectionHeader}
        />

        <Filters filters={filters} onFilterChange={setFilters} />

        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
              viewMode === 'list' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={15} color={viewMode === 'list' ? Brand.primary : palette.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
              viewMode === 'grid' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={15} color={viewMode === 'grid' ? Brand.primary : palette.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feed ────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.skeletonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <View style={[styles.skeletonThumb, { backgroundColor: palette.surfaceSunken }]} />
              <View style={styles.skeletonBody}>
                <View style={[styles.skeletonLine, { backgroundColor: palette.surfaceSunken, width: '70%' }]} />
                <View style={[styles.skeletonLine, { backgroundColor: palette.surfaceSunken, width: '45%' }]} />
              </View>
            </View>
          ))}
        </View>
      ) : filteredTechniques.length > 0 ? (
        viewMode === 'list' ? (
          <View key={`list-${feedKey}`} style={styles.listFeed}>
            {filteredTechniques.map((tech, i) => (
              <AnimatedCard key={tech.id} index={i}>
                <TechniqueCard
                  technique={tech}
                  trainings={trainings}
                  onDelete={handleDeleteTechnique}
                  onUpdate={handleTechniqueUpdate}
                />
              </AnimatedCard>
            ))}
          </View>
        ) : (
          <View key={`grid-${feedKey}`} style={styles.gridFeed}>
            {filteredTechniques.map((tech, i) => (
              <AnimatedCard key={tech.id} index={i}>
                <TechniqueGridItem
                  technique={tech}
                  trainings={trainings}
                  onDelete={handleDeleteTechnique}
                  onUpdate={handleTechniqueUpdate}
                />
              </AnimatedCard>
            ))}
          </View>
        )
      ) : (
        <EmptyState
          variant={filters.searchTerm ? 'search' : 'techniques'}
          onCta={filters.searchTerm ? undefined : () => router.push('/add')}
          ctaLabel={filters.searchTerm ? undefined : t('dashboard.add_first') || 'Add your first technique'}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingH,
    paddingTop: Spacing.screenPaddingV,
    paddingBottom: 32,
  },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    ...Typography.bodySemibold,
    marginBottom: 2,
  },
  warningBody: {
    ...Typography.caption,
  },

  // Library section
  librarySection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Feed
  listFeed: {
    gap: Spacing.itemGap,
  },
  gridFeed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Skeleton loader
  skeletonContainer: {
    gap: Spacing.itemGap,
  },
  skeletonCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skeletonThumb: {
    width: '100%',
    height: 180,
  },
  skeletonBody: {
    padding: Spacing.cardPaddingH,
    gap: 10,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
