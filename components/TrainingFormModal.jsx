import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';
import { useColorScheme } from '../hooks/useColorScheme';
import { Brand, Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { BorderRadius, Spacing } from '../constants/Spacing';

const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const defaultTrainingCategories = ['gi', 'no_gi', 'competition', 'beginner', 'advanced', 'open_mat'];

const TrainingFormModal = ({ visible, onClose, onSave, training = null }) => {
  const { t, language, settings } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const currentDays = language === 'he' ? daysOfWeek : daysOfWeekEn;

  const emptyForm = { dayOfWeek: currentDays[0], time: '19:00', location: '', category: 'gi', instructor: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (training) {
      setFormData({
        dayOfWeek: training.dayOfWeek || currentDays[0],
        time: training.time || '19:00',
        location: training.location || '',
        category: training.category || 'gi',
        instructor: training.instructor || '',
      });
    } else {
      setFormData({ ...emptyForm, dayOfWeek: currentDays[0] });
    }
    setErrors({});
  }, [training, visible, language]);

  const validate = () => {
    const e = {};
    if (!formData.dayOfWeek) e.dayOfWeek = 'Required';
    if (!formData.time) e.time = 'Required';
    if (!formData.category) e.category = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return [];
  };

  const allCategories = [...new Set([...defaultTrainingCategories, ...getArray(settings?.custom_training_categories)])];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: palette.surfaceElevated }]}>

          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: palette.border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: palette.border }]}>
            <Text style={[styles.title, { color: palette.text }]}>
              {training ? t('schedule.edit_training') || 'Edit Training' : t('schedule.add_training') || 'Add Training'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {/* Day */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Day</Text>
              <View style={styles.pillRow}>
                {currentDays.map(day => {
                  const active = formData.dayOfWeek === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pill,
                        { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
                        active && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
                      ]}
                      onPress={() => setFormData(p => ({ ...p, dayOfWeek: day }))}
                    >
                      <Text style={[styles.pillText, { color: active ? Brand.primary : palette.textSecondary }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.dayOfWeek && <Text style={styles.error}>{errors.dayOfWeek}</Text>}
            </View>

            {/* Time */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Time</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[
                    styles.timeInput,
                    { backgroundColor: palette.surfaceSunken, borderColor: errors.time ? Brand.accent : palette.border, color: palette.text },
                  ]}
                  value={formData.time}
                  onChangeText={(text) => setFormData(p => ({ ...p, time: text }))}
                  placeholder="19:00"
                  placeholderTextColor={palette.textTertiary}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={[styles.timeFormat, { color: palette.textTertiary }]}>
                  {settings?.time_format === '12h' ? '12h' : '24h'}
                </Text>
              </View>
              {errors.time && <Text style={styles.error}>{errors.time}</Text>}
            </View>

            {/* Training Type */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Training Type</Text>
              <View style={styles.pillRow}>
                {allCategories.map(cat => {
                  const active = formData.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.pill,
                        { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
                        active && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
                      ]}
                      onPress={() => setFormData(p => ({ ...p, category: cat }))}
                    >
                      <Text style={[styles.pillText, { color: active ? Brand.primary : palette.textSecondary }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.category && <Text style={styles.error}>{errors.category}</Text>}
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Location</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: palette.surfaceSunken, borderColor: palette.border, color: palette.text }]}
                value={formData.location}
                onChangeText={(text) => setFormData(p => ({ ...p, location: text }))}
                placeholder="e.g. Main gym"
                placeholderTextColor={palette.textTertiary}
              />
            </View>

            {/* Instructor */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Instructor <Text style={{ color: palette.textTertiary }}>(optional)</Text></Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: palette.surfaceSunken, borderColor: palette.border, color: palette.text }]}
                value={formData.instructor}
                onChangeText={(text) => setFormData(p => ({ ...p, instructor: text }))}
                placeholder="Instructor name"
                placeholderTextColor={palette.textTertiary}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: palette.border }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: palette.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: Brand.primary }]}
              onPress={() => validate() && onSave(formData)}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.cardPaddingH,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.bodySemibold,
  },
  closeBtn: {
    padding: 2,
  },
  body: {
    paddingHorizontal: Spacing.cardPaddingH,
    paddingTop: 16,
  },
  field: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    ...Typography.smallMedium,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.captionMedium,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.body,
  },
  timeFormat: {
    ...Typography.caption,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.body,
  },
  error: {
    ...Typography.caption,
    color: '#FF6B6B',
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: Spacing.cardPaddingH,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    ...Typography.bodySemibold,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveText: {
    ...Typography.bodySemibold,
    color: '#FFFFFF',
  },
});

export default TrainingFormModal;
