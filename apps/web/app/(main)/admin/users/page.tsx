import Users from '@/components/admin/Users';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Karmi - Users',
  description: 'Karmi - Users',
};

const UsersPage = () => {
  return <Users />;
};

export default UsersPage;
