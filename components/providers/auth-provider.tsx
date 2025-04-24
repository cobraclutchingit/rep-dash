'use client';

import { SessionProvider } from 'next-auth/react';

import { NotificationProvider } from '@/app/communication/providers/notification-provider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SessionProvider>
  );
}
