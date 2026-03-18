import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../Localization';

const Filters = ({ filters, onFilterChange }) => {
  const { t, settings, user } = useAppContext();

  const getArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').map(item => item.trim()).filter(Boolean);
    return [];
  };

  const availableCategories = getArray(user?.custom_technique_categories || settings.custom_technique_categories);

  const handleCategoryToggle = (category) => {
    let newCategories;
    
    if (category === 'All') {
      // If "All" is clicked, show all techniques
      newCategories = ['All'];
    } else if (filters.categories.includes('All')) {
      // If "All" is currently selected and another category is clicked, remove "All" and add the new category
      newCategories = [category];
    } else if (filters.categories.includes(category)) {
      // If category is already selected, remove it
      newCategories = filters.categories.filter(c => c !== category);
      // If no categories left, select "All"
      if (newCategories.length === 0) {
        newCategories = ['All'];
      }
    } else {
      // Add new category to selection
      newCategories = [...filters.categories, category];
    }
    
    onFilterChange({
      ...filters,
      categories: newCategories
    });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: '',
      categories: ['All']
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder={t('dashboard.search_techniques')}
          value={filters.searchTerm}
          onChangeText={(text) => onFilterChange({ ...filters, searchTerm: text })}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesHeader}>
          {(filters.searchTerm || (filters.categories.length > 0 && !filters.categories.includes('All'))) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
              <Text style={styles.clearButtonText}>{t('dashboard.clear_filters')}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.categoriesList}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              (filters.categories.includes('All') || filters.categories.length === 0) && styles.categoryButtonActive
            ]}
            onPress={() => handleCategoryToggle('All')}
          >
            <Text style={[
              styles.categoryButtonText,
              (filters.categories.includes('All') || filters.categories.length === 0) && styles.categoryButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {availableCategories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                filters.categories.includes(category) && styles.categoryButtonActive
              ]}
              onPress={() => handleCategoryToggle(category)}
            >
                             <Text style={[
                 styles.categoryButtonText,
                 filters.categories.includes(category) && styles.categoryButtonTextActive
               ]}>
                 {category}
               </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    paddingHorizontal: 40,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
});

export default Filters; 