import { Prisma, SalesPosition, UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageEvents } from '@/lib/utils/permissions';

// Schema for event validation
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
  visibleToRoles: z.array(z.enum([UserRole.USER, UserRole.ADMIN])),
  visibleToPositions: z
    .array(
      z.enum([
        SalesPosition.JUNIOR_EC,
        SalesPosition.ENERGY_CONSULTANT,
        SalesPosition.ENERGY_SPECIALIST,
        SalesPosition.MANAGER,
      ])
    )
    .optional(),
});

// GET /api/calendar/events - Get events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType');

    // Build filter condition
    const filter: Prisma.CalendarEventWhereInput = {
      OR: [
        {
          visibleToRoles: {
            has: session.user.role,
          },
        },
        {
          ...(session.user.position && {
            visibleToPositions: {
              has: session.user.position,
            },
          }),
        },
      ],
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      filter.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            {
              startDate: {
                lte: new Date(startDate),
              },
            },
            {
              endDate: {
                gte: new Date(endDate),
              },
            },
          ],
        },
      ];
    } else if (startDate) {
      filter.startDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      filter.endDate = {
        lte: new Date(endDate),
      };
    }

    // Add event type filter if provided
    if (eventType) {
      filter.eventType = eventType as
        | 'TRAINING'
        | 'MEETING'
        | 'APPOINTMENT'
        | 'BLITZ'
        | 'CONTEST'
        | 'HOLIDAY'
        | 'OTHER';
    }

    // Get events
    const events = await prisma.calendarEvent.findMany({
      where: filter,
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

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/calendar/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create events
    if (!canManageEvents(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create events" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = eventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If the event is not public and no roles/positions are specified, add defaults
    if (!data.isPublic) {
      if (data.visibleToRoles.length === 0) {
        data.visibleToRoles = [UserRole.USER, UserRole.ADMIN];
      }
    }

    // Create the event
    const event = await prisma.calendarEvent.create({
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
        createdById: session.user.id,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
