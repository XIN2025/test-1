import React, { useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { Message } from '../../types/chat';
import MessageComponent from './Message';

interface MessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function Messages({ messages, onSuggestionClick }: MessagesProps) {
  const flatListRef = useRef<FlatList<Message>>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

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
      onContentSizeChange={(height) => {
        if (height > contentHeight) {
          setContentHeight(height);
          setTimeout(() => {
            scrollToBottom();
          }, 50);
        }
      }}
      onLayout={() => scrollToBottom()}
    />
  );
}
