import { Metadata } from 'next';
import React from 'react';
import ChatPageComponent from '@/components/chat/ChatPage';

export const metadata: Metadata = {
  title: 'Karmi Chat',
  description: 'Karmi Chat',
};

const ChatPage = () => {
  return <ChatPageComponent />;
};

export default ChatPage;
