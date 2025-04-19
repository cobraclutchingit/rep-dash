import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminModuleList from "@/app/training/admin/components/admin-module-list";
import AdminStats from "@/app/training/admin/components/admin-stats";

export const metadata: Metadata = {
  title: "Training Administration | Sales Rep Dashboard",
  description: "Manage training modules and monitor user progress",
};

export default async function TrainingAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has admin role
  if (session.user.role !== "ADMIN") {
    redirect("/training");
  }
  
  // Get training modules with progress count
  const modules = await prisma.trainingModule.findMany({
    orderBy: [
      { category: "asc" },
      { order: "asc" },
    ],
    include: {
      _count: {
        select: {
          progress: true,
          sections: true,
        },
      },
    },
  });
  
  // Get overall training statistics
  const totalPublishedModules = modules.filter(m => m.isPublished).length;
  const totalSections = modules.reduce((acc, module) => acc + module._count.sections, 0);
  
  const totalProgress = await prisma.trainingProgress.count();
  const totalCompletions = await prisma.trainingProgress.count({
    where: { status: "COMPLETED" },
  });
  
  const usersCount = await prisma.user.count({
    where: { isActive: true },
  });
  
  const usersWithTraining = await prisma.user.count({
    where: {
      isActive: true,
      trainingProgress: {
        some: {},
      },
    },
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Training Administration</h1>
          <p className="text-muted-foreground">
            Manage training content and monitor user progress
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Link
            href="/training/admin/modules/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create Module
          </Link>
          <Link
            href="/training"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            View Portal
          </Link>
        </div>
      </div>
      
      <AdminStats 
        totalPublishedModules={totalPublishedModules}
        totalSections={totalSections}
        totalCompletions={totalCompletions}
        totalProgress={totalProgress}
        usersCount={usersCount}
        usersWithTraining={usersWithTraining}
      />
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-2xl font-semibold">Training Modules</h2>
          <div className="mt-2 md:mt-0 space-x-2">
            <Link
              href="/training/admin/analytics"
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
            >
              Analytics
            </Link>
            <Link
              href="/training/admin/reports"
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
            >
              Reports
            </Link>
          </div>
        </div>
        
        <AdminModuleList modules={modules} />
      </div>
    </div>
  );
}