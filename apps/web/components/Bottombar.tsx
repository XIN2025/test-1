'use client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@repo/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { getConsistentColors, getInitials } from '@repo/shared-types/utils';
import { routes } from './AppSidebar';

const Bottombar = () => {
  const pathname = usePathname();
  const user = useAuth();
  const randomColor = getConsistentColors(user?.name || '');

  return (
    <nav className='bg-background border-border/40 flex h-16 items-center justify-around border-t px-2 md:hidden'>
      {routes.map((route) => {
        const isActive = pathname.startsWith(route.href);

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors',
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <route.icon className='size-5' />
            <span className='text-xs font-medium'>{route.name}</span>
          </Link>
        );
      })}
      <Link
        href='/profile'
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors',
          pathname === '/profile'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <div
          style={{ backgroundColor: randomColor.background, color: randomColor.text }}
          className='flex size-10 items-center justify-center rounded-full'
        >
          {getInitials(user?.name || '')}
        </div>
        <span className='text-xs font-medium'>Profile</span>
      </Link>
    </nav>
  );
};

export default Bottombar;
