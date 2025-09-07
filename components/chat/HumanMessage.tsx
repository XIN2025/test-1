import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import CustomMarkdown from './CustomMarkdown';

interface HumanMessageProps {
  text: string;
  showAvatar?: boolean;
}

export default function HumanMessage({ text, showAvatar = true }: HumanMessageProps) {
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        maxWidth: '75%',
      }}
    >
      <View
        style={{
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 4,
          backgroundColor: isDarkMode ? '#064e3b' : '#059669',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 2,
          elevation: 2,
          borderBottomRightRadius: 4, // Tail effect for user messages
        }}
      >
        <CustomMarkdown
          style={{
            body: { color: '#ffffff' },
          }}
        >
          {text}
        </CustomMarkdown>
      </View>
    </View>
  );
}
