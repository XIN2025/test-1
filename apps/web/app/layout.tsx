import '@repo/ui/globals.css';
import Providers from './providers';
import { Metadata } from 'next';
import { dmSans } from '@/lib/fonts';
import { Suspense } from 'react';
import GlobalLoading from './loading';
import { ReactQueryClientProvider } from '@/lib/tanstack-provider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Karmi',
  description: 'Karmi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryClientProvider>
      <html lang='en' suppressHydrationWarning>
        <Script defer src='https://cloud.umami.is/script.js' data-website-id='bdf37123-ccfa-464e-b528-0bb9426a15ed' />
        <body className={`${dmSans.className} antialiased`}>
          <Suspense fallback={<GlobalLoading />}>
            <Providers>{children}</Providers>
          </Suspense>
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
