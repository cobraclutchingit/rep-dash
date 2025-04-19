import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ModuleHeader from "@/app/training/modules/[id]/components/module-header";
import ModuleContent from "@/app/training/modules/[id]/components/module-content";
import ModuleNavigation from "@/app/training/modules/[id]/components/module-navigation";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const module = await prisma.trainingModule.findUnique({
    where: { id: params.id },
  });
  
  if (!module) {
    return {
      title: "Module Not Found | Training Portal",
    };
  }
  
  return {
    title: `${module.title} | Training Portal`,
    description: module.description,
  };
}

export default async function ModulePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = session.user.id;
  
  // Get the module with all its sections
  const module = await prisma.trainingModule.findUnique({
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
        orderBy: { order: "asc" },
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
  
  if (!module) {
    notFound();
  }
  
  // Get or create user progress record
  let progress = await prisma.trainingProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: module.id,
      },
    },
  });
  
  if (!progress) {
    // Create a new progress record if one doesn't exist
    progress = await prisma.trainingProgress.create({
      data: {
        userId,
        moduleId: module.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        currentSection: 0,
      },
    });
  } else if (progress.status === "NOT_STARTED") {
    // Update progress if user is starting the module
    progress = await prisma.trainingProgress.update({
      where: { id: progress.id },
      data: {
        status: "IN_PROGRESS",
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
  const prerequisitesMet = await checkPrerequisites(module, userId);
  
  return (
    <div className="container mx-auto p-6">
      <ModuleHeader 
        module={module} 
        progress={progress}
        prerequisitesMet={prerequisitesMet}
      />
      
      {!prerequisitesMet ? (
        <div className="bg-destructive/10 text-destructive rounded-lg p-6 my-6">
          <h3 className="text-lg font-semibold mb-2">Prerequisites Not Completed</h3>
          <p className="mb-4">You need to complete the following modules first:</p>
          <ul className="list-disc list-inside space-y-1">
            {module.prerequisites.map(({ prerequisite }) => (
              <li key={prerequisite.id}>
                <a 
                  href={`/training/modules/${prerequisite.id}`} 
                  className="underline hover:text-destructive/80"
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
            moduleId={module.id} 
            sections={module.sections}
            currentSection={progress.currentSection || 0}
          />
          
          <ModuleContent 
            moduleId={module.id}
            section={module.sections[progress.currentSection || 0]}
            progress={progress}
            totalSections={module.sections.length}
          />
        </>
      )}
    </div>
  );
}

async function checkPrerequisites(module: any, userId: string): Promise<boolean> {
  // If no prerequisites, return true
  if (module.prerequisites.length === 0) {
    return true;
  }
  
  // Check if all prerequisites are completed
  const prerequisiteIds = module.prerequisites.map((p: any) => p.prerequisite.id);
  
  const completedPrerequisites = await prisma.trainingProgress.count({
    where: {
      userId,
      moduleId: { in: prerequisiteIds },
      status: "COMPLETED",
    },
  });
  
  return completedPrerequisites === prerequisiteIds.length;
}