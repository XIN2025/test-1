'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlobalLoading from '@/app/loading';

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    router.push('/chat');
  }, []);

  return <GlobalLoading />;
};

export default Page;
