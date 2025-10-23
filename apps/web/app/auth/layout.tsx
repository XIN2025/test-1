import Image from 'next/image';
import React from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='relative flex h-screen w-full items-center justify-center overflow-hidden'>
      {/* Background */}
      <div className='absolute inset-0 z-10'>
        <Image src='/images/auth-bg.png' alt='Background' fill priority className='object-cover object-center' />
      </div>

      {/* Overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-[2px]' />

      <div className='relative z-10 mx-auto flex w-full max-w-lg flex-col'>{children}</div>
    </div>
  );
};

export default AuthLayout;
