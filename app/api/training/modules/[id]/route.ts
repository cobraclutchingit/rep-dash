import { UserRole, SalesPosition } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Import UserRole and SalesPosition enums

// Define type for Prisma filter in GET - using proper enum types
type ModuleFilter = {
  id: string;
  visibleToRoles: { has: UserRole };
  visibleToPositions?: { has: SalesPosition };
  isPublished?: boolean;
};

// Define type for section input in PUT
type SectionInput = {
  id: string;
  title: string;
  content: string;
  contentFormat: 'HTML' | 'MARKDOWN' | 'VIDEO' | 'PDF' | 'QUIZ'; // Match ContentFormat enum
  order: number;
  isOptional: boolean;
};

// GET /api/training/modules/[id] - Get a specific module
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const moduleId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query filter - cast session values to proper enums
    const filter: ModuleFilter = {
      id: moduleId,
      visibleToRoles: { has: session.user.role as UserRole },
    };

    // Add position filter if user has a position
    if (session.user.position) {
      filter.visibleToPositions = { has: session.user.position as SalesPosition };
    }

    // Admin can see all modules, regular users only see published ones
    if (session.user.role !== 'ADMIN') {
      filter.isPublished = true;
    }

    const trainingModule = await prisma.trainingModule.findFirst({
      where: filter,
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            resources: true,
            quizQuestions: {
              include: {
                options: true,
              },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        progress: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!trainingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(trainingModule);
  } catch (error) {
    console.error('Error fetching training module:', error);
    return NextResponse.json({ error: 'Failed to fetch training module' }, { status: 500 });
  }
}

// PUT /api/training/modules/[id] - Update a specific module
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const moduleId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update modules
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Requires admin privileges' }, { status: 403 });
    }

    const data = await request.json();

    // Check if the module exists
    const existingModule = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        prerequisites: true,
        sections: true,
      },
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Update the module
    const updatedModule = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        order: data.order,
        isRequired: data.isRequired,
        isPublished: data.isPublished,
        visibleToRoles: data.visibleToRoles,
        visibleToPositions: data.visibleToPositions,
        estimatedDuration: data.estimatedDuration || null,
        publishedAt:
          data.isPublished && !existingModule.isPublished ? new Date() : existingModule.publishedAt,
      },
    });

    // Update prerequisites
    if (data.prerequisites) {
      // Delete existing prerequisites
      await prisma.trainingModulePrerequisite.deleteMany({
        where: { moduleId },
      });

      // Create new prerequisites
      if (data.prerequisites.length > 0) {
        await Promise.all(
          data.prerequisites.map((prerequisiteId: string) =>
            prisma.trainingModulePrerequisite.create({
              data: {
                moduleId,
                prerequisiteId,
              },
            })
          )
        );
      }
    }

    // Update sections if provided
    if (data.sections) {
      // Process each section
      for (const section of data.sections as SectionInput[]) {
        if (section.id.startsWith('temp-')) {
          // Create new section
          await prisma.trainingSection.create({
            data: {
              moduleId,
              title: section.title,
              content: section.content,
              contentFormat: section.contentFormat as
                | 'HTML'
                | 'MARKDOWN'
                | 'VIDEO'
                | 'PDF'
                | 'QUIZ',
              order: section.order,
              isOptional: section.isOptional,
            },
          });
        } else {
          // Check if the section exists
          const existingSection = existingModule.sections.find((s) => s.id === section.id);

          if (existingSection) {
            // Update existing section
            await prisma.trainingSection.update({
              where: { id: section.id },
              data: {
                title: section.title,
                content: section.content,
                contentFormat: section.contentFormat as
                  | 'HTML'
                  | 'MARKDOWN'
                  | 'VIDEO'
                  | 'PDF'
                  | 'QUIZ',
                order: section.order,
                isOptional: section.isOptional,
              },
            });
          }
        }
      }

      // Delete sections that were removed
      const existingSectionIds = existingModule.sections.map((s) => s.id);
      const newSectionIds = (data.sections as SectionInput[])
        .filter((s) => !s.id.startsWith('temp-'))
        .map((s) => s.id);

      const sectionsToDelete = existingSectionIds.filter((id) => !newSectionIds.includes(id));

      if (sectionsToDelete.length > 0) {
        await prisma.trainingSection.deleteMany({
          where: {
            id: { in: sectionsToDelete },
          },
        });
      }
    }

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error('Error updating training module:', error);
    return NextResponse.json({ error: 'Failed to update training module' }, { status: 500 });
  }
}

// DELETE /api/training/modules/[id] - Delete a specific module
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = context;
    const resolvedParams = await params;
    const moduleId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete modules
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Requires admin privileges' }, { status: 403 });
    }

    // Check if the module exists
    const existingModule = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Delete the module (cascades to sections, prerequisites, and progress)
    await prisma.trainingModule.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training module:', error);
    return NextResponse.json({ error: 'Failed to delete training module' }, { status: 500 });
  }
}