import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function EmptyState() {
  const { isDarkMode } = useTheme();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          backgroundColor: isDarkMode ? '#1f6f51' : '#114131',
        }}
      >
        <MessageCircle size={40} color="#fff" />
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '600',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        How can I help you?
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          lineHeight: 24,
          maxWidth: 300,
        }}
      >
        I&apos;m your AI health assistant. Ask me about nutrition, exercise, medications, or any health-related
        questions.
      </Text>
    </ScrollView>
  );
}
