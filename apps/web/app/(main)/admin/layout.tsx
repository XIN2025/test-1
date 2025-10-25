import { AuthService } from '@/services';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

export const metadata: Metadata = {
  title: 'Karmi - Admin',
  description: 'Karmi - Admin',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const resp = await AuthService.me();
    if (resp.isAdmin) {
      return <>{children}</>;
    } else {
      notFound();
    }
  } catch (error) {
    notFound();
  }
}
