import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import ChatInput from '../../components/chat/ChatInput';
import EmptyState from '../../components/chat/EmptyState';
import Messages from '../../components/chat/Messages';
import { MessageCircle } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import { useChat } from '@/hooks/useChat';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function ChatPage() {
  const { isDarkMode } = useTheme();

  const { messages, inputText, setInputText, handleSendMessage } = useChat();

  return (
<<<<<<< Updated upstream
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
=======
    <SafeAreaView
      edges={Platform.OS === 'ios' ? ['top'] : ['top']}
      style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}
    >
>>>>>>> Stashed changes
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Header title="Chat with Evra" subtitle="Your AI Health Agent" leftIcon={{ icon: MessageCircle }} />
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#F0FDF4' }}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <Messages messages={messages} onSuggestionClick={handleSendMessage} />
          )}
        </View>
        <ChatInput inputText={inputText} setInputText={setInputText} onSendMessage={handleSendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
