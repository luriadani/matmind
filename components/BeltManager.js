import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BeltManager = ({ title, belts, setBelts, t }) => {
  const handleBeltChange = (index, value) => {
    const newBelts = [...belts];
    newBelts[index] = value;
    setBelts(newBelts);
  };

  const handleAddBelt = () => {
    setBelts([...belts, '']);
  };

  const handleRemoveBelt = (index) => {
    const newBelts = belts.filter((_, i) => i !== index);
    setBelts(newBelts);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.beltsList}>
        {belts.map((belt, index) => (
          <View key={index} style={styles.beltItem}>
            <TextInput
              placeholder={t('settings.belt_name')}
              value={belt}
              onChangeText={(text) => handleBeltChange(index, text)}
              style={styles.beltInput}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveBelt(index)}
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.addBeltButton} onPress={handleAddBelt}>
        <Ionicons name="add-circle" size={16} color="white" />
        <Text style={styles.addBeltButtonText}>{t('settings.add_belt')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  beltsList: {
    marginBottom: 12,
  },
  beltItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  beltInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  addBeltButton: {
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
  addBeltButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default BeltManager; 