import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/training/modules/[id]/progress - Get user's progress for a module
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;
    const userId = session.user.id;

    // Get the progress
    const progress = await prisma.trainingProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// PUT /api/training/modules/[id]/progress - Update user's progress for a module
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;
    const userId = session.user.id;
    const data = await request.json();

    // Find existing progress or create a new one
    let progress = await prisma.trainingProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (!progress) {
      // Create new progress record
      progress = await prisma.trainingProgress.create({
        data: {
          userId,
          moduleId,
          status: data.status || 'IN_PROGRESS',
          currentSection: data.currentSection || 0,
          percentComplete: data.percentComplete || 0,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      });
    } else {
      // Update existing progress
      progress = await prisma.trainingProgress.update({
        where: { id: progress.id },
        data: {
          status: data.status || progress.status,
          currentSection:
            data.currentSection !== undefined ? data.currentSection : progress.currentSection,
          percentComplete:
            data.percentComplete !== undefined ? data.percentComplete : progress.percentComplete,
          completedAt:
            data.status === 'COMPLETED' && !progress.completedAt
              ? new Date()
              : data.completedAt || progress.completedAt,
          lastAccessedAt: new Date(),
        },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
