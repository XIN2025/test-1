import React from 'react';
import ShinyText from '@/components/ShinyText';

const MessageLoading = () => {
  return (
    <div className='flex max-w-full items-center gap-3'>
      <ShinyText text='Karmi is thinking...' className='font-medium' />
    </div>
  );
};

export default MessageLoading;
