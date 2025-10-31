'use client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@repo/ui/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { getConsistentColors, getInitials } from '@repo/shared-types/utils';
import { Compass, Gamepad2, Heart, History, MessageSquarePlus } from 'lucide-react';

interface BottombarProps {
  isChatSidebarCollapsed: boolean;
  setIsChatSidebarCollapsed: (isChatSidebarCollapsed: boolean) => void;
}

const Bottombar = ({ isChatSidebarCollapsed, setIsChatSidebarCollapsed }: BottombarProps) => {
  const pathname = usePathname();
  const user = useAuth();
  const randomColor = getConsistentColors(user?.name || '');
  const routes = [
    {
      name: 'New Chat',
      icon: MessageSquarePlus,
      href: '/chat',
      isActive: pathname.startsWith('/chat'),
    },
    {
      name: 'History',
      icon: History,
      onClick: () => setIsChatSidebarCollapsed(!isChatSidebarCollapsed),
      isActive: !isChatSidebarCollapsed,
    },
    {
      name: 'Discover',
      icon: Compass,
      href: '/discover',
      isActive: pathname.startsWith('/discover'),
    },
    {
      name: 'Vibe',
      icon: Heart,
      href: '/vibe',
      isActive: pathname.startsWith('/vibe'),
    },
    {
      name: 'Quiz',
      icon: Gamepad2,
      href: '/quiz',
      isActive: pathname.startsWith('/quiz'),
    },
  ];
  const renderRoute = (route: (typeof routes)[number]) => {
    if (route.href) {
      return (
        <Link
          className={cn(
            'text-muted-foreground flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors',
            route.isActive && 'text-primary font-semibold'
          )}
          key={route.href}
          href={route.href}
        >
          <route.icon className='size-5' />
          <span className='text-xs'>{route.name}</span>
        </Link>
      );
    }
    return (
      <p
        className={cn(
          'text-muted-foreground flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors',
          route.isActive && 'text-foreground font-semibold'
        )}
        key={route.name}
        onClick={route.onClick}
      >
        <route.icon className='size-5' />
        <span className='text-xs'>{route.name}</span>
      </p>
    );
  };
  return (
    <nav className='bg-background border-border/40 flex h-16 items-center justify-around border-t px-2 md:hidden'>
      {routes.map((route) => {
        return renderRoute(route);
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
          className='flex size-6 items-center justify-center rounded-full'
        >
          {getInitials(user?.name || '')}
        </div>
        <span className='text-xs font-medium'>Profile</span>
      </Link>
    </nav>
  );
};

export default Bottombar;
