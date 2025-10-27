'use client';

import { ChatSidebar } from '@/components/chat/ChatSidebar';
import React from 'react';

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex h-full'>
      {/* <ChatSidebar /> */}
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
};

export default ChatLayout;
