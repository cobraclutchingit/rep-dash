import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canEditEvent, canManageEvents } from "@/lib/utils/permissions";
import { z } from "zod";

// Schema for event validation
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  eventType: z.enum([
    "TRAINING", "MEETING", "APPOINTMENT", "BLITZ", 
    "CONTEST", "HOLIDAY", "OTHER"
  ]),
  isBlitz: z.boolean().default(false),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  allDay: z.boolean().default(false),
  location: z.string().optional().nullable(),
  locationUrl: z.string().optional().nullable(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("NONE"),
  recurrenceEndDate: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
  visibleToRoles: z.array(z.enum(["USER", "ADMIN"])),
  visibleToPositions: z.array(z.enum([
    "JUNIOR_EC", "ENERGY_CONSULTANT", "ENERGY_SPECIALIST", "MANAGER"
  ])).optional(),
});

// GET /api/calendar/events/[id] - Get a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const eventId = params.id;
    
    // Get the event
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
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to view this event
    const userRole = session.user.role;
    const userPosition = session.user.position;
    
    const hasRoleAccess = event.visibleToRoles.includes(userRole);
    const hasPositionAccess = userPosition ? event.visibleToPositions.includes(userPosition) : false;
    
    if (!event.isPublic && !hasRoleAccess && !hasPositionAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view this event" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[id] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const eventId = params.id;
    
    // Get the existing event to check permissions
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to edit this event
    if (!canEditEvent(session, existingEvent.createdById)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = eventSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid event data", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // If the event is not public and no roles/positions are specified, add defaults
    if (!data.isPublic) {
      if (data.visibleToRoles.length === 0) {
        data.visibleToRoles = ["USER", "ADMIN"];
      }
    }
    
    // Update the event
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
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const eventId = params.id;
    
    // Get the existing event to check permissions
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete this event
    // Only admins/managers can delete events
    if (!canManageEvents(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete events" },
        { status: 403 }
      );
    }
    
    // Delete the event
    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}