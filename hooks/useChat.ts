import Constants from 'expo-constants';
import { useState } from 'react';
import { Keyboard } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Message, ChatHookReturn } from '../types/chat';

export const useChat = (): ChatHookReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // API Configuration
  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';

  // Get user's email from context
  const { user } = useAuth();
  const userEmail = user?.email || '';

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateUniqueId(),
      text: text.trim(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

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
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return {
    messages,
    inputText,
    isTyping,
    setInputText,
    handleSendMessage,
    handleSuggestionClick,
    dismissKeyboard,
  };
};
