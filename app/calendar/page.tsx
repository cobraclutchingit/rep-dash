import { EventType } from '@prisma/client';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import CalendarToolbar from './components/calendar-toolbar';
import CalendarView from './components/calendar-view';
import CalendarProvider from './providers/calendar-provider';
import './styles/calendar.css';

export const metadata: Metadata = {
  title: 'Calendar | Sales Rep Dashboard',
  description: 'Manage your meetings and events',
};

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch all events visible to the user
  const events = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        {
          // Check if event is visible to user's role
          visibleToRoles: {
            has: session.user.role,
          },
        },
        {
          // Check if event is visible to user's position (if they have one)
          ...(session.user.position && {
            visibleToPositions: {
              has: session.user.position,
            },
          }),
        },
      ],
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageUrl: true,
        },
      },
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Get event types for filtering
  const eventTypes = Object.values(EventType);

  return (
    <CalendarProvider initialEvents={events}>
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-4">
          <div className="mb-4 flex flex-col justify-between md:flex-row md:items-center">
            <h1 className="text-3xl font-bold">Calendar</h1>
            <CalendarToolbar eventTypes={eventTypes} userId={session.user.id} />
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-4 shadow">
            <CalendarView userId={session.user.id} />
          </div>
        </div>
      </div>
    </CalendarProvider>
  );
}
