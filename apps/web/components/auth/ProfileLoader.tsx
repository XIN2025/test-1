'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn } from '@repo/ui/lib/utils';

export interface ProfileLoaderProps {
  className?: string;
  duration?: number;
  onComplete?: () => void;
}

const ProfileLoader = ({ className, duration = 5, onComplete }: ProfileLoaderProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number | undefined;
    const startTime = performance.now();
    const totalDuration = duration * 1000;
    let cancelled = false;

    const animate = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress < 100) {
        rafId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [duration, onComplete]);

  const getStarPosition = (progress: number) => {
    const t = progress / 100;
    const minX = -5;
    const vbWidth = 120;
    const minY = 0;
    const vbHeight = 100;

    const P0 = { x: -10, y: 50 };
    const P1 = { x: 20, y: 95 };
    const P2 = { x: 80, y: 5 };
    const P3 = { x: 110, y: 50 };

    const oneMinusT = 1 - t;

    const x = oneMinusT ** 3 * P0.x + 3 * oneMinusT ** 2 * t * P1.x + 3 * oneMinusT * t ** 2 * P2.x + t ** 3 * P3.x;

    const y = oneMinusT ** 3 * P0.y + 3 * oneMinusT ** 2 * t * P1.y + 3 * oneMinusT * t ** 2 * P2.y + t ** 3 * P3.y;

    const leftPct = ((x - minX) / vbWidth) * 100;
    const topPct = ((y - minY) / vbHeight) * 100;

    return { leftPct, topPct };
  };

  const star = getStarPosition(progress);

  return (
    <div
      className={cn(
        'relative flex h-dvh w-full flex-col items-center justify-center overflow-x-visible overflow-y-hidden',
        className
      )}
    >
      {/* Optimized Background */}
      <div className='absolute inset-0'>
        <Image
          src='/images/profileload-bg.png'
          alt='Profile Loader Background'
          fill
          priority
          className='object-cover'
        />
      </div>

      <div className='relative z-10 flex w-full flex-col items-center space-y-8'>
        <h1 className='text-background text-center text-4xl font-bold md:text-5xl'>Your Stars Look Great</h1>

        <div className='text-background/70 text-center'>
          <p className='text-lg'>
            Congratulations! You have earned <span className='text-primary font-bold'>50 karmi points</span>
          </p>
          <p className='mt-2 text-sm'>Please wait while we analyze your birth details</p>
        </div>

        <div className='relative flex w-full flex-col items-center space-y-4'>
          <div className='text-primary text-3xl font-bold'>{Math.round(progress)}%</div>

          <div className='relative h-40 w-full overflow-visible'>
            <svg
              className='absolute inset-0 h-full w-full overflow-visible'
              viewBox='-10 0 120 100'
              preserveAspectRatio='none'
            >
              <path d='M -10,50 C 20,95 80,5 110,50' stroke='#6B7280' strokeWidth='1.5' fill='none' />
            </svg>

            {progress < 100 && (
              <div
                className='absolute'
                style={{
                  left: `${star.leftPct}%`,
                  top: `${star.topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Optimized Star Image */}
                <div className='relative drop-shadow-lg' style={{ width: '13vw', height: '6vw' }}>
                  <Image
                    src='/images/star.png'
                    alt='Star'
                    fill
                    className='object-contain'
                    onError={(e) => {
                      console.error('Failed to load star image:', e);
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLoader;
