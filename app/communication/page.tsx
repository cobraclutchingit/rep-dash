import { Metadata } from 'next';

import AnnouncementsSection from './components/announcements-section';
import ContestsSection from './components/contests-section';
import LinksSection from './components/links-section';

export const metadata: Metadata = {
  title: 'Communication Hub | Sales Rep Dashboard',
  description: 'Access announcements, important links, and contests',
};

export default function CommunicationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold">Communication Hub</h1>
      </div>

      <div className="space-y-8">
        {/* Announcements Section */}
        <div>
          <AnnouncementsSection limit={3} />
        </div>

        {/* Important Links Section */}
        <div>
          <LinksSection limit={6} />
        </div>

        {/* Contests Section */}
        <div>
          <ContestsSection limit={3} />
        </div>
      </div>
    </div>
  );
}
