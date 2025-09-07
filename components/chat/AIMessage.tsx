import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import CustomMarkdown from './CustomMarkdown';

interface AIMessageProps {
  text: string;
  isLoading?: boolean;
  showAvatar?: boolean;
}

export default function AIMessage({ text, isLoading = false, showAvatar = true }: AIMessageProps) {
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        maxWidth: '85%',
      }}
    >
      <View
        style={{
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderWidth: 1,
          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 2,
          elevation: 2,
          borderBottomLeftRadius: 4, // Tail effect for AI messages
        }}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={isDarkMode ? '#34d399' : '#114131'} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                color: isDarkMode ? '#d1d5db' : '#6b7280',
              }}
            >
              Evra is thinking...
            </Text>
          </View>
        ) : (
          <CustomMarkdown
            style={{
              body: { color: isDarkMode ? '#e5e7eb' : '#111827' },
            }}
          >
            {text}
          </CustomMarkdown>
        )}
      </View>
    </View>
  );
}
