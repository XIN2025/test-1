'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Sparkle } from 'lucide-react';

const KarmiPremiumCard = () => {
  return (
    <Card className='relative w-full overflow-hidden p-0'>
      <div className='absolute -top-14 -right-14 opacity-40'>
        <Image src='/images/moon.svg' alt='Moon' width={200} height={200} className='h-52 w-52' />
      </div>

      <CardContent className='relative p-4'>
        <div className='mb-4'>
          <Badge variant='default' className='rounded-full'>
            Karmi Premium
          </Badge>
        </div>

        <h3 className='mb-3 text-xl font-bold'>Unlock The Added Benefits of Karmi</h3>

        <p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
          Gives you access to multiple profile switching, more charts, unlimited vibe matches and much more
        </p>

        <Button variant={'primary'} className='w-full rounded-full font-semibold'>
          Go Premium
          <Sparkle className='size-4' fill='currentColor' />
        </Button>
      </CardContent>
    </Card>
  );
};

export default KarmiPremiumCard;
