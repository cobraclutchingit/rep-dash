import { UserRole, SalesPosition } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageAnnouncements } from '@/lib/utils/permissions';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
  visibleToRoles: z.array(z.enum(['USER', 'ADMIN'])).optional(),
  visibleToPositions: z
    .array(z.enum(['JUNIOR_EC', 'ENERGY_CONSULTANT', 'ENERGY_SPECIALIST', 'MANAGER']))
    .optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: announcementId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const userRole = session.user.role as UserRole;
    const userPosition = session.user.position as SalesPosition | null;

    const hasRoleAccess = announcement.visibleToRoles?.includes(userRole) ?? true;
    const hasPositionAccess = userPosition
      ? (announcement.visibleToPositions?.includes(userPosition) ?? true)
      : true;

    if (!hasRoleAccess || !hasPositionAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view this announcement" },
        { status: 403 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: announcementId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageAnnouncements(session)) {
      return NextResponse.json(
        { error: "You don't have permission to edit announcements" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = announcementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid announcement data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: data.title,
        content: data.content,
        isDraft: !data.isPublished,
        publishDate: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        visibleToRoles: data.visibleToRoles ?? ['USER', 'ADMIN'],
        visibleToPositions: data.visibleToPositions ?? [
          'JUNIOR_EC',
          'ENERGY_CONSULTANT',
          'ENERGY_SPECIALIST',
          'MANAGER',
        ],
      },
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const { id: announcementId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageAnnouncements(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete announcements" },
        { status: 403 }
      );
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
