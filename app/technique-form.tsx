import { Technique, Training } from '@/entities/all';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../components/Localization';
import { useSubscriptionStatus } from '../components/SubscriptionGuard';
import { canCreateTechnique } from '../services/billing/entitlements';
import { extractVideoTitle, generateTechniqueTitle } from '../utils/videoTitleExtractor';

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

export default function TechniqueForm() {
  const { t, settings, user, getTextDirection } = useAppContext();
  const { subscriptionStatus } = useSubscriptionStatus();
  const params = useLocalSearchParams();
  const isEditing = !!params.techniqueId;
  
  const [formData, setFormData] = useState({
    title: '',
    video_url: '',
    notes: '',
    tags: '',
    categories: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [trainings, setTrainings] = useState<TrainingData[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [showTrainingSelector, setShowTrainingSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const getArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map(item => item.trim()).filter(Boolean);
    return [];
  };

  const defaultCategories = ["Try Next Class", "Show Coach", "Favorite"];
  const customCategories = getArray(user?.custom_technique_categories || settings.custom_technique_categories);
  // If user has custom categories, use those. Otherwise, use default categories
  const allAvailableCategories = customCategories.length > 0 ? customCategories : defaultCategories;

  // Load user's trainings
  useEffect(() => {
    const loadTrainings = async () => {
      if (user) {
        try {
          const userTrainings = await Training.filter({ created_by: user.email });
          setTrainings(userTrainings as TrainingData[]);
        } catch (error) {
          console.error('Failed to load trainings:', error);
        }
      }
    };
    loadTrainings();
  }, [user]);

  // Load technique data if editing
  useEffect(() => {
    const loadTechniqueData = async () => {
      if (isEditing && params.techniqueId) {
        try {
          const technique = await Technique.get(params.techniqueId as string);
          if (technique) {
            setFormData({
              title: technique.title || '',
              video_url: technique.video_url || '',
              notes: technique.notes || '',
              tags: technique.tags || '',
              categories: []
            });
            const categories = getArray(technique.category);
            setSelectedCategory(categories.length > 0 ? categories[0] : '');
            setSelectedTraining((technique as any).training_id || null);
          }
        } catch (error) {
          console.error('Failed to load technique data:', error);
          Alert.alert('Error', 'Failed to load technique data');
        }
      }
    };
    loadTechniqueData();
  }, [isEditing, params.techniqueId]);

  // Handle shared content from other apps
  useEffect(() => {
    if (params.shared_url && !isEditing) {
      console.log('📤 Handling shared content:', params);
      
      // Auto-fill the form with shared data
      setFormData(prev => ({
        ...prev,
        video_url: params.shared_url as string,
        title: (params.shared_title as string) || prev.title
      }));
      
      // Set default category to "Try Next Class" for shared content
      if (!selectedCategory) {
        setSelectedCategory('Try Next Class');
      }
      
      console.log('✅ Pre-filled form with shared content');
    }
  }, [params.shared_url, params.shared_title, isEditing]);

  // Auto-detect and paste URLs from clipboard
  useEffect(() => {
    const checkClipboardForURL = async () => {
      // Only check clipboard if form is not being edited and no shared content
      if (isEditing || params.shared_url || formData.video_url) {
        return;
      }

      try {
        console.log('📋 Checking clipboard for video URLs...');
        const clipboardContent = await Clipboard.getStringAsync();
        
        if (clipboardContent && clipboardContent.length > 0) {
          console.log('📋 Clipboard content:', clipboardContent);
          
          // Check if clipboard contains a video platform URL
          const isVideoURL = 
            clipboardContent.includes('youtube.com') ||
            clipboardContent.includes('youtu.be') ||
            clipboardContent.includes('instagram.com') ||
            clipboardContent.includes('facebook.com') ||
            clipboardContent.includes('tiktok.com') ||
            clipboardContent.includes('vimeo.com');
            
          if (isVideoURL && clipboardContent.startsWith('http')) {
            console.log('🎬 Video URL detected in clipboard:', clipboardContent);
            
            // Detect platform and extract title
            let platform = 'web';
            if (clipboardContent.includes('youtube.com') || clipboardContent.includes('youtu.be')) {
              platform = 'youtube';
            } else if (clipboardContent.includes('instagram.com')) {
              platform = 'instagram';
            } else if (clipboardContent.includes('facebook.com')) {
              platform = 'facebook';
            } else if (clipboardContent.includes('tiktok.com')) {
              platform = 'tiktok';
            }
            
            // Extract title
            try {
              const extractedTitle = await extractVideoTitle(clipboardContent, platform);
              const techniqueTitle = generateTechniqueTitle(extractedTitle, platform);
              
              // Auto-fill the form
              setFormData(prev => ({
                ...prev,
                video_url: clipboardContent,
                title: techniqueTitle || extractedTitle || prev.title
              }));
              
              // Set default category
              if (!selectedCategory) {
                setSelectedCategory('Try Next Class');
              }
              
              console.log('✅ Auto-filled form from clipboard with title:', techniqueTitle || extractedTitle);
              
              // Optional: Show a brief notification that URL was auto-pasted
              // You can uncomment this if you want user feedback
              // Alert.alert('URL Detected', 'Video URL automatically pasted from clipboard!', [{ text: 'OK' }]);
              
            } catch (titleError) {
              console.error('Error extracting title:', titleError);
              // Still paste the URL even if title extraction fails
              setFormData(prev => ({
                ...prev,
                video_url: clipboardContent
              }));
              
              if (!selectedCategory) {
                setSelectedCategory('Try Next Class');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking clipboard:', error);
        // Fail silently - clipboard access might not be available
      }
    };

    // Add a small delay to ensure form is fully loaded
    const timeoutId = setTimeout(() => {
      checkClipboardForURL();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isEditing, params.shared_url, formData.video_url, selectedCategory]);

  const handleCategorySelect = (category: string) => {
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    
    // Clear training selection if category is not "Try Next Class"
    if (newCategory !== 'Try Next Class') {
      setSelectedTraining(null);
    }
  };



  const handleTrainingSelect = (trainingId: string | null) => {
    setSelectedTraining(trainingId);
    setShowTrainingSelector(false);
  };

  const formatTrainingDisplay = (training: TrainingData) => {
    return `${training.dayOfWeek} at ${training.time} - ${training.category}`;
  };

  const getPlatformFromUrl = (url: string) => {
    if (!url) return 'custom';
    
    const hostname = url.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    } else if (hostname.includes('instagram.com')) {
      return 'instagram';
    } else if (hostname.includes('facebook.com')) {
      return 'facebook';
    } else if (hostname.includes('tiktok.com')) {
      return 'tiktok';
    } else if (hostname.includes('vimeo.com')) {
      return 'vimeo';
    } else {
      return 'custom';
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Technique title is required');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not loaded. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Clean up training_id if category is not "Try Next Class"
      let finalTrainingId = selectedTraining;
      if (selectedCategory !== 'Try Next Class' && selectedTraining) {
        finalTrainingId = null;
      }

      if (isEditing && params.techniqueId) {
        // Update existing technique
        const updateData = {
          ...formData,
          category: selectedCategory,
          training_id: finalTrainingId,
          source_platform: getPlatformFromUrl(formData.video_url),
          updated_date: new Date().toISOString()
        };
        await Technique.update(params.techniqueId as string, updateData);
        Alert.alert('Success', 'Technique updated successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        const ownTechniques = await Technique.filter({ created_by: user.email });
        if (!canCreateTechnique(subscriptionStatus, ownTechniques.length)) {
          Alert.alert('Upgrade required', 'You reached your free technique limit. Upgrade to continue.');
          router.push('/pricing');
          return;
        }

        // Create new technique
        const createData = {
          ...formData,
          category: selectedCategory,
          training_id: finalTrainingId,
          source_platform: getPlatformFromUrl(formData.video_url),
          created_by: user?.email || 'unknown@example.com',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };
        await Technique.create(createData);
        Alert.alert('Success', 'Technique created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error) {
      console.error('Failed to save technique:', error);
      Alert.alert('Error', `Failed to save technique: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading user data...</Text>
      </View>
    );
  }

  // Add error boundary for any rendering issues
  try {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? t('add_technique.edit_title') : t('add_technique.title')}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? t('general.saving') : t('general.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('add_technique.video_url_label')}</Text>
          <View style={styles.formField}>
            <TextInput
              style={styles.input}
              value={formData.video_url}
              onChangeText={(text) => setFormData(prev => ({ ...prev, video_url: text }))}
              placeholder={t('add_technique.video_url_placeholder')}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('add_technique.technique_name_label')}</Text>
          <View style={styles.formField}>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder={t('add_technique.technique_name_placeholder')}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t('add_technique.tags_label')}</Text>
          <View style={styles.formField}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategorySelector(!showCategorySelector)}
            >
              <Text style={[
                styles.dropdownButtonText,
                !selectedCategory && styles.dropdownButtonTextPlaceholder
              ]}>
                {selectedCategory || t('add_technique.select_category')}
              </Text>
              <Ionicons 
                name={showCategorySelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
            
            {showCategorySelector && (
              <View style={styles.dropdownOptions}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {allAvailableCategories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleCategorySelect(category);
                        setShowCategorySelector(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{category}</Text>
                      {selectedCategory === category && (
                        <Ionicons name="checkmark" size={16} color="#60A5FA" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {selectedCategory === 'Try Next Class' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t('add_technique.when_to_show')}</Text>
            <View style={styles.formField}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTrainingSelector(!showTrainingSelector)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedTraining && styles.dropdownButtonTextPlaceholder
                ]}>
                  {selectedTraining ? 
                    trainings.find(t => t.id === selectedTraining) ? 
                      formatTrainingDisplay(trainings.find(t => t.id === selectedTraining)!) : 
                      t('add_technique.selected_training') : 
                    t('add_technique.always_show')
                  }
                </Text>
                <Ionicons 
                  name={showTrainingSelector ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
              
              {showTrainingSelector && (
                <View style={styles.dropdownOptions}>
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleTrainingSelect(null);
                        setShowTrainingSelector(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{t('add_technique.always_show')}</Text>
                      {!selectedTraining && (
                        <Ionicons name="checkmark" size={16} color="#60A5FA" />
                      )}
                    </TouchableOpacity>
                    
                    {trainings.map(training => (
                      <TouchableOpacity
                        key={training.id}
                        style={styles.dropdownOption}
                        onPress={() => {
                          handleTrainingSelect(training.id);
                          setShowTrainingSelector(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{formatTrainingDisplay(training)}</Text>
                        {selectedTraining === training.id && (
                          <Ionicons name="checkmark" size={16} color="#60A5FA" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.formField}>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
              placeholder="Enter tags separated by commas"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.formField}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes about this technique"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>




      </ScrollView>
    </View>
  );
  } catch (error) {
    console.error('Technique form render error:', error);
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Error loading form: {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.saveButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  defaultCategoryButton: {
    backgroundColor: '#1F2937',
    borderColor: '#60A5FA',
  },
  defaultCategoryButtonText: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 16,
  },
  categorySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#60A5FA',
    gap: 6,
  },
  addCategoryButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  newCategoryInput: {
    marginTop: 12,
    gap: 8,
  },
  categoryInput: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  categoryInputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelCategoryButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#6B7280',
    alignItems: 'center',
  },
  cancelCategoryButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmCategoryButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  confirmCategoryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategories: {
    marginTop: 16,
  },
  selectedCategoriesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  selectedCategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  selectedCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  removeCategoryButton: {
    padding: 2,
  },
  trainingOptions: {
    gap: 12,
  },
  trainingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
  },
  trainingOptionSelected: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  trainingOptionText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 12,
  },
  trainingOptionTextSelected: {
    color: '#60A5FA',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dropdownButtonTextPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownOptions: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 200,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dropdownOptionText: {
    color: 'white',
    fontSize: 16,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
}); 