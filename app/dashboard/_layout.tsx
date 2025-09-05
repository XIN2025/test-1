import { Tabs } from 'expo-router';
import { Globe, Heart, MessageCircle, ShoppingBag, Target, User, Users } from 'lucide-react-native';
import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

function TabsNavigator() {
  const { isDarkMode } = useTheme();
  const { isFirstTimeUser } = useAuth();

  const initialRoute = isFirstTimeUser ? 'main' : 'chat';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDarkMode ? '#374151' : '#e5e7eb',
        },
        tabBarActiveTintColor: isDarkMode ? '#34d399' : '#059669',
        tabBarInactiveTintColor: isDarkMode ? '#9ca3af' : '#64748b',
      }}
      initialRouteName={initialRoute}
    >
      <Tabs.Screen
        name="main"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="supplements"
        options={{
          title: 'Hub',
          tabBarLabel: 'Hub',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => <Globe color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          href: null, // This hides it from the tab bar
          title: 'Health',
        }}
      />
    </Tabs>
  );
}

export default function DashboardTabsLayout() {
  return (
    <ThemeProvider>
      <ProtectedRoute>
        <TabsNavigator />
      </ProtectedRoute>
    </ThemeProvider>
  );
}
