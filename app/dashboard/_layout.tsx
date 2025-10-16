import { Tabs } from 'expo-router';
import { Globe, Heart, MessageCircle, ShoppingBag, Target } from 'lucide-react-native';
import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Platform } from 'react-native';

function TabsNavigator() {
  const { isDarkMode } = useTheme();
  const { isFirstTimeUser } = useAuth();

  const initialRoute = isFirstTimeUser ? 'main' : 'chat';

  return (
    <Tabs
      screenOptions={{
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
        tabBarHideOnKeyboard: true,
      }}
      initialRouteName={initialRoute}
    >
      <Tabs.Screen
        name="main"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size ?? 22} />,
          // header: () => <ChatHeader />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarLabel: 'Goals',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Target color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Globe color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          headerShown: false,
          href: null,
          title: 'Health',
        }}
      />
      <Tabs.Screen
        name="lab-tests"
        options={{
          headerShown: false,
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
      {/* <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? '#111827' : '#FFF',
        }}
        edges={['top', 'bottom']}
      > */}
      <TabsNavigator />
      {/* </SafeAreaView> */}
    </ProtectedRoute>
  );
}
