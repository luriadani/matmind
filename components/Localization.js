import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { BILLING_PLAN_IDS } from '@/constants/billing';
import { migrateLegacySubscriptionFields } from '@/services/billing/entitlements';
import { translations } from './Translations';

const SESSION_KEY = 'session_user_email';

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext.Provider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    timeFormat: '12h',
    dashboardCategories: ['techniques', 'trainings'],
    customCategories: {
      techniques: [],
      trainings: [],
      belts: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [languageKey, setLanguageKey] = useState(0);

  /** Load a user by email into context and mark as authenticated. */
  const loadSessionUser = async (email) => {
    try {
      const User = (await import('../entities/User')).default;
      const foundUser = await User.findByEmail(email);
      if (!foundUser) {
        // Session points to a non-existent user — clear it
        await AsyncStorage.removeItem(SESSION_KEY);
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const migratedUser = migrateLegacySubscriptionFields({
        ...foundUser,
        subscription_plan: foundUser.subscription_plan || BILLING_PLAN_IDS.free,
      });

      setUser(migratedUser);
      setIsAuthenticated(true);

      setSettings({
        language: migratedUser.language || 'en',
        timeFormat: migratedUser.time_format || '24h',
        dashboardCategories: ['techniques', 'trainings'],
        customCategories: {
          techniques: migratedUser.custom_technique_categories
            ? migratedUser.custom_technique_categories.split(',').map(c => c.trim())
            : [],
          trainings: migratedUser.custom_training_categories
            ? migratedUser.custom_training_categories.split(',').map(c => c.trim())
            : [],
          belts: migratedUser.custom_belts
            ? migratedUser.custom_belts.split(',').map(c => c.trim())
            : [],
        }
      });
    } catch (error) {
      console.error('Failed to load session user:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const sessionEmail = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionEmail) {
          await loadSessionUser(sessionEmail);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      if (user) {
        const User = (await import('../entities/User')).default;
        await User.update(user.id, newSettings);

        setUser(prev => ({ ...prev, ...newSettings }));

        if (newSettings.language && newSettings.language !== settings.language) {
          setSettings(prev => ({
            ...prev,
            ...newSettings,
            language: newSettings.language,
            _timestamp: Date.now()
          }));
          setLanguageKey(prev => prev + 1);
        } else {
          setSettings(prev => ({ ...prev, ...newSettings }));
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  /** Clear session and reset state. Call router.replace('/login') after this. */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
    setUser(null);
    setIsAuthenticated(false);
    setSettings({
      language: 'en',
      timeFormat: '12h',
      dashboardCategories: ['techniques', 'trainings'],
      customCategories: { techniques: [], trainings: [], belts: [] }
    });
  };

  // Translation function with RTL support
  const t = (key, params = {}) => {
    const currentLanguage = settings.language || 'en';
    const languageTranslations = translations[currentLanguage] || translations.en;

    let translation = languageTranslations[key] || key;

    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });

    return translation;
  };

  const getTextDirection = () => {
    const currentLanguage = settings.language || 'en';
    return currentLanguage === 'he' ? 'rtl' : 'ltr';
  };

  const getLayoutDirection = () => {
    const currentLanguage = settings.language || 'en';
    return currentLanguage === 'he' ? 'row-reverse' : 'row';
  };

  const contextValue = {
    user,
    settings,
    isLoading,
    isAuthenticated,
    updateSettings,
    updateUser,
    loadSessionUser,
    logout,
    t,
    getTextDirection,
    getLayoutDirection,
    language: settings.language || 'en',
    languageKey,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
