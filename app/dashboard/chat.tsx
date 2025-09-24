import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../hooks/useChat';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import EmptyState from '../../components/chat/EmptyState';
import Messages from '../../components/chat/Messages';

export default function ChatPage() {
  const { isDarkMode } = useTheme();

  const { messages, inputText, isTyping, setInputText, handleSendMessage, handleSuggestionClick, dismissKeyboard } =
    useChat();

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/*<TouchableWithoutFeedback onPress={Keyboard.dismiss}>*/}
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F0FDF4' }}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <Messages messages={messages} onSuggestionClick={handleSuggestionClick} />
          )}
        </View>
        {/*</TouchableWithoutFeedback>*/}

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          dismissKeyboard={dismissKeyboard}
        />
      </KeyboardAvoidingView>
    </>
  );
}
