import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import MainScreen from '../screens/MainScreen';
import ChatScreen from '../screens/ChatScreen';
import CommandCenterScreen from '../screens/CommandCenterScreen';
import FreelancerScreen from '../screens/FreelancerScreen';
import TaxIntelligenceScreen from '../screens/TaxIntelligenceScreen';
import SpendAwarenessScreen from '../screens/SpendAwarenessScreen';
import CreditIntelligenceScreen from '../screens/CreditIntelligenceScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation theme
const NavigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.bg_base,
    card: COLORS.bg_surface,
    text: COLORS.text_primary,
    border: COLORS.border_subtle,
    notification: COLORS.orange,
  },
};

// Get screen dimensions for responsive UI
const { width, height } = Dimensions.get('window');
export const SCREEN = {
  width,
  height,
  isSmall: width < 380,
  isMedium: width >= 380 && width < 420,
  isLarge: width >= 420,
  isLandscape: width > height,
};

// Tab icon component
function TabIcon({ name, focused, size = 24 }: { name: string; focused: boolean; size?: number }) {
  const icons: Record<string, string> = {
    dashboard: '📊',
    chat: '💬',
    expenses: '💰',
    portfolio: '📈',
    more: '⚙️',
  };
  
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={{ fontSize: size }}>{icons[name] || '📱'}</Text>
    </View>
  );
}

// Main tabs navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text_tertiary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={MainScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={MainScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="expenses" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={MainScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="portfolio" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export default function AppNavigator() {
  return (
    <NavigationContainer theme={NavigationTheme}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg_base} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.bg_base },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="CommandCenter" component={CommandCenterScreen} />
        <Stack.Screen name="Freelancer" component={FreelancerScreen} />
        <Stack.Screen name="TaxIntelligence" component={TaxIntelligenceScreen} />
        <Stack.Screen name="SpendAwareness" component={SpendAwarenessScreen} />
        <Stack.Screen name="CreditIntelligence" component={CreditIntelligenceScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg_surface,
    borderTopColor: COLORS.border_subtle,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tabIconFocused: {
    backgroundColor: COLORS.primary_muted,
  },
});
