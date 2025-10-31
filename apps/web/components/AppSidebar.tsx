'use client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@repo/ui/lib/utils';
import { Compass, Gamepad2, Heart, History, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { getConsistentColors, getInitials } from '@repo/shared-types/utils';
import NavBar from './Navbar';
import Bottombar from './Bottombar';
import { ChatSidebar } from './chat/ChatSidebar';

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const user = useAuth();
  const randomColor = getConsistentColors(user?.name || '');

  const [isChatSidebarCollapsed, setIsChatSidebarCollapsed] = useState(true);

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
            'text-muted-foreground flex flex-col items-center justify-center gap-1',
            route.isActive && 'text-primary font-semibold'
          )}
          key={route.href}
          href={route.href}
        >
          <route.icon className='size-6' />
          <span className='text-xs'>{route.name}</span>
        </Link>
      );
    }
    return (
      <p
        className={cn(
          'text-muted-foreground flex cursor-pointer flex-col items-center justify-center gap-1',
          route.isActive && 'text-foreground font-semibold'
        )}
        key={route.name}
        onClick={route.onClick}
      >
        <route.icon className='size-6' />
        <span className='text-xs'>{route.name}</span>
      </p>
    );
  };

  return (
    <div className='flex h-dvh w-full overflow-hidden'>
      <div className='bg-background flex w-24 flex-shrink-0 flex-col items-center justify-between py-4 text-sm font-medium max-md:hidden'>
        <div className='flex w-full flex-col items-center justify-center gap-10'>
          <Link href='/'>
            <Image alt='karmi' src={'/images/logo.webp'} width={1000} height={1000} className='h-8 w-10 opacity-80' />
          </Link>
          {routes.map((route) => {
            return renderRoute(route);
          })}
        </div>
        <Link href='/profile' className='mb-2 flex flex-col items-center justify-center gap-1'>
          <div
            style={{ backgroundColor: randomColor.background, color: randomColor.text }}
            className='flex size-10 items-center justify-center rounded-full'
          >
            {getInitials(user?.name || '')}
          </div>
          <span className='text-xs'>Profile</span>
        </Link>
      </div>
      <ChatSidebar isCollapsed={isChatSidebarCollapsed} setIsCollapsed={setIsChatSidebarCollapsed} />
      <div className='bg-muted flex flex-1 flex-col overflow-hidden'>
        <NavBar />
        <main className='flex-1 overflow-auto'>{children}</main>
        <Bottombar
          isChatSidebarCollapsed={isChatSidebarCollapsed}
          setIsChatSidebarCollapsed={setIsChatSidebarCollapsed}
        />
      </div>
    </div>
  );
};

export default AppSidebar;
