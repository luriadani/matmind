import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Brand, Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { BorderRadius } from '../constants/Spacing';

const BeltManager = ({ title, belts, setBelts, t }) => {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const handleBeltChange = (index, value) => {
    const newBelts = [...belts];
    newBelts[index] = value;
    setBelts(newBelts);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.textSecondary }]}>{title}</Text>
      <View style={styles.list}>
        {belts.map((belt, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              placeholder={t('settings.belt_name')}
              value={belt}
              onChangeText={(text) => handleBeltChange(index, text)}
              style={[styles.input, { backgroundColor: palette.surfaceSunken, borderColor: palette.border, color: palette.text }]}
              placeholderTextColor={palette.textTertiary}
            />
            <TouchableOpacity
              onPress={() => setBelts(belts.filter((_, i) => i !== index))}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={16} color={Brand.accent} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary }]}
        onPress={() => setBelts([...belts, ''])}
      >
        <Ionicons name="add" size={16} color={Brand.primary} />
        <Text style={[styles.addBtnText, { color: Brand.primary }]}>{t('settings.add_belt')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    ...Typography.smallMedium,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.body,
  },
  removeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  addBtnText: {
    ...Typography.smallMedium,
  },
});

export default BeltManager;
