import { Metadata } from 'next';
import React from 'react';
import { ChatConfig } from '@/components/admin/ChatConfig';

export const metadata: Metadata = {
  title: 'Karmi - Chat Configuration',
  description: 'Karmi - Chat Configuration',
};

const AdminChatPage = () => {
  return <ChatConfig />;
};

export default AdminChatPage;
