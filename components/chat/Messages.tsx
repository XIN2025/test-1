import React, { useRef } from 'react';
import { FlatList, Text } from 'react-native';
import { Message } from '../../types/chat';
import MessageComponent from './Message';
import { useTheme } from '@/context/ThemeContext';
import { commonStylesDark, commonStylesLight } from '@/utils/commonStyles';

interface MessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function Messages({ messages, onSuggestionClick }: MessagesProps) {
  const flatListRef = useRef<FlatList<Message>>(null);
  const { isDarkMode } = useTheme();

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={({ item, index }) => (
        <MessageComponent
          message={item}
          showAvatar={index === 0 || messages[index - 1].sender !== item.sender}
          onSuggestionClick={onSuggestionClick}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={() => (
        <Text
          style={[
            (isDarkMode ? commonStylesDark : commonStylesLight).displayCard,
            {
              fontSize: 12,
              textAlign: 'center',
              borderWidth: 0,
              paddingVertical: 12,
              marginHorizontal: 8,
              marginBottom: 16,
              color: isDarkMode ? '#9CA3AF' : '#6B7280',
            },
          ]}
        >
          Messages from Evra are AI-generated and for informational purposes only. For medical advice, please confirm
          this information with your healthcare provider.
        </Text>
      )}
    />
  );
}
