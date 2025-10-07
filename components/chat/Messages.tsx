import React, { useRef } from 'react';
import { FlatList } from 'react-native';
import { Message } from '../../types/chat';
import MessageComponent from './Message';

interface MessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function Messages({ messages, onSuggestionClick }: MessagesProps) {
  const flatListRef = useRef<FlatList<Message>>(null);
  const isAtBottomRef = useRef(true);
  const handleScroll = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const threshold = 24;
    isAtBottomRef.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;
  };
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
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 120,
      }}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        if (isAtBottomRef.current) {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />
  );
}
