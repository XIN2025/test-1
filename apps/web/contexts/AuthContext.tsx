'use client';

import GlobalLoading from '@/app/loading';
import { AuthService } from '@/services/auth.service';
import { AuthContextType } from '@repo/shared-types/types';
import { signOut, useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthContextType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();
  const router = useRouter();

  const logOut = () => {
    signOut({
      callbackUrl: '/auth/login',
    });
  };

  const fetchUser = async () => {
    try {
      const resp = await AuthService.me();
      if (resp) {
        setUser(resp);
      }
      if (resp.redirectUrl) {
        router.push(resp.redirectUrl);
        return;
      }
    } catch (error) {
      toast.error('Failed to fetch user');
      logOut();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUser();
    }
  }, [status]);

  if (isLoading || status === 'loading' || !user) {
    return <GlobalLoading />;
  }

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
