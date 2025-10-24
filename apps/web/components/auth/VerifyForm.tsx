'use client';
import React from 'react';
import CardLayout from './CardLayout';
import { Check } from 'lucide-react';
import { Button } from '@repo/ui/components/button';

interface VerifyFormProps {
  redirectUrl: string | null;
}

const VerifyForm = ({ redirectUrl }: VerifyFormProps) => {
  return (
    <CardLayout>
      <div className='flex flex-col items-center justify-center space-y-8'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <div className='bg-foreground flex items-center justify-center rounded-full p-8'>
            <Check strokeWidth={3} className='text-background size-12' />
          </div>
          <div className='text-center'>
            <p className='text-2xl font-semibold'>Verification Completed</p>
            <p className='text-muted-foreground text-center text-sm'>Your account has been verified successfully!</p>
          </div>
        </div>

        <Button
          className='mt-8 w-full'
          onClick={() => (redirectUrl ? (window.location.href = redirectUrl) : window.location.reload())}
        >
          Continue
        </Button>
      </div>
    </CardLayout>
  );
};

export default VerifyForm;
