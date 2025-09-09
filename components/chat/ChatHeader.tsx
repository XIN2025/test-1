import React from 'react';
import { Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ChatHeader() {
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
            }}
          >
            <MessageCircle size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                marginBottom: 2,
              }}
            >
              Chat with Evra
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              }}
            >
              Your AI Health Agent
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
