import { Technique, Training } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppContext } from '../components/Localization';
import { useSubscriptionStatus } from '../components/SubscriptionGuard';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';
import { canCreateTechnique } from '../services/billing/entitlements';
import { extractVideoTitle, generateTechniqueTitle } from '../utils/videoTitleExtractor';
import { Brand, Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';
import PlatformIcon from '../components/PlatformIcon';

interface TrainingData {
  id: string;
  dayOfWeek: string;
  time: string;
  category: string;
  location?: string | null;
  instructor?: string | null;
  created_by: string;
  created_date: string;
  updated_date: string;
}

const getPlatformFromUrl = (url: string): string => {
  if (!url) return 'custom';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('facebook.com')) return 'facebook';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('vimeo.com')) return 'vimeo';
  return 'custom';
};

export default function TechniqueForm() {
  const { t, settings, user, getTextDirection } = useAppContext();
  const { subscriptionStatus } = useSubscriptionStatus();
  const params = useLocalSearchParams();
  const isEditing = !!params.techniqueId;
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [formData, setFormData] = useState({ title: '', video_url: '', notes: '', tags: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [trainings, setTrainings] = useState<TrainingData[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [showTrainingSelector, setShowTrainingSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState('custom');

  const getArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const defaultCategories = ['Try Next Class', 'Show Coach', 'Favorite'];
  const customCategories = getArray(user?.custom_technique_categories || settings.custom_technique_categories);
  const allCategories = customCategories.length > 0 ? customCategories : defaultCategories;

  // Load trainings
  useEffect(() => {
    if (!user) return;
    Training.filter({ created_by: user.id })
      .then((data) => setTrainings(data as TrainingData[]))
      .catch(console.error);
  }, [user]);

  // Load technique if editing
  useEffect(() => {
    if (!isEditing || !params.techniqueId) return;
    Technique.get(params.techniqueId as string).then((technique) => {
      if (!technique) return;
      setFormData({
        title: technique.title || '',
        video_url: technique.video_url || '',
        notes: technique.notes || '',
        tags: technique.tags || '',
      });
      const cats = getArray(technique.category);
      setSelectedCategory(cats[0] || '');
      setSelectedTraining((technique as any).training_id || null);
      setDetectedPlatform(getPlatformFromUrl(technique.video_url || ''));
    }).catch(console.error);
  }, [isEditing, params.techniqueId]);

  // Handle incoming share intent
  useEffect(() => {
    if (params.shared_url && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        video_url: params.shared_url as string,
        title: (params.shared_title as string) || prev.title,
      }));
      setDetectedPlatform((params.shared_platform as string) || getPlatformFromUrl(params.shared_url as string));
      if (!selectedCategory) setSelectedCategory('Try Next Class');
    }
  }, [params.shared_url]);

  // Clipboard fallback
  useEffect(() => {
    if (isEditing || params.shared_url || formData.video_url) return;
    const check = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        const isVideo = ['youtube.com', 'youtu.be', 'instagram.com', 'facebook.com', 'tiktok.com', 'vimeo.com']
          .some((d) => text.includes(d));
        if (isVideo && text.startsWith('http')) {
          const platform = getPlatformFromUrl(text);
          try {
            const extracted = await extractVideoTitle(text, platform);
            const title = generateTechniqueTitle(extracted, platform);
            setFormData((prev) => ({ ...prev, video_url: text, title: title || extracted || prev.title }));
            setDetectedPlatform(platform);
            if (!selectedCategory) setSelectedCategory('Try Next Class');
          } catch {
            setFormData((prev) => ({ ...prev, video_url: text }));
          }
        }
      } catch { /* clipboard not available */ }
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [isEditing, params.shared_url]);

  const handleVideoUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, video_url: url }));
    setDetectedPlatform(getPlatformFromUrl(url));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) { Alert.alert('Error', 'Technique title is required'); return; }
    if (!user) { Alert.alert('Error', 'User not loaded.'); return; }
    setIsLoading(true);
    try {
      const finalTrainingId = selectedCategory === 'Try Next Class' ? selectedTraining : null;
      const base = {
        ...formData,
        category: selectedCategory,
        training_id: finalTrainingId,
        source_platform: getPlatformFromUrl(formData.video_url),
        updated_date: new Date().toISOString(),
      };
      if (isEditing && params.techniqueId) {
        await Technique.update(params.techniqueId as string, base);
        router.replace('/(tabs)');
      } else {
        const own = await Technique.filter({ created_by: user.id });
        if (!canCreateTechnique(subscriptionStatus, own.length)) {
          Alert.alert('Upgrade required', 'You have reached your free technique limit.');
          router.push('/pricing');
          return;
        }
        await Technique.create({ ...base, created_by: user.id, created_date: new Date().toISOString() });
        router.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.loader, { backgroundColor: palette.background }]}>
        <Text style={[styles.loaderText, { color: palette.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  const assignedTraining = trainings.find((tr) => tr.id === selectedTraining);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      {/* Modal nav bar */}
      <View style={[styles.navBar, { borderBottomColor: palette.border }]}>
        <Pressable style={styles.navBtn} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="close" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: palette.text }]}>
          {isEditing ? (t('add_technique.edit_title') || 'Edit Technique') : (t('add_technique.title') || 'New Technique')}
        </Text>
        <Button
          label={isLoading ? (t('general.saving') || 'Saving…') : (t('general.save') || 'Save')}
          variant="primary"
          size="sm"
          loading={isLoading}
          onPress={handleSubmit}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Video URL ─────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
            {(t('add_technique.video_url_label') || 'Video URL').toUpperCase()}
          </Text>
          <View style={[styles.urlRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
            <View style={styles.platformIcon}>
              <PlatformIcon platform={detectedPlatform} size={18} color={Brand.primary} />
            </View>
            <TextInput
              style={[styles.urlInput, { color: palette.text }]}
              value={formData.video_url}
              onChangeText={handleVideoUrlChange}
              placeholder={t('add_technique.video_url_placeholder') || 'Paste a YouTube, Instagram or TikTok URL'}
              placeholderTextColor={palette.textTertiary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* ── Title ─────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
            {(t('add_technique.technique_name_label') || 'Technique name').toUpperCase()}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: palette.surfaceSunken, borderColor: palette.border, color: palette.text }]}
            value={formData.title}
            onChangeText={(v) => setFormData((p) => ({ ...p, title: v }))}
            placeholder={t('add_technique.technique_name_placeholder') || 'e.g. Rear Naked Choke'}
            placeholderTextColor={palette.textTertiary}
          />
        </View>

        {/* ── Category ──────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
            {(t('add_technique.categories_label') || 'Categories').toUpperCase()}
          </Text>
          <View style={styles.pillRow}>
            {allCategories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  setSelectedCategory(selectedCategory === cat ? '' : cat);
                  if (cat !== 'Try Next Class') setSelectedTraining(null);
                }}
              >
                <CategoryBadge
                  category={cat}
                  variant={selectedCategory === cat ? 'filled' : 'outline'}
                  style={selectedCategory === cat ? { borderWidth: 2 } : { opacity: 0.6 }}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Training assignment (only for Try Next Class) ── */}
        {selectedCategory === 'Try Next Class' && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
              {(t('add_technique.when_to_show') || 'Show before').toUpperCase()}
            </Text>
            <Pressable
              onPress={() => setShowTrainingSelector(!showTrainingSelector)}
              style={[styles.dropdown, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}
            >
              <Ionicons name="calendar-outline" size={16} color={palette.textSecondary} />
              <Text style={[styles.dropdownValue, { color: selectedTraining ? palette.text : palette.textTertiary }]}>
                {assignedTraining
                  ? `${assignedTraining.dayOfWeek} · ${assignedTraining.time}`
                  : (t('add_technique.always_show') || 'Every training')}
              </Text>
              <Ionicons
                name={showTrainingSelector ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={palette.textSecondary}
              />
            </Pressable>

            {showTrainingSelector && (
              <View style={[styles.dropdownMenu, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
                <Pressable
                  style={[styles.dropdownOption, { borderBottomColor: palette.border }]}
                  onPress={() => { setSelectedTraining(null); setShowTrainingSelector(false); }}
                >
                  <Text style={[styles.dropdownOptionText, { color: !selectedTraining ? Brand.primary : palette.text }]}>
                    {t('add_technique.always_show') || 'Every training'}
                  </Text>
                  {!selectedTraining && <Ionicons name="checkmark" size={16} color={Brand.primary} />}
                </Pressable>
                {trainings.map((tr) => (
                  <Pressable
                    key={tr.id}
                    style={[styles.dropdownOption, { borderBottomColor: palette.border }]}
                    onPress={() => { setSelectedTraining(tr.id); setShowTrainingSelector(false); }}
                  >
                    <Text style={[styles.dropdownOptionText, { color: selectedTraining === tr.id ? Brand.primary : palette.text }]}>
                      {tr.dayOfWeek} · {tr.time} — {tr.category}
                    </Text>
                    {selectedTraining === tr.id && <Ionicons name="checkmark" size={16} color={Brand.primary} />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Notes ─────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>NOTES</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: palette.surfaceSunken, borderColor: palette.border, color: palette.text }]}
            value={formData.notes}
            onChangeText={(v) => setFormData((p) => ({ ...p, notes: v }))}
            placeholder="Key details to remember about this technique…"
            placeholderTextColor={palette.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { ...Typography.body },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPaddingH,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { ...Typography.bodySemibold },

  scroll: { flex: 1 },
  content: {
    padding: Spacing.screenPaddingH,
    gap: 24,
    paddingBottom: 48,
  },

  field: { gap: 8 },
  fieldLabel: {
    ...Typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // URL row with platform icon
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    overflow: 'hidden',
  },
  platformIcon: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlInput: {
    flex: 1,
    paddingVertical: 11,
    paddingRight: 12,
    ...Typography.body,
  },

  // Standard input
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...Typography.body,
  },
  textArea: {
    minHeight: 100,
    lineHeight: 22,
  },

  // Category pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownValue: {
    ...Typography.body,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownOptionText: { ...Typography.body },
});
