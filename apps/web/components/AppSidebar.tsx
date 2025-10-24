'use client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@repo/ui/lib/utils';
import { Compass, Gamepad2, Heart, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { getConsistentColors, getInitials } from '@repo/shared-types/utils';
import NavBar from './Navbar';
import Bottombar from './Bottombar';

export const routes = [
  {
    name: 'New Chat',
    icon: MessageSquarePlus,
    href: '/chat',
  },
  {
    name: 'Discover',
    icon: Compass,
    href: '/discover',
  },
  {
    name: 'Vibe',
    icon: Heart,
    href: '/vibe',
  },
  {
    name: 'Quiz',
    icon: Gamepad2,
    href: '/quiz',
  },
];

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const user = useAuth();
  const randomColor = getConsistentColors(user?.name || '');

  return (
    <div className='flex h-dvh w-full overflow-hidden'>
      <div className='bg-background flex w-24 flex-shrink-0 flex-col items-center justify-between py-4 text-sm font-medium max-md:hidden'>
        <div className='flex w-full flex-col items-center justify-center gap-10'>
          <Link href='/'>
            <Image alt='karmi' src={'/images/logo.png'} width={1000} height={1000} className='h-8 w-10 opacity-80' />
          </Link>
          {routes.map((route) => {
            const isActive = pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'text-muted-foreground flex flex-col items-center justify-center gap-1',
                  isActive && 'text-primary font-semibold'
                )}
              >
                <route.icon className='size-6' />
                <span className='text-xs'>{route.name}</span>
              </Link>
            );
          })}
        </div>
        <Link href='/profile' className='mb-2 flex flex-col items-center justify-center gap-1'>
          <Avatar className='size-10'>
            <AvatarImage src={user?.name || ''} />
            <AvatarFallback style={{ backgroundColor: randomColor.background, color: randomColor.text }}>
              {getInitials(user?.name || '')}
            </AvatarFallback>
          </Avatar>
          <span className='text-xs'>Profile</span>
        </Link>
      </div>

      <div className='bg-muted flex flex-1 flex-col overflow-hidden'>
        <NavBar />
        <main className='flex-1 overflow-auto'>{children}</main>
        <Bottombar />
      </div>
    </div>
  );
};

export default AppSidebar;
