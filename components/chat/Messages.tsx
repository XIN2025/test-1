import React, { useRef } from 'react';
import { FlatList } from 'react-native';
import { Message } from '../../types/chat';
import MessageComponent from './Message';

interface MessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function Messages({ messages, onSuggestionClick }: MessagesProps) {
  const flatListRef = useRef<FlatList>(null);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={({ item, index }) => (
        <MessageComponent
          key={item.id}
          message={item}
          showAvatar={index === 0 || messages[index - 1].sender !== item.sender}
          onSuggestionClick={onSuggestionClick}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 120,
      }}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }}
    />
  );
}
