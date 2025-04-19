import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TrainingModuleCard from "@/app/training/components/training-module-card";
import TrainingHeader from "@/app/training/components/training-header";
import TrainingFilters from "@/app/training/components/training-filters";
import { TrainingCategory } from "@prisma/client";

export const metadata: Metadata = {
  title: "Training | Sales Rep Dashboard",
  description: "Access your training materials and courses",
};

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; search?: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = session.user.id;
  
  // Get user's overall training progress
  const userTrainingProgress = await prisma.trainingProgress.findMany({
    where: { userId },
    include: { module: true },
  });
  
  const totalModules = await prisma.trainingModule.count({
    where: {
      isPublished: true,
      visibleToRoles: { has: session.user.role },
      ...(session.user.position && {
        visibleToPositions: { has: session.user.position },
      }),
    },
  });
  
  const completedModules = userTrainingProgress.filter(
    (progress) => progress.status === "COMPLETED"
  ).length;
  
  const inProgressModules = userTrainingProgress.filter(
    (progress) => progress.status === "IN_PROGRESS"
  ).length;
  
  // Calculate overall progress percentage
  const progressPercentage = 
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  
  // Apply filters from searchParams
  const categoryFilter = searchParams.category as TrainingCategory | undefined;
  const statusFilter = searchParams.status;
  const searchQuery = searchParams.search;
  
  // Get the training modules
  const trainingModules = await prisma.trainingModule.findMany({
    where: {
      isPublished: true,
      visibleToRoles: { has: session.user.role },
      ...(session.user.position && {
        visibleToPositions: { has: session.user.position },
      }),
      ...(categoryFilter && { category: categoryFilter }),
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { order: "asc" },
    include: {
      progress: {
        where: { userId },
      },
    },
  });
  
  // Filter by status if needed
  const filteredModules = statusFilter
    ? trainingModules.filter((module) => {
        if (module.progress.length === 0) {
          return statusFilter === "NOT_STARTED";
        }
        return module.progress[0].status === statusFilter;
      })
    : trainingModules;
    
  // Group modules by category
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<TrainingCategory, typeof trainingModules>);
  
  return (
    <div className="container mx-auto p-6">
      <TrainingHeader 
        totalModules={totalModules}
        completedModules={completedModules} 
        inProgressModules={inProgressModules}
        progressPercentage={progressPercentage}
      />
      
      <TrainingFilters />
      
      {Object.entries(modulesByCategory).length > 0 ? (
        Object.entries(modulesByCategory).map(([category, modules]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 capitalize">{category.replace(/_/g, " ").toLowerCase()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <TrainingModuleCard 
                  key={module.id}
                  module={module}
                  progress={module.progress[0]}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No training modules found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}
    </div>
  );
}