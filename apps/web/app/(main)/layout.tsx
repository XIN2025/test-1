import AppSidebar from '@/components/AppSidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AppSidebar>{children}</AppSidebar>
    </AuthProvider>
  );
};

export default MainLayout;
