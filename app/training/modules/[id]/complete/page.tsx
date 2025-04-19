import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";

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
    title: `${module.title} Completed | Training Portal`,
    description: `You have successfully completed ${module.title}`,
  };
}

export default async function ModuleCompletePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = session.user.id;
  
  // Get the module
  const module = await prisma.trainingModule.findUnique({
    where: { id: params.id },
  });
  
  if (!module) {
    notFound();
  }
  
  // Get progress to confirm it's completed
  const progress = await prisma.trainingProgress.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId: module.id,
      },
    },
  });
  
  if (!progress || progress.status !== "COMPLETED") {
    redirect(`/training/modules/${module.id}`);
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
      id: { not: module.id },
      requiredFor: {
        some: {
          prerequisiteId: module.id,
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
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
          <p className="text-xl mb-6">
            You have successfully completed the <span className="font-semibold">{module.title}</span> module.
          </p>
          
          <div className="bg-card text-card-foreground rounded-lg shadow p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Certificate of Completion</h2>
            <p className="mb-6">
              This certifies that <span className="font-semibold">{session.user.name}</span> has successfully
              completed the {module.title} training on {progress.completedAt 
                ? new Date(progress.completedAt).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  }) 
                : new Date().toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}.
            </p>
            
            <Link
              href={progress.certificateUrl || `/api/training/certificates/${progress.id}`}
              target="_blank"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
            >
              View Certificate
            </Link>
          </div>
        </div>
        
        {recommendedModules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Recommended Next Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedModules.map((recModule) => (
                <Link 
                  key={recModule.id}
                  href={`/training/modules/${recModule.id}`}
                  className="bg-card text-card-foreground hover:bg-card/80 rounded-lg shadow p-4 flex flex-col items-center text-center"
                >
                  <h3 className="font-semibold mb-2">{recModule.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {recModule.description}
                  </p>
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {recModule.progress?.length ? 
                      recModule.progress[0].status === "COMPLETED" ? 
                        "Completed" : "In Progress" : 
                        "Not Started"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          <Link
            href="/training"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Back to Training
          </Link>
          
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}