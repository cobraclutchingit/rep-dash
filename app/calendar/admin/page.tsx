import { EventType } from '@prisma/client';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageEvents } from '@/lib/utils/permissions';

import CalendarAnalytics from '../components/calendar-analytics';
import EventTypeManagement from '../components/event-type-management';

export const metadata: Metadata = {
  title: 'Calendar Admin | Sales Rep Dashboard',
  description: 'Manage calendar events and categories',
};

export default async function CalendarAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has permission to manage calendar
  if (!canManageEvents(session)) {
    redirect('/calendar');
  }

  // Get calendar stats
  const totalEvents = await prisma.calendarEvent.count();

  const upcomingEvents = await prisma.calendarEvent.count({
    where: {
      startDate: {
        gte: new Date(),
      },
    },
  });

  const blitzEvents = await prisma.calendarEvent.count({
    where: {
      isBlitz: true,
    },
  });

  // Get events by type
  const eventsByType = await prisma.calendarEvent.groupBy({
    by: ['eventType'],
    _count: {
      id: true,
    },
  });

  // Format event type stats
  const eventTypeStats = Object.values(EventType).map((type) => {
    const count = eventsByType.find((item) => item.eventType === type)?._count.id || 0;
    return {
      type,
      count,
    };
  });

  // Get events by creation date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const eventsByDate = await prisma.calendarEvent.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Get recent events
  const recentEvents = await prisma.calendarEvent.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <h1 className="text-3xl font-bold">Calendar Administration</h1>
        <div className="mt-4 space-x-2 md:mt-0">
          <Link
            href="/calendar"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            View Calendar
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Total Events</h3>
          <p className="text-3xl font-bold">{totalEvents}</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Upcoming Events</h3>
          <p className="text-3xl font-bold">{upcomingEvents}</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Blitz Events</h3>
          <p className="text-3xl font-bold">{blitzEvents}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Event Analytics</h2>
          <CalendarAnalytics eventTypeStats={eventTypeStats} eventsByDate={eventsByDate} />
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Event Types</h2>
          <EventTypeManagement eventTypes={eventTypeStats} />
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Created By</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-muted/50 divide-y">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm font-medium">{event.title}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="bg-muted inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(event.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {event.createdBy.name || event.createdBy.email}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <Link
                      href={`/calendar?event=${event.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {recentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-4 text-center">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
