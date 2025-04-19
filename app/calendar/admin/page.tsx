import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageEvents } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";
import Link from "next/link";
import CalendarAnalytics from "../components/calendar-analytics";
import EventTypeManagement from "../components/event-type-management";
import { EventType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Calendar Admin | Sales Rep Dashboard",
  description: "Manage calendar events and categories",
};

export default async function CalendarAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has permission to manage calendar
  if (!canManageEvents(session)) {
    redirect("/calendar");
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
    by: ["eventType"],
    _count: {
      id: true,
    },
  });
  
  // Format event type stats
  const eventTypeStats = Object.values(EventType).map(type => {
    const count = eventsByType.find(item => item.eventType === type)?._count.id || 0;
    return {
      type,
      count,
    };
  });
  
  // Get events by creation date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const eventsByDate = await prisma.calendarEvent.groupBy({
    by: ["createdAt"],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  
  // Get recent events
  const recentEvents = await prisma.calendarEvent.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendar Administration</h1>
        <div className="mt-4 md:mt-0 space-x-2">
          <Link
            href="/calendar"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            View Calendar
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Events</h3>
          <p className="text-3xl font-bold">{totalEvents}</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold">{upcomingEvents}</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Blitz Events</h3>
          <p className="text-3xl font-bold">{blitzEvents}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Event Analytics</h2>
          <CalendarAnalytics eventTypeStats={eventTypeStats} eventsByDate={eventsByDate} />
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Event Types</h2>
          <EventTypeManagement eventTypes={eventTypeStats} />
        </div>
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
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
            <tbody className="divide-y divide-muted/50">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm font-medium">{event.title}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                      {event.eventType.replace(/_/g, " ")}
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
                  <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
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