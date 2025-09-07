import React, { useEffect, useRef } from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { Message } from '../../types/chat';
import MessageComponent from './Message';

interface MessagesProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function Messages({ messages, onSuggestionClick }: MessagesProps) {
  const flatListRef = useRef<FlatList<Message>>(null);
  const shouldShowAvatar = (currentIndex: number) => {
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];

    // Show avatar if it's the first message or if the previous message is from a different sender
    return !previousMessage || previousMessage.sender !== currentMessage.sender;
  };

  const renderMessage: ListRenderItem<Message> = ({ item, index }) => (
    <MessageComponent message={item} showAvatar={shouldShowAvatar(index)} onSuggestionClick={onSuggestionClick} />
  );

  const keyExtractor = (item: Message) => item.id;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 120,
      }}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      getItemLayout={(data, index) => ({
        length: 80, // Approximate item height
        offset: 80 * index,
        index,
      })}
    />
  );
}
