import AsyncStorage from '@react-native-async-storage/async-storage';
import { BILLING_PLAN_IDS } from '@/constants/billing';
import { migrateLegacySubscriptionFields } from '@/services/billing/entitlements';
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
        users = JSON.parse(storedData).map(user => migrateLegacySubscriptionFields({
          ...user,
          subscription_plan: user.subscription_plan || BILLING_PLAN_IDS.free,
        }));
        console.log('Loaded users from storage:', users.length);
      } else {
        // First time - save original data to storage
        await this.saveToStorage();
        console.log('Initialized users storage with original data');
      }
    } catch (error) {
      console.error('Error loading users from storage:', error);
      // Fallback to original data
      users = [...originalUsers].map(user => migrateLegacySubscriptionFields({
        ...user,
        subscription_plan: user.subscription_plan || BILLING_PLAN_IDS.free,
      }));
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
    const newUser = migrateLegacySubscriptionFields({
      id: Math.random().toString(36).substr(2, 9),
      trial_start_date: data.trial_start_date || new Date().toISOString(),
      subscription_plan: data.subscription_plan || BILLING_PLAN_IDS.free,
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    });
    
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
      users[index] = migrateLegacySubscriptionFields({
        ...users[index],
        ...data,
        subscription_plan: data.subscription_plan || users[index].subscription_plan || BILLING_PLAN_IDS.free,
        updated_date: new Date().toISOString()
      });
      
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
    const preferredUser =
      users.find(user => user.email === 'luriadani@gmail.com') ||
      users.find(user => user.role === 'admin') ||
      users[0];

    if (!preferredUser) {
      return null;
    }

    return migrateLegacySubscriptionFields({
      ...preferredUser,
      subscription_plan: preferredUser.subscription_plan || BILLING_PLAN_IDS.free,
    });
  }

  async updateMyUserData(data) {
    console.log('Updating user data:', data);
    return { success: true };
  }

  // ── Auth helpers ──────────────────────────────────────────────

  /** Find a user by email (case-insensitive). Returns null if not found. */
  async findByEmail(email) {
    if (!email) return null;
    const lower = email.toLowerCase().trim();
    return users.find(u => u.email?.toLowerCase() === lower) || null;
  }

  /** Hash a password string with SHA-256 via expo-crypto. */
  async _hashPassword(password) {
    try {
      const Crypto = await import('expo-crypto');
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
    } catch {
      // Fallback: simple encoding (should not happen in Expo SDK 54)
      return btoa(encodeURIComponent(password));
    }
  }

  /**
   * Register a new account.
   * Throws 'EMAIL_TAKEN' if the email is already in use.
   * Returns the newly created user.
   */
  async createAccount({ email, password, name }) {
    const existing = await this.findByEmail(email);
    if (existing) throw new Error('EMAIL_TAKEN');

    const passwordHash = await this._hashPassword(password);

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return this.create({
      email: email.toLowerCase().trim(),
      full_name: name.trim(),
      password_hash: passwordHash,
      role: 'user',
      belt: 'white',
      language: 'en',
      time_format: '24h',
      subscription_plan: BILLING_PLAN_IDS.free,
      subscription_status: 'trial',
      trial_start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      notifications_enabled: 'true',
      notification_minutes_before: '30',
      custom_technique_categories: 'Try Next Class,Show Coach,Favorite',
      custom_training_categories: '',
      custom_belts: 'white,blue,purple,brown,black',
      dashboard_visible_categories: 'Try Next Class',
      show_only_next_training_techniques: 'false',
      gym_id: null,
      coupon_code: null,
    });
  }

  /**
   * Verify credentials and return the user, or null if invalid.
   */
  async login(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    // Demo/legacy users (imported from data/users.ts) have no password_hash.
    // They cannot log in via the auth flow — only new accounts created via
    // createAccount() can sign in with a password.
    if (!user.password_hash) return null;

    const hash = await this._hashPassword(password);
    if (hash !== user.password_hash) return null;

    return migrateLegacySubscriptionFields({
      ...user,
      subscription_plan: user.subscription_plan || BILLING_PLAN_IDS.free,
    });
  }
}

export default new User(); 