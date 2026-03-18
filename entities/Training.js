import AsyncStorage from '@react-native-async-storage/async-storage';
import { trainings as originalTrainings } from '../data/trainings.ts';

const STORAGE_KEY = 'trainings_data';

// Initialize with original data
let trainings = [...originalTrainings];

class Training {
  constructor() {
    this.name = 'Training';
    this._initialized = false;
    this._initPromise = this.loadFromStorage();
  }

  async ensureInitialized() {
    if (!this._initialized) {
      await this._initPromise;
    }
  }

  async loadFromStorage() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        trainings = JSON.parse(storedData);
        console.log('Loaded trainings from storage:', trainings.length);
      } else {
        // First time - save original data to storage
        await this.saveToStorage();
        console.log('Initialized trainings storage with original data');
      }
    } catch (error) {
      console.error('Error loading trainings from storage:', error);
      // Fallback to original data
      trainings = [...originalTrainings];
    } finally {
      this._initialized = true;
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trainings));
      console.log('Saved trainings to storage:', trainings.length);
    } catch (error) {
      console.error('Error saving trainings to storage:', error);
    }
  }

  async create(data) {
    console.log('Creating Training:', data);
    const newTraining = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      created_by: data.created_by || 'user@example.com',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    // Add to trainings array
    trainings.push(newTraining);
    
    // Save to persistent storage
    await this.saveToStorage();
    
    return newTraining;
  }

  async get(id) {
    console.log('Getting Training with id:', id);
    return trainings.find(training => training.id === id);
  }

  async filter(criteria) {
    await this.ensureInitialized();
    console.log('Filtering Trainings with criteria:', criteria);
    let filteredTrainings = [...trainings];
    
    if (criteria && criteria.created_by) {
      filteredTrainings = filteredTrainings.filter(training => 
        training.created_by === criteria.created_by
      );
    }
    
    return filteredTrainings;
  }

  async update(id, data) {
    console.log('Updating Training:', id, data);
    const index = trainings.findIndex(training => training.id === id);
    if (index !== -1) {
      trainings[index] = {
        ...trainings[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return trainings[index];
    }
    throw new Error('Training not found');
  }

  async delete(id) {
    console.log('=== TRAINING DELETE DEBUG ===');
    console.log('Deleting Training:', id);
    console.log('Available trainings before delete:', trainings.map(t => ({ id: t.id, dayOfWeek: t.dayOfWeek })));
    console.log('Trainings array length before delete:', trainings.length);
    
    const index = trainings.findIndex(training => training.id === id);
    console.log('Found index:', index);
    
    if (index !== -1) {
      const deletedTraining = trainings[index];
      console.log('About to delete training:', deletedTraining);
      
      trainings.splice(index, 1);
      console.log('Deleted training:', deletedTraining);
      console.log('Remaining trainings count:', trainings.length);
      console.log('Available trainings after delete:', trainings.map(t => ({ id: t.id, dayOfWeek: t.dayOfWeek })));
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return true;
    }
    console.log('Training not found for ID:', id);
    throw new Error('Training not found');
  }
}

export default new Training(); 