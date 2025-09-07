import { Tabs } from 'expo-router';
import { Globe, Heart, MessageCircle, ShoppingBag, Target, User, Users } from 'lucide-react-native';
import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
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
          // height: 70,
          // paddingBottom: 20,
          // paddingTop: 10,
          // marginBottom: 20,
          // paddingHorizontal: 16,
          // borderTopWidth: 1,
          // elevation: 0,
          // shadowOpacity: 0,
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
          href: null,
          title: 'Health',
        }}
      />
      <Tabs.Screen
        name="lab-tests"
        options={{
          href: null,
          title: 'Lab Tests',
        }}
      />
    </Tabs>
  );
}

export default function DashboardTabsLayout() {
  return (
    <ProtectedRoute>
      <TabsNavigator />
    </ProtectedRoute>
  );
}
