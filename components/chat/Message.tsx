import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Message as MessageType } from '../../types/chat';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/context/ThemeContext';
import { shadow } from '@/utils/commonStyles';
import MessageSuggestions from './MessageSuggestions';

interface MessageProps {
  message: MessageType;
  showAvatar?: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const LoadingMessage = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <ActivityIndicator size="small" color={isDarkMode ? '#34d399' : '#114131'} />
    <Text style={{ marginLeft: 8, fontSize: 14, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>Evra is thinking...</Text>
  </View>
);

export default function Message({ message, showAvatar = true, onSuggestionClick }: MessageProps) {
  const isUser = message.sender === 'user';
  const { isLoading, text, suggestions } = message;
  const { isDarkMode } = useTheme();

  return (
    <View
      style={{
        marginBottom: 16,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
        }}
      >
        <View
          style={[
            {
              paddingHorizontal: 16,
              paddingVertical: 4,
              backgroundColor: isUser ? (isDarkMode ? '#064e3b' : '#059669') : isDarkMode ? '#1f2937' : '#ffffff',
              borderRadius: 18,
              borderWidth: 0,
              ...shadow.card,
            },
            isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 },
          ]}
        >
          {!isUser && isLoading ? (
            <LoadingMessage isDarkMode={isDarkMode} />
          ) : (
            <Markdown
              style={{
                body: { color: isUser ? '#ffffff' : isDarkMode ? '#e5e7eb' : '#111827' },
              }}
            >
              {text}
            </Markdown>
          )}
        </View>
      </View>
      {!isUser && suggestions && suggestions.length > 0 && !isLoading && (
        <MessageSuggestions suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
      )}
    </View>
  );
}
