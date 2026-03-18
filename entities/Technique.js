import AsyncStorage from '@react-native-async-storage/async-storage';
import { techniques as originalTechniques } from '../data/techniques.ts';

const STORAGE_KEY = 'techniques_data';

// Initialize with original data
let techniques = [...originalTechniques];

class Technique {
  constructor() {
    this.name = 'Technique';
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
        techniques = JSON.parse(storedData);
        console.log('Loaded techniques from storage:', techniques.length);
      } else {
        // First time - save original data to storage
        await this.saveToStorage();
        console.log('Initialized techniques storage with original data');
      }
    } catch (error) {
      console.error('Error loading techniques from storage:', error);
      // Fallback to original data
      techniques = [...originalTechniques];
    } finally {
      this._initialized = true;
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(techniques));
      console.log('Saved techniques to storage:', techniques.length);
    } catch (error) {
      console.error('Error saving techniques to storage:', error);
    }
  }

  async create(data) {
    await this.ensureInitialized();
    console.log('Creating Technique:', data.title);
    
    try {
      const newTechnique = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        created_by: data.created_by || 'user@example.com',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      
      // Add to techniques array
      techniques.push(newTechnique);
      
      // Save to persistent storage
      await this.saveToStorage();
      
      console.log('Successfully created technique:', newTechnique.id);
      return newTechnique;
    } catch (error) {
      console.error('Error creating technique:', error);
      throw error;
    }
  }

  async get(id) {
    await this.ensureInitialized();
    console.log('Getting Technique with id:', id);
    return techniques.find(technique => technique.id === id);
  }

  async filter(criteria) {
    await this.ensureInitialized();
    console.log('Filtering Techniques with criteria:', criteria);
    let filteredTechniques = [...techniques];
    
    if (criteria && criteria.created_by) {
      filteredTechniques = filteredTechniques.filter(technique => 
        technique.created_by === criteria.created_by
      );
    }
    
    if (criteria && criteria.shared_by_gym_id) {
      filteredTechniques = filteredTechniques.filter(technique => 
        technique.shared_by_gym_id === criteria.shared_by_gym_id
      );
    }
    
    if (criteria && criteria.category) {
      filteredTechniques = filteredTechniques.filter(technique => 
        technique.category === criteria.category
      );
    }
    
    return filteredTechniques;
  }

  async update(id, data) {
    await this.ensureInitialized();
    console.log('Updating Technique:', id, data);
    
    try {
      const index = techniques.findIndex(technique => technique.id === id);
      if (index !== -1) {
        techniques[index] = {
          ...techniques[index],
          ...data,
          updated_date: new Date().toISOString()
        };
        
        // Save to persistent storage
        await this.saveToStorage();
        
        return techniques[index];
      }
      throw new Error('Technique not found');
    } catch (error) {
      console.error('Error updating technique:', error);
      throw error;
    }
  }

  async delete(id) {
    await this.ensureInitialized();
    console.log('Deleting Technique:', id);
    
    try {
      const index = techniques.findIndex(technique => technique.id === id);
      if (index !== -1) {
        const deletedTechnique = techniques[index];
        techniques.splice(index, 1);
        
        // Save to persistent storage
        await this.saveToStorage();
        
        return true;
      }
      throw new Error('Technique not found');
    } catch (error) {
      console.error('Error deleting technique:', error);
      throw error;
    }
  }
}

export default new Technique(); 