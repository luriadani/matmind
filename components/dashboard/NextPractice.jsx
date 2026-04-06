import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTime, parseArray } from '../../utils/formatters';
import { useAppContext } from '../Localization';
import PlatformIcon from '../PlatformIcon';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Brand, Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';

const NextPractice = ({ trainings, techniques, onTechniqueDelete, onTechniqueUpdate }) => {
  const { t, settings, user } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const getDayNumber = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
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

    const sortedTrainings = trainings
      .map(training => ({
        ...training,
        dayNumber: getDayNumber(training.dayOfWeek),
        timeInMinutes: parseTimeToMinutes(training.time),
      }))
      .sort((a, b) => a.dayNumber !== b.dayNumber ? a.dayNumber - b.dayNumber : a.timeInMinutes - b.timeInMinutes);

    for (let i = 0; i < sortedTrainings.length; i++) {
      const training = sortedTrainings[i];
      if (training.dayNumber === currentDay && training.timeInMinutes > currentTime) {
        return { ...training, isToday: true, daysUntil: 0 };
      }
      if (training.dayNumber > currentDay) {
        return { ...training, isToday: false, daysUntil: training.dayNumber - currentDay };
      }
    }

    if (sortedTrainings.length > 0) {
      const first = sortedTrainings[0];
      return { ...first, isToday: false, daysUntil: (7 - currentDay + first.dayNumber) % 7 };
    }

    return null;
  }, [trainings]);

  const nextTrainingTechniques = useMemo(() => {
    if (!nextTraining || !techniques) return [];
    const dashboardVisibleCategories = parseArray(user?.dashboard_visible_categories || 'Try Next Class');
    return techniques.filter(technique => {
      const techniqueCategories = parseArray(technique.category);
      const hasVisibleCategory = techniqueCategories.some(c => dashboardVisibleCategories.includes(c));
      if (!hasVisibleCategory) return false;
      if (technique.training_id === nextTraining.id) return true;
      return techniqueCategories.some(c => dashboardVisibleCategories.includes(c) && !technique.training_id);
    });
  }, [nextTraining, techniques, user?.dashboard_visible_categories]);

  if (!nextTraining) {
    return (
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="calendar-outline" size={16} color={Brand.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('dashboard.selected_drills')}</Text>
        </View>
        <Text style={[styles.emptyText, { color: palette.textTertiary }]}>
          {t('dashboard.no_upcoming_practices')}
        </Text>
      </View>
    );
  }

  const timeDisplay = `${nextTraining.dayOfWeek} · ${formatTime(nextTraining.time, settings.time_format)}`;

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: Brand.primaryMuted }]}>
          <Ionicons name="calendar-outline" size={16} color={Brand.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: palette.text }]}>{t('dashboard.selected_drills')}</Text>
        {nextTraining.isToday && (
          <View style={[styles.todayBadge, { backgroundColor: Brand.accentMuted }]}>
            <Text style={[styles.todayBadgeText, { color: Brand.accent }]}>{t('general.today')}</Text>
          </View>
        )}
      </View>

      {/* Time row */}
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
        <Text style={[styles.metaText, { color: palette.textSecondary }]}>{timeDisplay}</Text>

        {nextTraining.category && (
          <View style={[styles.categoryPill, { backgroundColor: Brand.primaryMuted }]}>
            <Text style={[styles.categoryPillText, { color: Brand.primary }]}>
              {nextTraining.category}
            </Text>
          </View>
        )}
      </View>

      {nextTraining.location && (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={palette.textTertiary} />
          <Text style={[styles.metaText, { color: palette.textTertiary }]}>{nextTraining.location}</Text>
        </View>
      )}

      {nextTraining.instructor && (
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={palette.textTertiary} />
          <Text style={[styles.metaText, { color: palette.textTertiary }]}>{nextTraining.instructor}</Text>
        </View>
      )}

      {/* Techniques list */}
      {nextTrainingTechniques.length > 0 && (
        <View style={[styles.techniquesSection, { borderTopColor: palette.border }]}>
          <ScrollView style={styles.techniqueScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={styles.techniqueList}>
              {nextTrainingTechniques.map(technique => (
                <TouchableOpacity
                  key={technique.id}
                  style={[styles.techniqueRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}
                  activeOpacity={0.7}
                  onPress={() => technique.video_url && Linking.openURL(technique.video_url).catch(() => {})}
                >
                  <PlatformIcon platform={technique.source_platform} size={13} color={Brand.primary} />
                  <Text style={[styles.techniqueTitle, { color: palette.text }]} numberOfLines={1}>
                    {technique.title}
                  </Text>
                  {technique.category && (
                    <View style={[styles.catPill, { backgroundColor: Brand.primaryMuted }]}>
                      <Text style={[styles.catPillText, { color: Brand.primary }]} numberOfLines={1}>
                        {parseArray(technique.category)[0]}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => onTechniqueDelete(technique.id)}
                    hitSlop={8}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={15} color={Brand.accent} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: Spacing.cardPaddingH,
    marginBottom: Spacing.cardGap,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.bodySemibold,
    flex: 1,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  todayBadgeText: {
    ...Typography.captionMedium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...Typography.caption,
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryPillText: {
    ...Typography.captionMedium,
  },
  techniquesSection: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  techniqueScroll: {
    maxHeight: 180,
  },
  techniqueList: {
    gap: 6,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  techniqueTitle: {
    ...Typography.caption,
    flex: 1,
  },
  catPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: 80,
  },
  catPillText: {
    ...Typography.micro,
  },
  deleteBtn: {
    padding: 2,
  },
  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default NextPractice;
