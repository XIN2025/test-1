'use client';
import { ThemeProvider } from '@repo/ui/components/theme-provider';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { Toaster } from '@repo/ui/components/sonner';
import { SessionProvider } from 'next-auth/react';
import AuthWrapper from './AuthWrapper';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <AuthWrapper>
        <ThemeProvider attribute='class' defaultTheme='system' disableTransitionOnChange>
          <Toaster duration={2500} richColors closeButton position='top-right' />
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </AuthWrapper>
    </SessionProvider>
  );
};

export default Providers;
