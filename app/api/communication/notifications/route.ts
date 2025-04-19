import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/communication/notifications
// Get all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string, 10) : undefined;

    // Current time for filtering expired notifications
    const now = new Date();

    // Build query
    const query: any = {
      where: {
        userId: session.user.id,
        // Only include unread if specified
        ...(unreadOnly ? { isRead: false } : {}),
        // Filter out expired notifications
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    };

    const notifications = await prisma.notification.findMany(query);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/communication/notifications
// Create a notification (primarily used by the system)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is an admin (only admins/system can create notifications)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to create notifications" },
        { status: 403 }
      );
    }

    const {
      userId,
      title,
      message,
      type,
      resourceId,
      expiresAt,
    } = await request.json();

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "User ID, title, message, and type are required" },
        { status: 400 }
      );
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        resourceId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}