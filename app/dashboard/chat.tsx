import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Keyboard, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../hooks/useChat';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import EmptyState from '../../components/chat/EmptyState';
// import { KeyboardAvoiderView } from '@good-react-native/keyboard-avoider';
import Messages from '../../components/chat/Messages';

export default function ChatPage() {
  const { isDarkMode } = useTheme();

  const { messages, inputText, isTyping, setInputText, handleSendMessage, handleSuggestionClick, dismissKeyboard } =
    useChat();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={0}
      >
        <ChatHeader />
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F0FDF4' }}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <Messages messages={messages} onSuggestionClick={handleSuggestionClick} />
          )}
        </View>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          dismissKeyboard={dismissKeyboard}
        />
        <Text
          style={{
            fontSize: 12,
            textAlign: 'center',
            marginHorizontal: 16,
            marginBottom: 6,
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
          }}
        >
          Messages from Evra are AI-generated and for informational purposes only. For medical advice, please confirm
          this information with your healthcare provider.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
