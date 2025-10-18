import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Karmi - Admin',
  description: 'Karmi - Admin',
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AdminLayout;
