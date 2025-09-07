import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface MessageSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function MessageSuggestions({ suggestions, onSuggestionClick }: MessageSuggestionsProps) {
  const { isDarkMode } = useTheme();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSuggestionClick(suggestion)}
          style={{
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
            marginBottom: 6,
            backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
            borderColor: isDarkMode ? '#374151' : '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkMode ? 0.2 : 0.05,
            shadowRadius: 1,
            elevation: 1,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? '#d1d5db' : '#475569',
              fontWeight: '500',
            }}
          >
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
