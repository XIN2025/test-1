import { useState, useRef, useEffect, useCallback } from 'react';
import EventSource from 'react-native-sse';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types/chat';
import { API_BASE_URL } from '@/utils/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageQueueRef = useRef<{ type: string; content: any }[]>([]);
  const isProcessingQueueRef = useRef(false);

  const { user } = useAuth();
  const userEmail = user?.email || '';

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const processMessageQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (messageQueueRef.current.length > 0) {
      const messageData = messageQueueRef.current.shift();
      if (!messageData) break;

      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        if (messageData.type === 'response_chunk' && messageData.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isLoading && msg.sender === 'bot' ? { ...msg, text: msg.text + messageData.content } : msg,
            ),
          );
        } else if (messageData.type === 'follow_up' && messageData.content) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isLoading && msg.sender === 'bot'
                ? { ...msg, suggestions: messageData.content, isLoading: false }
                : msg,
            ),
          );
          setIsTyping(false);
        } else if (messageData.type === 'error') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isLoading && msg.sender === 'bot'
                ? {
                    ...msg,
                    text:
                      messageData.content ||
                      'I apologize, but I encountered an error while processing your request. Please try again later.',
                    isLoading: false,
                    suggestions: [],
                  }
                : msg,
            ),
          );
          setIsTyping(false);
        } else if (messageData.type === 'close') {
          setMessages((prev) =>
            prev.map((msg) => (msg.isLoading && msg.sender === 'bot' ? { ...msg, isLoading: false } : msg)),
          );
          setIsTyping(false);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }

    isProcessingQueueRef.current = false;
  }, []);

  useEffect(() => {
    if (messageQueueRef.current.length > 0) {
      processMessageQueue();
    }
  }, [processMessageQueue]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    messageQueueRef.current = [];

    const userMessage: Message = {
      id: generateUniqueId(),
      text: text.trim(),
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const botMessageId = generateUniqueId();
    const botMessagePlaceholder: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      isLoading: true,
      suggestions: [],
    };
    setMessages((prev) => [...prev, botMessagePlaceholder]);

    const url = `${API_BASE_URL}/chat/stream`;
    const urlWithParams = new URL(url);
    urlWithParams.searchParams.append('message', text.trim());
    urlWithParams.searchParams.append('user_email', userEmail);

    eventSourceRef.current = new EventSource(urlWithParams.toString());

    eventSourceRef.current.addEventListener('open', () => {
      console.log('SSE connection opened.');
    });

    eventSourceRef.current.addEventListener('message', (event) => {
      if (!event.data) return;

      try {
        const parsed = JSON.parse(event.data);

        messageQueueRef.current.push(parsed);

        processMessageQueue();

        if (parsed.type === 'follow_up' || parsed.type === 'error') {
          setTimeout(() => {
            closeStream();
          }, 0);
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', event.data, e);
      }
    });

    eventSourceRef.current.addEventListener('error', (event) => {
      console.error('SSE connection error:', event);

      messageQueueRef.current.push({
        type: 'error',
        content: "I apologize, but I'm having trouble connecting. Please try again later.",
      });

      processMessageQueue();

      setTimeout(() => {
        eventSourceRef.current?.close();
      }, 0);
    });

    const closeStream = () => {
      console.log('SSE connection closed.');

      messageQueueRef.current.push({
        type: 'close',
        content: null,
      });

      processMessageQueue();

      eventSourceRef.current?.close();
    };
  };

  return {
    messages,
    inputText,
    setInputText,
    handleSendMessage,
  };
};
