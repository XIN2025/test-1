import { Metadata } from 'next';
import React from 'react';
import InitialChatPage from '@/components/chat/InitialChatPage';

export const metadata: Metadata = {
  title: 'Karmi Chat',
  description: 'Karmi Chat',
};

const ChatPage = () => {
  return <InitialChatPage />;
};

export default ChatPage;
