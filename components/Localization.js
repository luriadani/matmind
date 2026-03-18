import { createContext, useContext, useEffect, useState } from 'react';
import { BILLING_PLAN_IDS } from '@/constants/billing';
import { migrateLegacySubscriptionFields } from '@/services/billing/entitlements';
import { translations } from './Translations';

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
  const [languageKey, setLanguageKey] = useState(0); // Force re-render on language change

  useEffect(() => {
    // Load real user data
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const User = (await import('../entities/User')).default;
        const allUsers = await User.filter({});
        const preferredUser =
          allUsers.find(u => u.email === 'luriadani@gmail.com') ||
          allUsers.find(u => u.role === 'admin') ||
          allUsers[0];

        if (!preferredUser) {
          throw new Error('No user data available');
        }

        const migratedUser = migrateLegacySubscriptionFields({
          ...preferredUser,
          subscription_plan: preferredUser.subscription_plan || BILLING_PLAN_IDS.free,
        });

        setUser(migratedUser);
        
        // Sync settings with user data
        setSettings({
          language: migratedUser.language,
          timeFormat: migratedUser.time_format,
          dashboardCategories: ['techniques', 'trainings'],
          customCategories: {
            techniques: migratedUser.custom_technique_categories ? migratedUser.custom_technique_categories.split(',').map(c => c.trim()) : [],
            trainings: migratedUser.custom_training_categories ? migratedUser.custom_training_categories.split(',').map(c => c.trim()) : [],
            belts: migratedUser.custom_belts ? migratedUser.custom_belts.split(',').map(c => c.trim()) : []
          }
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      // Update the user data in the database
      if (user) {
        const User = (await import('../entities/User')).default;
        await User.update(user.id, newSettings);
        
        // Update local user state
        setUser(prev => ({ ...prev, ...newSettings }));
        
        // If language changed, handle it specially
        if (newSettings.language && newSettings.language !== settings.language) {
          console.log('Language changed from', settings.language, 'to', newSettings.language);
          // Update settings with new language immediately
          setSettings(prev => ({ 
            ...prev, 
            ...newSettings,
            language: newSettings.language,
            _timestamp: Date.now() // Force re-render
          }));
          // Force re-render of all components using translations
          setLanguageKey(prev => prev + 1);
        } else {
          // Update local settings state normally
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

  // Translation function with RTL support
  const t = (key, params = {}) => {
    const currentLanguage = settings.language || 'en';
    const languageTranslations = translations[currentLanguage] || translations.en;
    
    let translation = languageTranslations[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });

    return translation;
  };

  // Get text direction based on language
  const getTextDirection = () => {
    const currentLanguage = settings.language || 'en';
    return currentLanguage === 'he' ? 'rtl' : 'ltr';
  };

  // Get layout direction for flexbox
  const getLayoutDirection = () => {
    const currentLanguage = settings.language || 'en';
    return currentLanguage === 'he' ? 'row-reverse' : 'row';
  };

  const contextValue = {
    user,
    settings,
    isLoading,
    updateSettings,
    updateUser,
    t,
    getTextDirection,
    getLayoutDirection,
    language: settings.language || 'en',
    languageKey // Force re-render when language changes
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}; 