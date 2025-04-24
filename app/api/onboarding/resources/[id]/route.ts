import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageOnboarding } from '@/lib/utils/permissions';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/onboarding/resources/[id]
// Get a specific resource by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        onboardingSteps: {
          select: {
            id: true,
            title: true,
            trackId: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

// PUT /api/onboarding/resources/[id]
// Update an existing resource
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to update resources" },
        { status: 403 }
      );
    }

    const { title, description, type, url, isExternal } = await request.json();

    // Validate required fields
    if (!title || !type || !url) {
      return NextResponse.json({ error: 'Title, type, and URL are required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Update the resource
    const updatedResource = await prisma.resource.update({
      where: { id },
      data: {
        title,
        description,
        type,
        url,
        isExternal: isExternal !== undefined ? isExternal : true,
      },
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

// DELETE /api/onboarding/resources/[id]
// Delete a resource
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    // Check if user can manage onboarding
    if (!canManageOnboarding(session)) {
      return NextResponse.json(
        { error: "You don't have permission to delete resources" },
        { status: 403 }
      );
    }

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
      include: {
        onboardingSteps: true,
      },
    });

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Delete the resource
    await prisma.resource.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Resource deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
