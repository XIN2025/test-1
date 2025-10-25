'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Sparkle } from 'lucide-react';

const KarmiPointsCard = () => {
  return (
    <Card className='from-primary to-secondary w-full gap-0 bg-gradient-to-tr p-0'>
      <CardHeader className='gap-0 pt-4'>
        <CardTitle>Buy Karmi Points</CardTitle>
      </CardHeader>
      <Card className='m-4 p-3'>
        <CardContent className='bg-background flex flex-col items-center justify-center gap-3'>
          <Badge variant='default'>Recommended</Badge>
          <div className='text-primary flex items-center gap-2 text-3xl font-bold'>
            +100 <Sparkle className='size-8 animate-pulse' fill='currentColor' />
          </div>
          <Button variant='primaryOutline' className='w-full rounded-full font-semibold'>
            Buy Karmi Points
          </Button>
        </CardContent>
      </Card>
    </Card>
  );
};

export default KarmiPointsCard;
