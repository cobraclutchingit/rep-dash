import { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    title: `${trainingModule.title} Completed | Training Portal`,
    description: `You have successfully completed ${trainingModule.title}`,
  };
}

export default async function ModuleCompletePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get the module
  const trainingModule = await prisma.trainingModule.findUnique({
    where: { id: params.id },
  });

  if (!trainingModule) {
    notFound();
  }

  // Get progress to confirm it's completed
  const progress = await prisma.trainingProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: trainingModule.id,
      },
    },
  });

  if (!progress || progress.status !== 'COMPLETED') {
    redirect(`/training/modules/${trainingModule.id}`);
  }

  // Update certificate if needed
  if (!progress.certificateIssued && !progress.certificateUrl) {
    // Generate certificate URL (in a real app, this might create a PDF)
    const certificateUrl = `/api/training/certificates/${progress.id}`;

    await prisma.trainingProgress.update({
      where: { id: progress.id },
      data: {
        certificateIssued: true,
        certificateUrl,
      },
    });
  }

  // Find next recommended modules
  const recommendedModules = await prisma.trainingModule.findMany({
    where: {
      isPublished: true,
      visibleToRoles: { has: session.user.role },
      ...(session.user.position && {
        visibleToPositions: { has: session.user.position },
      }),
      id: { not: trainingModule.id },
      requiredFor: {
        some: {
          prerequisiteId: trainingModule.id,
        },
      },
    },
    take: 3,
    include: {
      progress: {
        where: { userId },
      },
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8">
          <div className="bg-primary/10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full">
            <span className="text-6xl">🎉</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold">Congratulations!</h1>
          <p className="mb-6 text-xl">
            You have successfully completed the{' '}
            <span className="font-semibold">{trainingModule.title}</span> module.
          </p>

          <div className="bg-card text-card-foreground mb-8 rounded-lg p-8 shadow">
            <h2 className="mb-4 text-xl font-semibold">Certificate of Completion</h2>
            <p className="mb-6">
              This certifies that <span className="font-semibold">{session.user.name}</span> has
              successfully completed the {trainingModule.title} training on{' '}
              {progress.completedAt
                ? new Date(progress.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              .
            </p>

            <Link
              href={progress.certificateUrl || `/api/training/certificates/${progress.id}`}
              target="_blank"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-md px-6 py-3"
            >
              View Certificate
            </Link>
          </div>
        </div>

        {recommendedModules.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Recommended Next Steps</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recommendedModules.map((recModule) => (
                <Link
                  key={recModule.id}
                  href={`/training/modules/${recModule.id}`}
                  className="bg-card text-card-foreground hover:bg-card/80 flex flex-col items-center rounded-lg p-4 text-center shadow"
                >
                  <h3 className="mb-2 font-semibold">{recModule.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                    {recModule.description}
                  </p>
                  <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                    {recModule.progress?.length
                      ? recModule.progress[0].status === 'COMPLETED'
                        ? 'Completed'
                        : 'In Progress'
                      : 'Not Started'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Link
            href="/training"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Back to Training
          </Link>

          <Link
            href="/dashboard"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
