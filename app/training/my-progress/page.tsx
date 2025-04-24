import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ProgressTable from '@/app/training/my-progress/components/progress-table';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'My Progress | Training Portal',
  description: 'Track your training progress and achievements',
};

export default async function MyProgressPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get user's progress on all modules
  const userProgress = await prisma.trainingProgress.findMany({
    where: { userId },
    include: {
      module: true,
    },
    orderBy: [
      { status: 'asc' }, // NOT_STARTED, then IN_PROGRESS, then COMPLETED
      { lastAccessedAt: 'desc' },
    ],
  });

  // Calculate statistics
  const totalModules = userProgress.length;
  const completedModules = userProgress.filter((p) => p.status === 'COMPLETED').length;
  const inProgressModules = userProgress.filter((p) => p.status === 'IN_PROGRESS').length;
  const notStartedModules = totalModules - completedModules - inProgressModules;

  const progressPercentage =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Get certificates
  const certificates = userProgress
    .filter((p) => p.certificateIssued && p.certificateUrl)
    .map((p) => ({
      id: p.id,
      moduleTitle: p.module.title,
      completedAt: p.completedAt,
      certificateUrl: p.certificateUrl,
    }));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">My Training Progress</h1>
          <p className="text-muted-foreground">Track your training achievements and progress</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/training"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Back to Training
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Overall Progress</h3>
          <div className="bg-secondary mb-2 h-4 w-full rounded-full">
            <div
              className="bg-primary h-4 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-2xl font-bold">{progressPercentage}%</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Completed</h3>
          <p className="text-2xl font-bold">{completedModules}</p>
          <p className="text-muted-foreground text-xs">out of {totalModules} modules</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">In Progress</h3>
          <p className="text-2xl font-bold">{inProgressModules}</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Not Started</h3>
          <p className="text-2xl font-bold">{notStartedModules}</p>
        </div>
      </div>

      {certificates.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">My Certificates</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-card text-card-foreground overflow-hidden rounded-lg shadow"
              >
                <div className="border-b p-6">
                  <h3 className="mb-1 font-semibold">{cert.moduleTitle}</h3>
                  <p className="text-muted-foreground text-sm">
                    Completed on{' '}
                    {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-4">
                  <Link
                    href={cert.certificateUrl || '#'}
                    target="_blank"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block w-full rounded-md py-2 text-center text-sm font-medium"
                  >
                    View Certificate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">All Modules</h2>
        <ProgressTable progress={userProgress} />
      </div>
    </div>
  );
}
