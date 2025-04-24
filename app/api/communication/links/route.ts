import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageLinks } from '@/lib/utils/permissions';

// Helper to create slug from category
function createSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/communication/links
// Get all visible links for the current user
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const isAdmin = canManageLinks(session);

    // Build query based on user role and position
    const query: Prisma.ImportantLinkFindManyArgs = {
      where: {
        // Regular users only see active links
        ...(isAdmin ? {} : { isActive: true }),
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
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    };

    const links = await prisma.importantLink.findMany(query);

    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// POST /api/communication/links
// Create a new link
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
    if (!canManageLinks(session)) {
      return NextResponse.json(
        { error: "You don't have permission to create links" },
        { status: 403 }
      );
    }

    const {
      title,
      url,
      description,
      category,
      icon,
      order,
      visibleToRoles,
      visibleToPositions,
      isActive,
    } = await request.json();

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // Try to validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Generate category slug if category is provided
    const categorySlug = category ? createSlug(category) : null;

    // Create the link
    const link = await prisma.importantLink.create({
      data: {
        title,
        url,
        description,
        category,
        categorySlug,
        icon,
        order: order ?? 0,
        visibleToRoles: visibleToRoles || [],
        visibleToPositions: visibleToPositions || [],
        isActive: isActive ?? true,
      },
    });

    // Notify relevant users about the new link if it's active
    if (isActive !== false) {
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
            title: 'New Important Link',
            message: `A new link has been added: ${title}`,
            type: 'LINK',
            resourceId: link.id,
            // Links don't expire
          })),
        });
      }
    }

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
