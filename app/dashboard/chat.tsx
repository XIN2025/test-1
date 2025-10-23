import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import ChatInput from '../../components/chat/ChatInput';
import EmptyState from '../../components/chat/EmptyState';
import Messages from '../../components/chat/Messages';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types/chat';
import { API_BASE_URL } from '../../utils/api';
import { MessageCircle } from 'lucide-react-native';
import Header from '@/components/ui/Header';

const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function ChatPage() {
  const { isDarkMode } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const { user } = useAuth();
  const userEmail = user?.email || '';

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      text: text.trim(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Add loading message
    const loadingMessage: Message = {
      id: generateUniqueId(),
      text: '',
      sender: 'bot',
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const formData = new FormData();
      formData.append('message', text.trim());
      formData.append('user_email', userEmail);

      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Remove loading message and add response
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));

        const botMessage: Message = {
          id: generateUniqueId(),
          text: data.response,
          sender: 'bot',
          suggestions: data.follow_up_questions || [],
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));

      const errorMessage: Message = {
        id: generateUniqueId(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        sender: 'bot',
        suggestions: ['Try again', 'Ask something else'],
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }}>
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
