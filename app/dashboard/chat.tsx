import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../hooks/useChat';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import EmptyState from '../../components/chat/EmptyState';
import Messages from '../../components/chat/Messages';

const TAB_BAR_HEIGHT = 16;

export default function ChatPage() {
  const { isDarkMode } = useTheme();

  const { messages, inputText, isTyping, setInputText, handleSendMessage, handleSuggestionClick, dismissKeyboard } =
    useChat();

  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOffset(0));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOffset(TAB_BAR_HEIGHT));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
        style={{ flex: 1 }}
      >
        <ChatHeader />
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
    </SafeAreaView>
  );
}
