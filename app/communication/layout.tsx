import { Metadata } from 'next';
import React from 'react';

import { CommunicationProvider } from './providers/communication-provider';

export const metadata: Metadata = {
  title: 'Communication Hub | Sales Rep Dashboard',
  description: 'Access announcements, important links, and contests',
};

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return <CommunicationProvider>{children}</CommunicationProvider>;
}
