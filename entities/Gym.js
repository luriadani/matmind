import AsyncStorage from '@react-native-async-storage/async-storage';
import { gyms as originalGyms } from '../data/gyms.ts';

const STORAGE_KEY = 'gyms_data';

// Initialize with original data
let gyms = [...originalGyms];

class Gym {
  constructor() {
    this.name = 'Gym';
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        gyms = JSON.parse(storedData);
        console.log('Loaded gyms from storage:', gyms.length);
      } else {
        // First time - save original data to storage
        await this.saveToStorage();
        console.log('Initialized gyms storage with original data');
      }
    } catch (error) {
      console.error('Error loading gyms from storage:', error);
      // Fallback to original data
      gyms = [...originalGyms];
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gyms));
      console.log('Saved gyms to storage:', gyms.length);
    } catch (error) {
      console.error('Error saving gyms to storage:', error);
    }
  }

  async create(data) {
    console.log('Creating Gym:', data);
    const newGym = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    // Add to gyms array
    gyms.push(newGym);
    
    // Save to persistent storage
    await this.saveToStorage();
    
    return newGym;
  }

  async get(id) {
    console.log('Getting Gym with id:', id);
    return gyms.find(gym => gym.id === id);
  }

  async filter(criteria) {
    console.log('Filtering Gyms with criteria:', criteria);
    let filteredGyms = [...gyms];
    
    if (criteria && criteria.id) {
      filteredGyms = filteredGyms.filter(gym => 
        gym.id === criteria.id
      );
    }
    
    return filteredGyms;
  }

  async update(id, data) {
    console.log('Updating Gym:', id, data);
    const index = gyms.findIndex(gym => gym.id === id);
    if (index !== -1) {
      gyms[index] = {
        ...gyms[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return gyms[index];
    }
    throw new Error('Gym not found');
  }

  async delete(id) {
    console.log('Deleting Gym:', id);
    const index = gyms.findIndex(gym => gym.id === id);
    if (index !== -1) {
      const deletedGym = gyms[index];
      gyms.splice(index, 1);
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return true;
    }
    throw new Error('Gym not found');
  }
}

export default new Gym(); 