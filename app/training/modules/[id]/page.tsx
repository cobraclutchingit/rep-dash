import { TrainingModule as PrismaTrainingModule } from '@prisma/client';
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ModuleContent from '@/app/training/modules/[id]/components/module-content';
import ModuleHeader from '@/app/training/modules/[id]/components/module-header';
import ModuleNavigation from '@/app/training/modules/[id]/components/module-navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// TrainingModule imported but not used directly

// Use a more complete interface definition
interface TrainingModuleWithSections {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  visibleToRoles: string[];
  visibleToPositions: string[];
  isRequired: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
  estimatedDuration: number | null;
  // Extended with extra fields from the include query
  sections: {
    id: string;
    title: string;
    content: string;
    contentFormat: 'HTML' | 'MARKDOWN' | 'VIDEO' | 'PDF' | 'QUIZ';
    order: number;
    isOptional: boolean;
    resources: unknown[];
    quizQuestions: {
      id: string;
      question: string;
      questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
      explanation: string | null;
      points: number;
      options: {
        id: string;
        text: string;
        isCorrect: boolean;
      }[];
    }[];
  }[];
  prerequisites: {
    id: string;
    moduleId: string;
    prerequisiteId: string;
    prerequisite: {
      id: string;
      title: string;
    };
  }[];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const trainingModule = await prisma.trainingModule.findUnique({
    where: { id: params.id },
  });

  if (!trainingModule) {
    return {
      title: 'Module Not Found | Training Portal',
    };
  }

  return {
    title: `${trainingModule.title} | Training Portal`,
    description: trainingModule.description,
  };
}

export default async function ModulePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get the module with all its sections
  const trainingModule = await prisma.trainingModule.findUnique({
    where: {
      id: params.id,
      isPublished: true,
      visibleToRoles: { has: session.user.role },
      ...(session.user.position && {
        visibleToPositions: { has: session.user.position },
      }),
    },
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
          prerequisite: true,
        },
      },
    },
  });

  if (!trainingModule) {
    notFound();
  }

  // Get or create user progress record
  let progress = await prisma.trainingProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: trainingModule.id,
      },
    },
  });

  if (!progress) {
    // Create a new progress record if one doesn't exist
    progress = await prisma.trainingProgress.create({
      data: {
        userId,
        moduleId: trainingModule.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        currentSection: 0,
      },
    });
  } else if (progress.status === 'NOT_STARTED') {
    // Update progress if user is starting the module
    progress = await prisma.trainingProgress.update({
      where: { id: progress.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });
  } else {
    // Update last accessed timestamp
    progress = await prisma.trainingProgress.update({
      where: { id: progress.id },
      data: {
        lastAccessedAt: new Date(),
      },
    });
  }

  // Check prerequisites if they're not completed
  const prerequisitesMet = await checkPrerequisites(trainingModule, userId);

  return (
    <div className="container mx-auto p-6">
      <ModuleHeader
        module={trainingModule}
        progress={progress}
        prerequisitesMet={prerequisitesMet}
      />

      {!prerequisitesMet ? (
        <div className="bg-destructive/10 text-destructive my-6 rounded-lg p-6">
          <h3 className="mb-2 text-lg font-semibold">Prerequisites Not Completed</h3>
          <p className="mb-4">You need to complete the following modules first:</p>
          <ul className="list-inside list-disc space-y-1">
            {trainingModule.prerequisites.map(({ prerequisite }) => (
              <li key={prerequisite.id}>
                <a
                  href={`/training/modules/${prerequisite.id}`}
                  className="hover:text-destructive/80 underline"
                >
                  {prerequisite.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ModuleNavigation
            moduleId={trainingModule.id}
            sections={trainingModule.sections}
            currentSection={progress.currentSection || 0}
          />

          <ModuleContent
            moduleId={trainingModule.id}
            section={{
              ...trainingModule.sections[progress.currentSection || 0],
              // Cast contentFormat to expected format
              contentFormat: trainingModule.sections[progress.currentSection || 0].contentFormat as
                | 'HTML'
                | 'MARKDOWN'
                | 'VIDEO'
                | 'PDF'
                | 'QUIZ',
              // Transform quizQuestions to match expected format
              quizQuestions: trainingModule.sections[
                progress.currentSection || 0
              ].quizQuestions.map((q) => ({
                ...q,
                questionType: q.questionType as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED',
                options: q.options.map((o) => ({
                  id: o.id,
                  text: o.text,
                  isCorrect: o.isCorrect,
                })),
              })),
            }}
            progress={progress}
            totalSections={trainingModule.sections.length}
          />
        </>
      )}
    </div>
  );
}

async function checkPrerequisites(
  trainingModule: { prerequisites: Array<{ prerequisite: { id: string } }> }, // Properly typed
  userId: string
): Promise<boolean> {
  // If no prerequisites, return true
  if (trainingModule.prerequisites.length === 0) {
    return true;
  }

  // Check if all prerequisites are completed
  const prerequisiteIds = trainingModule.prerequisites.map((p) => p.prerequisite.id);

  const completedPrerequisites = await prisma.trainingProgress.count({
    where: {
      userId,
      moduleId: { in: prerequisiteIds },
      status: 'COMPLETED',
    },
  });

  return completedPrerequisites === prerequisiteIds.length;
}
