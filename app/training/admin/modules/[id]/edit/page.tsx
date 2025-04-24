import { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ModuleEditForm from '@/app/training/admin/modules/components/module-edit-form';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const trainingModule = await prisma.trainingModule.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!trainingModule) {
    return {
      title: 'Module Not Found | Training Admin',
    };
  }

  return {
    title: `Edit: ${trainingModule.title} | Training Admin`,
  };
}

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN') {
    redirect('/training');
  }

  // Get the module with all its sections and prerequisites
  const trainingModule = await prisma.trainingModule.findUnique({
    where: { id: resolvedParams.id },
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
    },
  });

  if (!trainingModule) {
    notFound();
  }

  // Get all modules for prerequisites selection
  const allModules = await prisma.trainingModule.findMany({
    where: {
      id: { not: resolvedParams.id }, // Exclude the current module
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-2 flex items-center space-x-2">
        <Link href="/training/admin" className="text-muted-foreground hover:text-foreground">
          Training Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>Edit Module</span>
      </div>

      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <h1 className="text-3xl font-bold">Edit Training Module</h1>

        <div className="mt-4 flex space-x-2 md:mt-0">
          <Link
            href={`/training/modules/${trainingModule.id}`}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Preview
          </Link>

          <Link
            href="/training/admin"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </div>

      <ModuleEditForm module={trainingModule} allModules={allModules} />
    </div>
  );
}