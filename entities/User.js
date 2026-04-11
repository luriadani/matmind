// User entity — backed by Supabase Auth + profiles table
import { supabase } from '../lib/supabase';
import { BILLING_PLAN_IDS } from '@/constants/billing';
import { migrateLegacySubscriptionFields } from '@/services/billing/entitlements';

/** Merge a Supabase auth user + profiles row into the shape the app expects */
const mergeProfile = (authUser, profile) => {
  if (!authUser) return null;
  const p = profile || {};
  return migrateLegacySubscriptionFields({
    id: authUser.id,
    email: authUser.email,
    full_name: p.full_name || authUser.user_metadata?.full_name || '',
    belt: p.belt || 'white',
    language: p.language || 'en',
    time_format: p.time_format || '24h',
    role: p.role || 'user',
    subscription_plan: p.subscription_plan || BILLING_PLAN_IDS.free,
    subscription_status: p.subscription_status || 'trial',
    trial_start_date: p.trial_start_date || new Date().toISOString(),
    trial_end_date: p.trial_end_date || new Date(Date.now() + 14 * 86400000).toISOString(),
    custom_technique_categories: p.custom_technique_categories || 'Try Next Class,Show Coach,Favorite',
    custom_training_categories: p.custom_training_categories || '',
    custom_belts: p.custom_belts || 'white,blue,purple,brown,black',
    dashboard_visible_categories: p.dashboard_visible_categories || 'Try Next Class',
    show_only_next_training_techniques: p.show_only_next_training_techniques || false,
    notifications_enabled: p.notifications_enabled !== undefined ? p.notifications_enabled : true,
    notification_minutes_before: p.notification_minutes_before || 30,
    gym_id: p.gym_id || null,
  });
};

class User {
  /** Return the current user merged with their profile, or null */
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return mergeProfile(user, profile);
  }

  /** Find user by email — loads profile too. Used by admin panel. */
  async findByEmail(email) {
    // Can only look up own profile via auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email?.toLowerCase() !== email?.toLowerCase()) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return mergeProfile(user, profile);
  }

  /** Get all users (admin only) */
  async filter() {
    // Regular app flow: just return current user
    return [await this.me()].filter(Boolean);
  }

  /** Update profile fields for the current user */
  async update(id, data) {
    const profileData = {
      full_name: data.full_name,
      belt: data.belt,
      language: data.language,
      time_format: data.time_format,
      role: data.role,
      subscription_plan: data.subscription_plan,
      subscription_status: data.subscription_status,
      trial_start_date: data.trial_start_date,
      trial_end_date: data.trial_end_date,
      custom_technique_categories: data.custom_technique_categories,
      custom_training_categories: data.custom_training_categories,
      custom_belts: data.custom_belts,
      dashboard_visible_categories: data.dashboard_visible_categories,
      show_only_next_training_techniques: data.show_only_next_training_techniques === 'true'
        || data.show_only_next_training_techniques === true,
      notifications_enabled: data.notifications_enabled === 'true'
        || data.notifications_enabled === true,
      notification_minutes_before: parseInt(data.notification_minutes_before) || 30,
      gym_id: data.gym_id,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined keys
    Object.keys(profileData).forEach(k => profileData[k] === undefined && delete profileData[k]);

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    return mergeProfile(user, updated);
  }

  /** Register a new account via Supabase Auth */
  async createAccount({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new Error('EMAIL_TAKEN');
      }
      throw error;
    }

    return data.user;
  }

  /** Sign in via Supabase Auth */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) return null;
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return mergeProfile(data.user, profile);
  }

  /** Sign out */
  async logout() {
    await supabase.auth.signOut();
  }

  // Legacy compatibility
  async get(id) { return this.me(); }
  async create(data) { return data; }
  async delete(id) { return true; }
  async updateMyUserData(data) { return { success: true }; }
}

export default new User();
