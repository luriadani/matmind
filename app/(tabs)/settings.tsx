import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BeltManager from '../../components/BeltManager';
import { useAppContext } from '../../components/Localization';
import NotificationSettings from '../../components/NotificationSettings';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Brand, Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useSubscriptionStatus } from '../../components/SubscriptionGuard';

const defaultBelts = ['white', 'blue', 'purple', 'brown', 'black'];
const defaultTechniqueCategories = ['Try Next Class', 'Show Coach', 'Favorite'];
const fixedTechniqueCategories = ['Try Next Class'];
const languages = [{ value: 'he', label: 'עברית' }, { value: 'en', label: 'English' }];

/** Inline list manager for custom categories / belts */
const ListManager = ({ title, placeholder, list, setList, t, fixedItems = [] }) => {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const handleChange = (i, v) => { const n = [...list]; n[i] = v; setList(n); };
  const isFixed = (item) => fixedItems.includes(item);

  return (
    <View style={styles.listManager}>
      <Text style={[styles.listManagerTitle, { color: palette.textSecondary }]}>{title}</Text>
      {list.map((item, i) => (
        <View key={i} style={styles.listManagerRow}>
          <TextInput
            value={item}
            onChangeText={(v) => handleChange(i, v)}
            placeholder={placeholder}
            placeholderTextColor={palette.textTertiary}
            editable={!isFixed(item)}
            style={[
              styles.listManagerInput,
              {
                backgroundColor: palette.surfaceSunken,
                borderColor: palette.border,
                color: isFixed(item) ? palette.textTertiary : palette.text,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => { if (!isFixed(item)) setList(list.filter((_, j) => j !== i)); }}
            disabled={isFixed(item)}
            style={styles.removeBtn}
            hitSlop={8}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={isFixed(item) ? palette.textTertiary : Brand.accent}
            />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setList([...list, ''])}
        style={[styles.addItemBtn, { borderColor: Brand.primary }]}
      >
        <Ionicons name="add" size={15} color={Brand.primary} />
        <Text style={[styles.addItemText, { color: Brand.primary }]}>Add item</Text>
      </TouchableOpacity>
    </View>
  );
};

/** Segmented control for 2–4 options */
const SegmentedControl = ({ options, value, onChange, palette }) => (
  <View style={[styles.segmented, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
    {options.map((opt) => (
      <TouchableOpacity
        key={opt.value}
        style={[
          styles.segment,
          value === opt.value && { backgroundColor: Brand.primary },
        ]}
        onPress={() => onChange(opt.value)}
      >
        <Text
          style={[
            styles.segmentText,
            { color: value === opt.value ? '#FFF' : palette.textSecondary },
          ]}
        >
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

/** Card container for a settings group */
const SettingsCard = ({ children, palette }) => (
  <View
    style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
  >
    {children}
  </View>
);

/** Single settings row with label + control on right */
const SettingsRow = ({ label, description = null, control, palette, noBorder = false }) => (
  <View style={[styles.settingsRow, !noBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border }]}>
    <View style={styles.settingsRowLeft}>
      <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
      {description && (
        <Text style={[styles.rowDescription, { color: palette.textSecondary }]}>{description}</Text>
      )}
    </View>
    <View style={styles.settingsRowRight}>{control}</View>
  </View>
);

export default function Settings() {
  const { t, settings, updateSettings, user, isLoading: isAppLoading, getTextDirection, logout } = useAppContext();
  const { subscriptionStatus } = useSubscriptionStatus();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const planLabel = (() => {
    if (!subscriptionStatus) return 'Free';
    if (subscriptionStatus.tier === 'admin') return 'Admin';
    if (subscriptionStatus.tier === 'paid_lifetime') return 'Lifetime';
    if (subscriptionStatus.tier === 'paid_yearly') return 'Yearly';
    if (subscriptionStatus.tier === 'trial_active') return 'Trial';
    return 'Free';
  })();
  const isPremium = subscriptionStatus?.level === 'premium' || subscriptionStatus?.level === 'admin';

  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [customTrainingCategories, setCustomTrainingCategories] = useState<string[]>([]);
  const [customTechniqueCategories, setCustomTechniqueCategories] = useState<string[]>([]);
  const [customBelts, setCustomBelts] = useState<string[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  useEffect(() => {
    if (isAppLoading || !settings) return;
    const data = { ...settings };
    setCustomTrainingCategories(getArray(data.custom_training_categories));
    const techCats = getArray(data.custom_technique_categories);
    setCustomTechniqueCategories(techCats.length > 0 ? techCats : [...defaultTechniqueCategories]);
    const belts = getArray(data.custom_belts);
    setCustomBelts(belts.length > 0 ? belts : defaultBelts);
    const visible = getArray(data.dashboard_visible_categories);
    setVisibleCategories(visible.length > 0 ? visible : ['Try Next Class']);
    data.show_only_next_training_techniques =
      typeof data.show_only_next_training_techniques === 'boolean'
        ? data.show_only_next_training_techniques
        : data.show_only_next_training_techniques === 'true';
    data.notifications_enabled =
      typeof data.notifications_enabled === 'boolean'
        ? data.notifications_enabled
        : data.notifications_enabled === 'true';
    if (!data.belt) data.belt = defaultBelts[0];
    if (!data.notification_minutes_before) data.notification_minutes_before = 10;
    else data.notification_minutes_before = parseInt(data.notification_minutes_before) || 10;
    setFormData(data);
  }, [settings, isAppLoading]);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    const payload = {
      belt: formData.belt,
      language: formData.language,
      time_format: formData.time_format,
      custom_training_categories: customTrainingCategories.filter((c) => c?.trim()).join(', '),
      custom_technique_categories: customTechniqueCategories.filter((c) => c?.trim()).join(', '),
      custom_belts: customBelts.filter((b) => b?.trim()).join(', '),
      dashboard_visible_categories: visibleCategories.join(', '),
      show_only_next_training_techniques: String(formData.show_only_next_training_techniques),
      notifications_enabled: String(formData.notifications_enabled),
      notification_minutes_before: String(formData.notification_minutes_before || 10),
    };
    try {
      await updateSettings(payload);
      setSuccessMessage(t('settings.changes_saved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error('Failed to save settings', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAppLoading || !formData) {
    return (
      <View style={[styles.loader, { backgroundColor: palette.background }]}>
        <Text style={[styles.loaderText, { color: palette.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  const validBelts = customBelts.filter((b) => b?.trim());

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title={t('settings.title') || 'Settings'}
        subtitle={
          `Version ${Constants.expoConfig?.version || '1.0.0'} · Build ${Constants.expoConfig?.android?.versionCode || '1'}`
        }
      />

      {/* ── Profile ────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.profile_details') || 'Profile'} style={styles.sectionHeader} />
        <SettingsCard palette={palette}>
          <SettingsRow
            label={t('settings.name') || 'Name'}
            control={<Text style={[styles.readValue, { color: palette.textSecondary }]}>{user?.full_name}</Text>}
            palette={palette}
          />
          <SettingsRow
            label={t('settings.email') || 'Email'}
            control={<Text style={[styles.readValue, { color: palette.textSecondary }]}>{user?.email}</Text>}
            palette={palette}
            noBorder
          />
        </SettingsCard>
      </View>

      {/* ── Subscription ───────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Subscription" style={styles.sectionHeader} />
        <SettingsCard palette={palette}>
          <View style={[styles.subscriptionRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: palette.text }]}>Current Plan</Text>
              <Text style={[styles.rowDescription, { color: isPremium ? Brand.success : palette.textSecondary }]}>
                {planLabel}{subscriptionStatus?.expiresAt ? ` · renews ${new Date(subscriptionStatus.expiresAt).toLocaleDateString()}` : ''}
              </Text>
            </View>
            {!isPremium ? (
              <Button
                label="Upgrade"
                variant="primary"
                size="sm"
                onPress={() => router.push('/pricing')}
              />
            ) : (
              <Button
                label="Manage"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/pricing')}
              />
            )}
          </View>
        </SettingsCard>
      </View>

      {/* ── Belt ───────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.belt') || 'Belt'} style={styles.sectionHeader} />
        <View style={styles.beltRow}>
          {validBelts.map((belt) => (
            <TouchableOpacity
              key={belt}
              style={[
                styles.beltPill,
                { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
                formData.belt === belt && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
              ]}
              onPress={() => handleChange('belt', belt)}
            >
              <Text
                style={[
                  styles.beltText,
                  { color: formData.belt === belt ? Brand.primary : palette.textSecondary },
                ]}
              >
                {belt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── App Preferences ────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.app_preferences') || 'Preferences'} style={styles.sectionHeader} />
        <SettingsCard palette={palette}>
          <View style={styles.settingsRow}>
            <Text style={[styles.rowLabel, { color: palette.text }]}>{t('settings.language') || 'Language'}</Text>
            <SegmentedControl
              options={languages}
              value={formData.language}
              onChange={(v) => handleChange('language', v)}
              palette={palette}
            />
          </View>
          <View style={styles.settingsRow}>
            <Text style={[styles.rowLabel, { color: palette.text }]}>{t('settings.time_format') || 'Time format'}</Text>
            <SegmentedControl
              options={[{ value: '24h', label: '24h' }, { value: '12h', label: '12h' }]}
              value={formData.time_format}
              onChange={(v) => handleChange('time_format', v)}
              palette={palette}
            />
          </View>
          <SettingsRow
            label={t('settings.show_only_next_training') || 'Next training only'}
            description={t('settings.show_only_next_training_description') || 'Show techniques for your next scheduled session'}
            control={
              <Switch
                value={formData.show_only_next_training_techniques}
                onValueChange={(v) => handleChange('show_only_next_training_techniques', v)}
                trackColor={{ false: palette.border, true: Brand.primary }}
                thumbColor="#FFFFFF"
              />
            }
            palette={palette}
            noBorder
          />
        </SettingsCard>
      </View>

      {/* ── Dashboard categories ───────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.dashboard_categories_title') || 'Visible categories'} style={styles.sectionHeader} />
        <SettingsCard palette={palette}>
          {customTechniqueCategories.map((cat, i) => (
            <SettingsRow
              key={cat}
              label={cat}
              control={
                <Switch
                  value={visibleCategories.includes(cat)}
                  onValueChange={(v) =>
                    setVisibleCategories((prev) =>
                      v ? [...prev, cat] : prev.filter((c) => c !== cat)
                    )
                  }
                  trackColor={{ false: palette.border, true: Brand.primary }}
                  thumbColor="#FFFFFF"
                />
              }
              palette={palette}
              noBorder={i === customTechniqueCategories.length - 1}
            />
          ))}
        </SettingsCard>
      </View>

      {/* ── Notifications ──────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.notifications') || 'Notifications'} style={styles.sectionHeader} />
        <NotificationSettings formData={formData} handleChange={handleChange} />
      </View>

      {/* ── Customization ─────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title={t('settings.customization') || 'Customization'} style={styles.sectionHeader} />
        <SettingsCard palette={palette}>
          <ListManager
            title={t('settings.custom_technique_categories') || 'Technique categories'}
            placeholder={t('settings.category_name') || 'Category name'}
            list={customTechniqueCategories}
            setList={setCustomTechniqueCategories}
            fixedItems={defaultTechniqueCategories}
            t={t}
          />
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <ListManager
            title={t('settings.custom_training_categories') || 'Training categories'}
            placeholder={t('settings.category_name') || 'Category name'}
            list={customTrainingCategories}
            setList={setCustomTrainingCategories}
            t={t}
          />
          <View style={[styles.divider, { backgroundColor: palette.border }]} />
          <BeltManager
            title={t('settings.custom_belts') || 'Belt ranks'}
            belts={customBelts}
            setBelts={setCustomBelts}
            t={t}
          />
        </SettingsCard>
      </View>

      {/* ── Save ───────────────────────────────────── */}
      <View style={styles.saveSection}>
        {!!successMessage && (
          <View style={[styles.successBanner, { backgroundColor: Brand.successMuted }]}>
            <Ionicons name="checkmark-circle" size={16} color={Brand.success} />
            <Text style={[styles.successText, { color: Brand.success }]}>{successMessage}</Text>
          </View>
        )}
        <Button
          label={isSaving ? (t('general.saving') || 'Saving…') : (t('settings.save_changes') || 'Save Changes')}
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          onPress={handleSubmit}
        />
      </View>

      {/* ── Log Out ────────────────────────────────── */}
      <View style={styles.logoutSection}>
        <Button
          label={t('settings.log_out') || 'Log Out'}
          variant="ghost"
          size="lg"
          fullWidth
          onPress={() => {
            logout().then(() => router.replace('/login'));
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.screenPaddingH,
    paddingTop: Spacing.screenPaddingV,
    paddingBottom: 48,
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { ...Typography.body },

  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 10 },

  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  settingsRowLeft: { flex: 1 },
  settingsRowRight: {},
  rowLabel: { ...Typography.bodyMedium },
  rowDescription: { ...Typography.caption, marginTop: 2, lineHeight: 16 },
  readValue: { ...Typography.body },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },

  // Belt picker
  beltRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  beltPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  beltText: { ...Typography.smallMedium, textTransform: 'capitalize' },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  segmentText: { ...Typography.smallMedium },

  // List manager
  listManager: { padding: 14, gap: 8 },
  listManagerTitle: { ...Typography.captionMedium, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  listManagerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listManagerInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Typography.body,
  },
  removeBtn: { padding: 4 },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addItemText: { ...Typography.smallMedium },

  // Save section
  saveSection: { gap: 12 },
  logoutSection: { marginTop: 8, marginBottom: 16 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.md,
    padding: 12,
  },
  successText: { ...Typography.bodyMedium },
});
