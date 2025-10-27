import AppSidebar from '@/components/AppSidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatSidebarProvider } from '@/contexts/ChatSidebarContext';
import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ChatSidebarProvider>
        <AppSidebar>{children}</AppSidebar>
      </ChatSidebarProvider>
    </AuthProvider>
  );
};

export default MainLayout;
