import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'My Certificates | Training Portal',
  description: 'View and download your training certificates',
};

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get certificates
  const certificates = await prisma.trainingProgress.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      certificateIssued: true,
    },
    include: {
      module: true,
    },
    orderBy: { completedAt: 'desc' },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-muted-foreground">
            View and download your training achievement certificates
          </p>
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

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-card text-card-foreground overflow-hidden rounded-lg shadow"
            >
              <div className="bg-primary/5 relative flex h-40 items-center justify-center">
                <span className="text-6xl">🏆</span>
                <div className="absolute top-2 right-2">
                  {cert.module.isRequired && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                      Required
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="mb-1 text-lg font-semibold">{cert.module.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Category: {cert.module.category.replace(/_/g, ' ')}
                </p>

                <div className="mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>
                      {cert.completedAt ? new Date(cert.completedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {cert.quizScore && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <span>{Math.round(cert.quizScore)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    href={cert.certificateUrl || `/api/training/certificates/${cert.id}`}
                    target="_blank"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm"
                  >
                    View Certificate
                  </Link>

                  <Link
                    href={`/training/modules/${cert.moduleId}`}
                    className="text-primary text-sm hover:underline"
                  >
                    Review Module
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card text-card-foreground rounded-lg py-12 text-center shadow">
          <div className="bg-muted mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="text-4xl">🎓</span>
          </div>
          <h3 className="mb-2 text-xl font-medium">No Certificates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete training modules to earn certificates.
          </p>
          <Link
            href="/training"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            Browse Training Modules
          </Link>
        </div>
      )}
    </div>
  );
}
