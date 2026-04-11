import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider } from '../components/Localization';
import { RTLWrapper } from '../components/RTLWrapper';
import ShareHandler from '../components/ShareHandler';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only configure notifications if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    let isHandling = false;
    
    // Handle deep links when app is opened
    const handleDeepLink = async (url: string | null) => {
      if (isHandling) {
        console.log('Deep link already being handled, skipping:', url);
        return;
      }
      
      console.log('🔗 Deep link/Share received:', url);
      isHandling = true;
      
      if (url) {
        try {
          // The ShareHandler component will handle the actual navigation
          // This just logs the received URL for debugging
          console.log('✅ URL will be processed by ShareHandler component');
        } catch (error) {
          console.error('Error handling deep link:', error);
        } finally {
          // Reset the flag after a short delay to prevent rapid successive calls
          setTimeout(() => {
            isHandling = false;
          }, 1000);
        }
      } else {
        isHandling = false;
      }
    };

    // Get initial URL if app was opened via deep link or share intent
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📱 Initial URL on app launch:', url);
        handleDeepLink(url);
      }
    });

    // Listen for incoming links when app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('📱 URL received while app running:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AppProvider>
      <RTLWrapper>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen
              name="technique-form"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="pricing"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <ShareHandler />
        </ThemeProvider>
      </RTLWrapper>
    </AppProvider>
  );
}
