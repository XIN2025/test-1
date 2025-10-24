import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { commonStylesDark, commonStylesLight } from '@/utils/commonStyles';

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
    <View style={{ marginTop: 12, gap: 8 }}>
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSuggestionClick(suggestion)}
          style={[
            (isDarkMode ? commonStylesDark : commonStylesLight).pressableCard,
            {
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              borderRadius: 12,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? '#d1d5db' : '#475569',
            }}
          >
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
