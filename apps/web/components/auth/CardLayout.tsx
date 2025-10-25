import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import Image from 'next/image';
import React from 'react';

interface CardLayoutProps {
  showLogo?: boolean;
  title?: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children: React.ReactNode;
  className?: string;
}

const CardLayout = ({
  showLogo = true,
  title,
  className,
  description,
  titleClassName,
  descriptionClassName,
  children,
}: CardLayoutProps) => {
  return (
    <Card className={cn('mx-auto w-full max-w-lg', className)}>
      <CardHeader>
        <div className='mx-auto mb-4 flex items-center gap-2'>
          {showLogo && (
            <>
              <Image
                src='/images/logo.png'
                alt='Karmi Logo'
                className='!h-10 !w-10 object-contain'
                width={1000}
                height={1000}
              />
              <span className='text-xl font-bold'>Karmi</span>
            </>
          )}
        </div>
        <CardTitle className={cn('text-center', titleClassName)}>{title}</CardTitle>
        <CardDescription className={cn('text-center', descriptionClassName)}>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default CardLayout;
