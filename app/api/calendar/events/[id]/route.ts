import { UserRole, SalesPosition } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canEditEvent, canManageEvents } from '@/lib/utils/permissions';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  eventType: z.enum(['TRAINING', 'MEETING', 'APPOINTMENT', 'BLITZ', 'CONTEST', 'HOLIDAY', 'OTHER']),
  isBlitz: z.boolean().default(false),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date',
  }),
  allDay: z.boolean().default(false),
  location: z.string().optional().nullable(),
  locationUrl: z.string().optional().nullable(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('NONE'),
  recurrenceEndDate: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
  visibleToRoles: z.array(z.enum(['USER', 'ADMIN'])),
  visibleToPositions: z
    .array(z.enum(['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER']))
    .optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = resolvedParams.id;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
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
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const userPosition = session.user.position as SalesPosition | null;

    const hasRoleAccess = event.visibleToRoles.includes(userRole);
    const hasPositionAccess = userPosition
      ? event.visibleToPositions.includes(userPosition)
      : false;

    if (!event.isPublic && !hasRoleAccess && !hasPositionAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view this event" },
        { status: 403 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = resolvedParams.id;

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!canEditEvent(session, existingEvent.createdById)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = eventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    if (!data.isPublic && data.visibleToRoles.length === 0) {
      data.visibleToRoles = ['USER', 'ADMIN'];
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        isBlitz: data.isBlitz,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allDay: data.allDay,
        location: data.location,
        locationUrl: data.locationUrl,
        recurrence: data.recurrence,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        isPublic: data.isPublic,
        visibleToRoles: data.visibleToRoles,
        visibleToPositions: data.visibleToPositions || [],
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
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = resolvedParams.id;

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!canManageEvents(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete events" },
        { status: 403 }
      );
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
