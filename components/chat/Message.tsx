import React from 'react';
import { View } from 'react-native';
import { Message as MessageType } from '../../types/chat';
import AIMessage from './AIMessage';
import HumanMessage from './HumanMessage';
import MessageSuggestions from './MessageSuggestions';

interface MessageProps {
  message: MessageType;
  showAvatar?: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export default function Message({ message, showAvatar = true, onSuggestionClick }: MessageProps) {
  const isUser = message.sender === 'user';

  return (
    <View
      style={{
        marginBottom: 16,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {isUser ? (
        <HumanMessage text={message.text} showAvatar={showAvatar} />
      ) : (
        <>
          <AIMessage text={message.text} isLoading={message.isLoading} showAvatar={showAvatar} />
          {message.suggestions && message.suggestions.length > 0 && !message.isLoading && (
            <MessageSuggestions suggestions={message.suggestions} onSuggestionClick={onSuggestionClick} />
          )}
        </>
      )}
    </View>
  );
}
