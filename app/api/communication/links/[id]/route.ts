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

// GET /api/communication/links/[id]
// Get a specific link by ID
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Find the link
    const link = await prisma.importantLink.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check if user has access to this link
    const isAdmin = canManageLinks(session);

    // If it's inactive, only admins can see it
    if (!link.isActive && !isAdmin) {
      return NextResponse.json({ error: 'This link is not active' }, { status: 403 });
    }

    // Check role/position visibility for regular users
    if (!isAdmin) {
      const hasRoleAccess =
        link.visibleToRoles.length === 0 || link.visibleToRoles.includes(session.user.role);

      const hasPositionAccess =
        link.visibleToPositions.length === 0 ||
        (session.user.position && link.visibleToPositions.includes(session.user.position));

      if (!hasRoleAccess || !hasPositionAccess) {
        return NextResponse.json(
          { error: "You don't have permission to access this link" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json({ error: 'Failed to fetch link' }, { status: 500 });
  }
}

// PUT /api/communication/links/[id]
// Update an existing link
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id } = await params;
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
        { error: "You don't have permission to update links" },
        { status: 403 }
      );
    }

    // Check if link exists
    const existingLink = await prisma.importantLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
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
    if ((title !== undefined && title === '') || (url !== undefined && url === '')) {
      return NextResponse.json({ error: 'Title and URL cannot be empty' }, { status: 400 });
    }

    // Validate URL format if provided
    if (url !== undefined) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    // Generate category slug if category is updated
    const categorySlug =
      category !== undefined ? (category ? createSlug(category) : null) : existingLink.categorySlug;

    // Check if the link is being activated
    const wasActive = existingLink.isActive;
    const isNowActive = isActive === undefined ? wasActive : isActive;

    // Update the link
    const updatedLink = await prisma.importantLink.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(category !== undefined && { categorySlug }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
        ...(visibleToRoles !== undefined && { visibleToRoles }),
        ...(visibleToPositions !== undefined && { visibleToPositions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // If the link is being activated for the first time, create notifications
    if (!wasActive && isNowActive) {
      // Get users who should receive this notification based on roles/positions
      const whereClause: Prisma.UserWhereInput = {
        isActive: true,
      };

      if (updatedLink.visibleToRoles?.length > 0) {
        whereClause.role = { in: updatedLink.visibleToRoles };
      }

      if (updatedLink.visibleToPositions?.length > 0) {
        whereClause.position = { in: updatedLink.visibleToPositions };
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
            message: `A new link has been added: ${updatedLink.title}`,
            type: 'LINK',
            resourceId: updatedLink.id,
          })),
        });
      }
    }

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}

// DELETE /api/communication/links/[id]
// Delete a link
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id } = await params;
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
        { error: "You don't have permission to delete links" },
        { status: 403 }
      );
    }

    // Check if link exists
    const existingLink = await prisma.importantLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Delete related notifications first
    await prisma.notification.deleteMany({
      where: {
        type: 'LINK',
        resourceId: id,
      },
    });

    // Delete the link
    await prisma.importantLink.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Link deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
