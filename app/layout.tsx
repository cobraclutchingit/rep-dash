import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { AppProvider } from '@/components/providers/app-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const interMono = Inter({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Sales Rep Dashboard',
  description: 'A complete sales rep management dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${interMono.variable} font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
