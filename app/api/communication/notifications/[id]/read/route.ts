import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/communication/notifications/[id]/read
// Mark a notification as read
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Get the notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if the notification belongs to the user
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to mark this notification as read" },
        { status: 403 }
      );
    }

    // Mark the notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
