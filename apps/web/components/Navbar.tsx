'use client';

import React from 'react';
import { Bell, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui/components/button';
import Link from 'next/link';

const NavBar = () => {
  const user = useAuth();
  return (
    <header className='bg-background border-border/40 sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b px-5'>
      <div className='bg-foreground text-background relative flex w-fit items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium'>
        <span className='pl-1'>{user?.name}</span>
        <ChevronDown className='bg-background text-foreground size-5 rounded-full' />
      </div>
      <div className='flex items-center gap-4'>
        {user?.isAdmin && (
          <Link href='/admin'>
            <Button variant='ghost' size='sm'>
              <Shield className='size-5' />
              Admin
            </Button>
          </Link>
        )}
        <Button variant='ghost' size='icon'>
          <Bell />
        </Button>
        <Button size='sm' className='rounded-full'>
          <span className='font-semibold'>1000</span> <Sparkles className='size-5' fill='currentColor' />
        </Button>
      </div>
    </header>
  );
};

export default NavBar;
