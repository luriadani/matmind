import { Redirect, Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, View } from 'react-native';
import { useAppContext } from '../../components/Localization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Brand, Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/useColorScheme';

/** Animated tab icon — bounces on activation */
function TabIcon({
  name,
  color,
  focused,
  size = 24,
}: {
  name: string;
  color: string;
  focused: boolean;
  size?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!focused) return;
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.22,
        useNativeDriver: true,
        speed: 60,
        bounciness: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <IconSymbol size={size} name={name as any} color={color} />
    </Animated.View>
  );
}

/** FAB-style center Add button */
function AddTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const scheme = useColorScheme() ?? 'dark';
  return (
    <View
      style={[
        styles.addButton,
        {
          backgroundColor: focused ? Brand.primary : Brand.primaryMuted,
          borderColor: focused ? Brand.primary : Brand.primaryDark,
        },
      ]}
    >
      <IconSymbol size={22} name="plus" color="#FFFFFF" />
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { t, isLoading, isAuthenticated, user } = useAppContext();
  const isAdmin = user?.role === 'admin';

  // While session is being checked, show a spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  // No active session → go to login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: scheme === 'dark' ? palette.surfaceElevated : palette.surface,
            borderTopColor: palette.border,
            height: 56 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          Platform.OS === 'ios' && styles.tabBarIOS,
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.library'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house.fill" color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.schedule'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => <AddTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gear" color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('tabs.admin'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.2.fill" color={color} focused={focused} size={24} />
          ),
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarIOS: {
    position: 'absolute',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: -2,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginTop: -10,
  },
});
