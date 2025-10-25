'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui/components/button';
import Link from 'next/link';
import { useGetKarmiPoints } from '@/queries/profile';
import AnimatedCounter from './AnimatedCounter';
import { useIsMobile } from '@repo/ui/hooks/use-mobile';
import { cn } from '@repo/ui/lib/utils';
import { poppins } from '@/lib/fonts';

const NavBar = () => {
  const user = useAuth();
  const isMobile = useIsMobile();
  const [karmiPoints, setKarmiPoints] = useState<number>(0);
  const { data: karmiPointsData } = useGetKarmiPoints();

  useEffect(() => {
    if (karmiPointsData) {
      setKarmiPoints(karmiPointsData.karmiPoints);
    }
  }, [karmiPointsData]);

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
        <div className='group relative overflow-hidden rounded-full border-2 border-yellow-300/30 shadow-md transition-all duration-300 hover:border-yellow-200/50 hover:shadow-xl'>
          <Button
            size={isMobile ? 'sm' : 'default'}
            className='bg-gradient-to-r from-yellow-400 to-orange-500 text-white transition-all duration-300 hover:from-yellow-500 hover:to-orange-600'
          >
            <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />

            <div className='relative flex items-center gap-2'>
              <AnimatedCounter
                value={karmiPoints}
                duration={1200}
                className={cn('min-w-10 text-lg font-bold', poppins.className)}
              />
              <Sparkles
                className='size-5 animate-pulse transition-transform duration-300 group-hover:animate-spin'
                fill='currentColor'
              />
            </div>

            <div className='absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100' />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
