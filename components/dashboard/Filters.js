import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../Localization';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Brand, getCategoryColor, Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';

const Filters = ({ filters, onFilterChange }) => {
  const { t, settings, user } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

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
      newCategories = ['All'];
    } else if (filters.categories.includes('All')) {
      newCategories = [category];
    } else if (filters.categories.includes(category)) {
      newCategories = filters.categories.filter(c => c !== category);
      if (newCategories.length === 0) newCategories = ['All'];
    } else {
      newCategories = [...filters.categories, category];
    }
    onFilterChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFilterChange({ searchTerm: '', categories: ['All'] });
  };

  const hasActiveFilters = filters.searchTerm || (filters.categories.length > 0 && !filters.categories.includes('All'));

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
        <Ionicons name="search-outline" size={16} color={palette.textTertiary} />
        <TextInput
          placeholder={t('dashboard.search_techniques')}
          value={filters.searchTerm}
          onChangeText={(text) => onFilterChange({ ...filters, searchTerm: text })}
          style={[styles.searchInput, { color: palette.text }]}
          placeholderTextColor={palette.textTertiary}
        />
        {filters.searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => onFilterChange({ ...filters, searchTerm: '' })} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={palette.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category pills */}
      <View style={styles.pillRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
          {/* All pill */}
          <TouchableOpacity
            style={[
              styles.pill,
              { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
              (filters.categories.includes('All') || filters.categories.length === 0) && {
                backgroundColor: Brand.primaryMuted,
                borderColor: Brand.primary,
              },
            ]}
            onPress={() => handleCategoryToggle('All')}
          >
            <Text
              style={[
                styles.pillText,
                { color: palette.textSecondary },
                (filters.categories.includes('All') || filters.categories.length === 0) && { color: Brand.primary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {availableCategories.map(category => {
            const active = filters.categories.includes(category);
            const catColor = getCategoryColor(category);
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.pill,
                  active
                    ? { backgroundColor: catColor.background, borderColor: catColor.border }
                    : { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
                ]}
                onPress={() => handleCategoryToggle(category)}
              >
                <Text style={[styles.pillText, { color: active ? catColor.text : palette.textSecondary }]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} hitSlop={6}>
            <Ionicons name="close" size={13} color={palette.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    padding: 0,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillScroll: {
    gap: 6,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.smallMedium,
  },
  clearBtn: {
    padding: 4,
  },
});

export default Filters;
