import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const daysOfWeekEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaultTrainingCategories = ["gi", "no_gi", "competition", "beginner", "advanced", "open_mat"];

const TrainingFormModal = ({ visible, onClose, onSave, training = null }) => {
  const { t, language, settings } = useAppContext();
  const currentDaysOfWeek = language === 'he' ? daysOfWeek : daysOfWeekEn;
  
  const [formData, setFormData] = useState({
    dayOfWeek: currentDaysOfWeek[0],
    time: '19:00',
    location: '',
    category: 'gi',
    instructor: ''
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (training) {
      setFormData({
        dayOfWeek: training.dayOfWeek || currentDaysOfWeek[0],
        time: training.time || '19:00',
        location: training.location || '',
        category: training.category || 'gi',
        instructor: training.instructor || ''
      });
    } else {
      setFormData({
        dayOfWeek: currentDaysOfWeek[0],
        time: '19:00',
        location: '',
        category: 'gi',
        instructor: ''
      });
    }
    setErrors({});
  }, [training, visible, language]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Day is required';
    }
    
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return [];
  };

  const validCustomCategories = getArray(settings?.custom_training_categories);
  const allTrainingCategories = [...new Set([...defaultTrainingCategories, ...validCustomCategories])];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {training ? 'Edit Training' : 'Add Training'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Day of Week */}
            <View style={styles.formField}>
              <Text style={styles.label}>Day</Text>
              <View style={styles.pickerContainer}>
                {currentDaysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerOption,
                      formData.dayOfWeek === day && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, dayOfWeek: day }))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.dayOfWeek === day && styles.pickerOptionTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.dayOfWeek && (
                <Text style={styles.errorText}>{errors.dayOfWeek}</Text>
              )}
            </View>

            {/* Time */}
            <View style={styles.formField}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.timeContainer}>
                <TextInput
                  style={[styles.timeInput, errors.time && styles.inputError]}
                  value={formData.time}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                  placeholder="19:00"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.timeFormat}>
                  {settings?.time_format === '12h' ? '12h' : '24h'}
                </Text>
              </View>
              {errors.time && (
                <Text style={styles.errorText}>{errors.time}</Text>
              )}
            </View>

            {/* Training Type */}
            <View style={styles.formField}>
              <Text style={styles.label}>Training Type</Text>
              <View style={styles.pickerContainer}>
                {allTrainingCategories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerOption,
                      formData.category === category && styles.pickerOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.category === category && styles.pickerOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            {/* Location */}
            <View style={styles.formField}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Enter location"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Instructor */}
            <View style={styles.formField}>
              <Text style={styles.label}>Instructor (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.instructor}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instructor: text }))}
                placeholder="Enter instructor name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                Save
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  timeFormat: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  textInput: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TrainingFormModal; 