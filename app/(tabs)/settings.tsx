import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BeltManager from '../../components/BeltManager';
import { useAppContext } from '../../components/Localization';
import NotificationSettings from '../../components/NotificationSettings';

const defaultBelts = ["white", "blue", "purple", "brown", "black"];
const defaultTechniqueCategories = ["Try Next Class", "Show Coach", "Favorite"];
const fixedTechniqueCategories = ["Try Next Class"];
const languages = [{value: "he", label: "עברית"}, {value: "en", label: "English"}];

const ListManager = ({ title, placeholder, list, setList, t, fixedItems = [] }) => {
  const handleItemChange = (index, value) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const handleAddItem = () => {
    setList([...list, '']);
  };

  const handleRemoveItem = (index) => {
    const itemToRemove = list[index];
    if (fixedItems.includes(itemToRemove)) return;
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
  };

  const isItemFixed = (item) => fixedItems.includes(item);

  return (
    <View style={styles.listManager}>
      <Text style={styles.listManagerTitle}>{title}</Text>
      <View style={styles.listManagerItems}>
        {list.map((item, index) => (
          <View key={index} style={styles.listManagerItem}>
            <TextInput
              placeholder={placeholder}
              value={item}
              onChangeText={(text) => handleItemChange(index, text)}
              style={[styles.listManagerInput, isItemFixed(item) && styles.listManagerInputDisabled]}
              editable={!isItemFixed(item)}
            />
            <TouchableOpacity
              style={[styles.removeButton, isItemFixed(item) && styles.removeButtonDisabled]}
              onPress={() => handleRemoveItem(index)}
              disabled={isItemFixed(item)}
            >
              <Ionicons name="trash" size={16} color={isItemFixed(item) ? '#6B7280' : '#EF4444'} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
        <Ionicons name="add" size={16} color="white" />
        <Text style={styles.addItemButtonText}>+ Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Settings() {
  const { t, settings, updateSettings, user, isLoading: isAppLoading, getTextDirection } = useAppContext();
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [customTrainingCategories, setCustomTrainingCategories] = useState([]);
  const [customTechniqueCategories, setCustomTechniqueCategories] = useState([]);
  const [customBelts, setCustomBelts] = useState([]);
  const [visibleCategories, setVisibleCategories] = useState([]);

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map(item => item.trim()).filter(Boolean);
    return [];
  };

  useEffect(() => {
    if (isAppLoading || !settings) return;

    const initialFormData = { ...settings };
    setCustomTrainingCategories(getArray(initialFormData.custom_training_categories));
    const techniqueCategories = getArray(initialFormData.custom_technique_categories);
    // Only add default categories if user has no custom categories, otherwise use what they have
    if (techniqueCategories.length === 0) {
      setCustomTechniqueCategories([...defaultTechniqueCategories]);
    } else {
      setCustomTechniqueCategories(techniqueCategories);
    }
    const belts = getArray(initialFormData.custom_belts);
    setCustomBelts(belts.length > 0 ? belts : defaultBelts);
    const visible = getArray(initialFormData.dashboard_visible_categories);
    setVisibleCategories(visible.length > 0 ? visible : ['Try Next Class']);
    initialFormData.show_only_next_training_techniques = typeof initialFormData.show_only_next_training_techniques === 'boolean' ? initialFormData.show_only_next_training_techniques : initialFormData.show_only_next_training_techniques === 'true';
    initialFormData.notifications_enabled = typeof initialFormData.notifications_enabled === 'boolean' ? initialFormData.notifications_enabled : initialFormData.notifications_enabled === 'true';
    
    // Ensure belt has a default value if not set
    if (!initialFormData.belt) {
      initialFormData.belt = defaultBelts[0]; // Set to first default belt
    }
    
    // Ensure notification_minutes_before has a default value
    if (!initialFormData.notification_minutes_before) {
      initialFormData.notification_minutes_before = 10;
    } else {
      initialFormData.notification_minutes_before = parseInt(initialFormData.notification_minutes_before) || 10;
    }
    
    setFormData(initialFormData);
  }, [settings, isAppLoading]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    
    // Ensure notification_minutes_before has a valid default value
    const notificationMinutes = formData.notification_minutes_before || 10;
    
    const settingsPayload = {
      belt: formData.belt,
      language: formData.language,
      time_format: formData.time_format,
      custom_training_categories: customTrainingCategories.filter(c => c && c.trim() !== '').join(', '),
      custom_technique_categories: customTechniqueCategories.filter(c => c && c.trim() !== '').join(', '),
      custom_belts: customBelts.filter(b => b && b.trim() !== '').join(', '),
      dashboard_visible_categories: visibleCategories.join(', '),
      show_only_next_training_techniques: String(formData.show_only_next_training_techniques),
      notifications_enabled: String(formData.notifications_enabled),
      notification_minutes_before: String(notificationMinutes),
    };
    
    console.log('Saving settings with notification settings:');
    console.log('- Notifications enabled:', formData.notifications_enabled);
    console.log('- Minutes before:', notificationMinutes);
    console.log('Full settings payload:', settingsPayload);

    try {
      await updateSettings(settingsPayload);
      setSuccessMessage(t('settings.changes_saved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
      setSuccessMessage('');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAppLoading || !formData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const validCustomBelts = customBelts.filter(belt => belt && belt.trim() !== '');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.header, { writingDirection: getTextDirection() }]}>
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              Version {Constants.expoConfig?.version || '1.0.0'} (Build {Constants.expoConfig?.android?.versionCode || '1'})
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('settings.profile_details')}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>{t('settings.name')}</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{user?.full_name}</Text>
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>{t('settings.email')}</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{user?.email}</Text>
                </View>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.label}>{t('settings.belt')}</Text>
              <View style={styles.pickerContainer}>
                {validCustomBelts.map(belt => (
                  <TouchableOpacity
                    key={belt}
                    style={[styles.pickerOption, formData.belt === belt && styles.pickerOptionSelected]}
                    onPress={() => handleChange('belt', belt)}
                  >
                    <Text style={[styles.pickerOptionText, formData.belt === belt && styles.pickerOptionTextSelected]}>
                      {belt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('settings.app_preferences')}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.formField}>
              <Text style={styles.label}>{t('settings.language')}</Text>
              <View style={styles.pickerContainer}>
                {languages.map(lang => (
                  <TouchableOpacity
                    key={lang.value}
                    style={[styles.pickerOption, formData.language === lang.value && styles.pickerOptionSelected]}
                    onPress={() => handleChange('language', lang.value)}
                  >
                    <Text style={[styles.pickerOptionText, formData.language === lang.value && styles.pickerOptionTextSelected]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>{t('settings.time_format')}</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.pickerOption, formData.time_format === '24h' && styles.pickerOptionSelected]}
                  onPress={() => handleChange('time_format', '24h')}
                >
                  <Text style={[styles.pickerOptionText, formData.time_format === '24h' && styles.pickerOptionTextSelected]}>
                    {t('settings.24h')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, formData.time_format === '12h' && styles.pickerOptionSelected]}
                  onPress={() => handleChange('time_format', '12h')}
                >
                  <Text style={[styles.pickerOptionText, formData.time_format === '12h' && styles.pickerOptionTextSelected]}>
                    {t('settings.12h')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.switchField}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>{t('settings.show_only_next_training')}</Text>
                <Text style={styles.switchDescription}>{t('settings.show_only_next_training_description')}</Text>
              </View>
              <Switch
                value={formData.show_only_next_training_techniques}
                onValueChange={(value) => handleChange('show_only_next_training_techniques', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={formData.show_only_next_training_techniques ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('settings.dashboard_categories_title')}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardDescription}>{t('settings.dashboard_categories_description')}</Text>
            {customTechniqueCategories.map(cat => (
              <View key={cat} style={styles.categoryItem}>
                <TouchableOpacity
                  style={[styles.checkbox, visibleCategories.includes(cat) && styles.checkboxChecked]}
                  onPress={() => {
                    setVisibleCategories(prev => 
                      visibleCategories.includes(cat) 
                        ? prev.filter(c => c !== cat) 
                        : [...prev, cat]
                    );
                  }}
                >
                  {visibleCategories.includes(cat) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
                <Text style={styles.categoryLabel}>
                  {cat}
                  {fixedTechniqueCategories.includes(cat) && (
                    <Text style={styles.fixedCategoryText}> (Fixed)</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        </View>



        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('settings.customization')}</Text>
          </View>
          <View style={styles.cardContent}>
            <ListManager
              title={t('settings.custom_technique_categories')}
              placeholder={t('settings.category_name')}
              list={customTechniqueCategories}
              setList={setCustomTechniqueCategories}
              fixedItems={defaultTechniqueCategories}
              t={t}
            />
            <ListManager
              title={t('settings.custom_training_categories')}
              placeholder={t('settings.category_name')}
              list={customTrainingCategories}
              setList={setCustomTrainingCategories}
              t={t}
            />
            <BeltManager
              title={t('settings.custom_belts')}
              belts={customBelts}
              setBelts={setCustomBelts}
              t={t}
            />
          </View>
        </View>

        <NotificationSettings formData={formData} handleChange={handleChange} />

        <View style={styles.cardFooter}>
          {successMessage && (
            <View style={styles.successAlert}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isSaving}>
            <Text style={styles.saveButtonText}>
              {isSaving ? t('general.saving') : t('settings.save_changes')}
            </Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
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
  versionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  versionText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formField: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  readOnlyField: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 6,
  },
  readOnlyText: {
    color: 'white',
    fontSize: 14,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  pickerOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  pickerOptionText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4B5563',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  fixedCategoryText: {
    fontSize: 12,
    color: '#60A5FA',
  },
  listManager: {
    marginBottom: 24,
  },
  listManagerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  listManagerItems: {
    marginBottom: 12,
  },
  listManagerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listManagerInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    marginRight: 8,
  },
  listManagerInputDisabled: {
    opacity: 0.5,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignSelf: 'flex-start',
  },
  addItemButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  alertContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCA5A5',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#FCA5A5',
    marginBottom: 8,
  },
  alertHint: {
    fontSize: 12,
    color: '#F87171',
    marginBottom: 16,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  alertButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  enableButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cardFooter: {
    alignItems: 'flex-end',
    gap: 16,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryBadgeText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
}); 