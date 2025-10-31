import GreetingCard from '@/components/GreetingCard';
import { AuthService } from '@/services';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Karmi - Admin',
  description: 'Karmi - Admin',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const resp = await AuthService.me();
    if (resp.isAdmin) {
      return (
        <div className='flex h-full flex-col gap-3 p-6'>
          <div className='space-y-3'>
            <GreetingCard name='Admin' />
            <div className='flex items-center gap-3'>
              <p className='text-sm font-medium'>Quick Links:</p>
              <div className='flex gap-3'>
                <Link title='Users' href='/admin/users' className='text-sm text-blue-500 hover:underline'>
                  Users
                </Link>
                <Link title='Chat Config' href='/admin/chat' className='text-sm text-blue-500 hover:underline'>
                  Chat Config
                </Link>
              </div>
            </div>
          </div>
          <div className='flex-1 overflow-hidden'>{children}</div>
        </div>
      );
    } else {
      notFound();
    }
  } catch (error) {
    notFound();
  }
}
