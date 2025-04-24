import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageCommunications } from '@/lib/utils/permissions';

// GET /api/communication/announcements
// Get all visible announcements for the current user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const isAdmin = canManageCommunications(session);
    const now = new Date();

    // Build query based on user role and position
    const query: Prisma.AnnouncementFindManyArgs = {
      where: {
        // Regular users only see published announcements
        ...(isAdmin
          ? {}
          : {
              isDraft: false,
              AND: [
                { publishDate: { lte: now } },
                {
                  OR: [{ expiryDate: { gt: now } }, { expiryDate: null }],
                },
              ],
            }),
        // Filter by roles and positions
        ...(isAdmin
          ? {}
          : {
              OR: [
                { visibleToRoles: { has: session.user.role } },
                { visibleToRoles: { isEmpty: true } },
              ],
            }),
        ...(isAdmin || !session.user.position
          ? {}
          : {
              OR: [
                { visibleToPositions: { has: session.user.position } },
                { visibleToPositions: { isEmpty: true } },
              ],
            }),
      },
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { publishDate: 'desc' }],
    };

    const announcements = await prisma.announcement.findMany(query);

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST /api/communication/announcements
// Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!canManageCommunications(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create announcements" },
        { status: 403 }
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
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Create the announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        category,
        visibleToRoles: visibleToRoles || [],
        visibleToPositions: visibleToPositions || [],
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPinned: isPinned || false,
        isDraft: isDraft || false,
      },
    });

    // If not a draft and published immediately, create notifications for users
    if (!isDraft && new Date(publishDate) <= new Date()) {
      // Get users who should receive this notification based on roles/positions
      const whereClause: Prisma.UserWhereInput = {
        isActive: true,
      };

      if (visibleToRoles?.length > 0) {
        whereClause.role = { in: visibleToRoles };
      }

      if (visibleToPositions?.length > 0) {
        whereClause.position = { in: visibleToPositions };
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
            title: 'New Announcement',
            message: title,
            type: 'ANNOUNCEMENT',
            resourceId: announcement.id,
            expiresAt: expiryDate ? new Date(expiryDate) : null,
          })),
        });
      }
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
