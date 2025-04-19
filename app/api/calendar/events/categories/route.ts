import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EventType } from "@prisma/client";

// GET /api/calendar/events/categories - Get event categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Return all event types
    const eventTypes = Object.values(EventType);
    
    // Get count of events by type
    const eventCounts = await prisma.calendarEvent.groupBy({
      by: ["eventType"],
      _count: {
        id: true,
      },
    });
    
    // Format the response
    const formattedResponse = eventTypes.map(type => {
      const count = eventCounts.find(item => item.eventType === type);
      return {
        type,
        displayName: formatEventType(type),
        count: count?._count.id || 0,
      };
    });
    
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching event categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch event categories" },
      { status: 500 }
    );
  }
}

// Helper function to format event type display
function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}