import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCommunications } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/communication/announcements/[id]
// Get a specific announcement by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Find the announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this announcement
    const isAdmin = canManageCommunications(session);
    const now = new Date();

    // If it's a draft, only admins can see it
    if (announcement.isDraft && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to access this announcement" },
        { status: 403 }
      );
    }

    // Check publish/expiry dates for regular users
    if (!isAdmin) {
      if (announcement.publishDate > now) {
        return NextResponse.json(
          { error: "This announcement is not yet published" },
          { status: 403 }
        );
      }

      if (announcement.expiryDate && announcement.expiryDate < now) {
        return NextResponse.json(
          { error: "This announcement has expired" },
          { status: 403 }
        );
      }
    }

    // Check role/position visibility for regular users
    if (!isAdmin) {
      const hasRoleAccess =
        announcement.visibleToRoles.length === 0 ||
        announcement.visibleToRoles.includes(session.user.role);

      const hasPositionAccess =
        announcement.visibleToPositions.length === 0 ||
        (session.user.position &&
          announcement.visibleToPositions.includes(session.user.position));

      if (!hasRoleAccess || !hasPositionAccess) {
        return NextResponse.json(
          { error: "You don't have permission to access this announcement" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

// PUT /api/communication/announcements/[id]
// Update an existing announcement
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageCommunications(session)) {
      return NextResponse.json(
        { error: "You don't have permission to update announcements" },
        { status: 403 }
      );
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    const {
      title,
      content,
      priority,
      category,
      visibleToRoles,
      visibleToPositions,
      publishDate,
      expiryDate,
      isPinned,
      isDraft,
    } = await request.json();

    // Validate required fields
    if ((title === undefined || title === "") || 
        (content === undefined || content === "")) {
      return NextResponse.json(
        { error: "Title and content cannot be empty" },
        { status: 400 }
      );
    }

    // Get the current publication status before update
    const wasPublished = !existingAnnouncement.isDraft && 
      existingAnnouncement.publishDate <= new Date();
      
    // Update the announcement
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(visibleToRoles !== undefined && { visibleToRoles }),
        ...(visibleToPositions !== undefined && { visibleToPositions }),
        ...(publishDate !== undefined && { publishDate: new Date(publishDate) }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isDraft !== undefined && { isDraft }),
      },
    });

    // Check if we're publishing a draft announcement
    const isNowPublished = !updatedAnnouncement.isDraft && 
      updatedAnnouncement.publishDate <= new Date();

    // If we're publishing for the first time, create notifications
    if (!wasPublished && isNowPublished) {
      // Get users who should receive this notification based on roles/positions
      const whereClause: any = {
        isActive: true,
      };

      if (updatedAnnouncement.visibleToRoles?.length > 0) {
        whereClause.role = { in: updatedAnnouncement.visibleToRoles };
      }

      if (updatedAnnouncement.visibleToPositions?.length > 0) {
        whereClause.position = { in: updatedAnnouncement.visibleToPositions };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true },
      });

      // Create notifications for each user
      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((user) => ({
            userId: user.id,
            title: "New Announcement",
            message: updatedAnnouncement.title,
            type: "ANNOUNCEMENT",
            resourceId: updatedAnnouncement.id,
            expiresAt: updatedAnnouncement.expiryDate,
          })),
        });
      }
    }

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE /api/communication/announcements/[id]
// Delete an announcement
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageCommunications(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete announcements" },
        { status: 403 }
      );
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Delete related notifications first
    await prisma.notification.deleteMany({
      where: {
        type: "ANNOUNCEMENT",
        resourceId: id,
      },
    });

    // Delete the announcement
    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Announcement deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}