import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BILLING_PLAN_IDS } from '@/constants/billing';
import { migrateLegacySubscriptionFields } from '@/services/billing/entitlements';
import { translations } from './Translations';

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppContext.Provider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [languageKey, setLanguageKey] = useState(0);
  const [settings, setSettings] = useState({
    language: 'en',
    timeFormat: '24h',
    dashboardCategories: ['techniques', 'trainings'],
    customCategories: { techniques: [], trainings: [], belts: [] },
  });

  const applyProfile = (authUser, profile) => {
    if (!authUser) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    const p = profile || {};
    const merged = migrateLegacySubscriptionFields({
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

    setUser(merged);
    setIsAuthenticated(true);

    const splitStr = (val) => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSettings({
      language: merged.language || 'en',
      timeFormat: merged.time_format || '24h',
      dashboardCategories: ['techniques', 'trainings'],
      customCategories: {
        techniques: splitStr(merged.custom_technique_categories),
        trainings: splitStr(merged.custom_training_categories),
        belts: splitStr(merged.custom_belts),
      },
      ...merged, // spread all fields so settings has everything
    });
  };

  const loadProfile = async (authUser) => {
    if (!authUser) { applyProfile(null, null); return; }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    applyProfile(authUser, profile);
  };

  // Exposed so login/register screens can call after auth
  const loadSessionUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    await loadProfile(authUser);
  };

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null).finally(() => setIsLoading(false));
    });

    // 2. Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateSettings = async (newSettings) => {
    if (!user) return;
    const profileData = {
      belt: newSettings.belt,
      language: newSettings.language,
      time_format: newSettings.time_format,
      custom_technique_categories: newSettings.custom_technique_categories,
      custom_training_categories: newSettings.custom_training_categories,
      custom_belts: newSettings.custom_belts,
      dashboard_visible_categories: newSettings.dashboard_visible_categories,
      show_only_next_training_techniques:
        newSettings.show_only_next_training_techniques === true ||
        newSettings.show_only_next_training_techniques === 'true',
      notifications_enabled:
        newSettings.notifications_enabled === true ||
        newSettings.notifications_enabled === 'true',
      notification_minutes_before: parseInt(newSettings.notification_minutes_before) || 30,
      updated_at: new Date().toISOString(),
    };
    Object.keys(profileData).forEach(k => profileData[k] === undefined && delete profileData[k]);

    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (error) throw error;

    setUser(prev => ({ ...prev, ...newSettings }));

    if (newSettings.language && newSettings.language !== settings.language) {
      setSettings(prev => ({ ...prev, ...newSettings, language: newSettings.language }));
      setLanguageKey(prev => prev + 1);
    } else {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const updateUser = (newUserData) => setUser(prev => ({ ...prev, ...newUserData }));

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const t = (key, params = {}) => {
    const lang = settings.language || 'en';
    const dict = translations[lang] || translations.en;
    let str = dict[key] || key;
    Object.keys(params).forEach(p => { str = str.replace(`{${p}}`, params[p]); });
    return str;
  };

  const getTextDirection = () => (settings.language === 'he' ? 'rtl' : 'ltr');
  const getLayoutDirection = () => (settings.language === 'he' ? 'row-reverse' : 'row');

  return (
    <AppContext.Provider value={{
      user, settings, isLoading, isAuthenticated,
      updateSettings, updateUser, loadSessionUser, logout,
      t, getTextDirection, getLayoutDirection,
      language: settings.language || 'en',
      languageKey,
    }}>
      {children}
    </AppContext.Provider>
  );
};
