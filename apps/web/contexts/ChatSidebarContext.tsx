'use client';

import React, { createContext, useContext, useState } from 'react';

interface ChatSidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(undefined);

export function ChatSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return <ChatSidebarContext.Provider value={{ isOpen, toggle, close }}>{children}</ChatSidebarContext.Provider>;
}

export function useChatSidebar() {
  const context = useContext(ChatSidebarContext);
  if (context === undefined) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider');
  }
  return context;
}
