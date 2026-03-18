import AsyncStorage from '@react-native-async-storage/async-storage';
import { users as originalUsers } from '../data/users.ts';

const STORAGE_KEY = 'users_data';

// Initialize with original data
let users = [...originalUsers];

class User {
  constructor() {
    this.name = 'User';
    this.loadFromStorage();
  }

  async loadFromStorage() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        users = JSON.parse(storedData);
        console.log('Loaded users from storage:', users.length);
      } else {
        // First time - save original data to storage
        await this.saveToStorage();
        console.log('Initialized users storage with original data');
      }
    } catch (error) {
      console.error('Error loading users from storage:', error);
      // Fallback to original data
      users = [...originalUsers];
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      console.log('Saved users to storage:', users.length);
    } catch (error) {
      console.error('Error saving users to storage:', error);
    }
  }

  async create(data) {
    console.log('Creating User:', data);
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save to persistent storage
    await this.saveToStorage();
    
    return newUser;
  }

  async get(id) {
    console.log('Getting User with id:', id);
    return users.find(user => user.id === id);
  }

  async filter(criteria) {
    console.log('Filtering Users with criteria:', criteria);
    let filteredUsers = [...users];
    
    if (criteria && criteria.email) {
      filteredUsers = filteredUsers.filter(user => 
        user.email === criteria.email
      );
    }
    
    return filteredUsers;
  }

  async update(id, data) {
    console.log('Updating User:', id, data);
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...data,
        updated_date: new Date().toISOString()
      };
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return users[index];
    }
    throw new Error('User not found');
  }

  async delete(id) {
    console.log('Deleting User:', id);
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      const deletedUser = users[index];
      users.splice(index, 1);
      
      // Save to persistent storage
      await this.saveToStorage();
      
      return true;
    }
    throw new Error('User not found');
  }

  async me() {
    console.log('Getting current user');
    return {
      id: '68602ea219f95d6a816e14a4',
      email: 'luriadani@gmail.com',
      name: 'Luri Adani',
      subscription_level: 'premium',
      created_date: '2024-01-01T00:00:00Z',
      updated_date: '2024-01-01T00:00:00Z'
    };
  }

  async updateMyUserData(data) {
    console.log('Updating user data:', data);
    return { success: true };
  }
}

export default new User(); 