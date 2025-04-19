import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ProgressTable from "@/app/training/my-progress/components/progress-table";

export const metadata: Metadata = {
  title: "My Progress | Training Portal",
  description: "Track your training progress and achievements",
};

export default async function MyProgressPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = session.user.id;
  
  // Get user's progress on all modules
  const userProgress = await prisma.trainingProgress.findMany({
    where: { userId },
    include: {
      module: true,
    },
    orderBy: [
      { status: "asc" },  // NOT_STARTED, then IN_PROGRESS, then COMPLETED
      { lastAccessedAt: "desc" },
    ],
  });
  
  // Calculate statistics
  const totalModules = userProgress.length;
  const completedModules = userProgress.filter(p => p.status === "COMPLETED").length;
  const inProgressModules = userProgress.filter(p => p.status === "IN_PROGRESS").length;
  const notStartedModules = totalModules - completedModules - inProgressModules;
  
  const progressPercentage = totalModules > 0 
    ? Math.round((completedModules / totalModules) * 100) 
    : 0;
  
  // Get certificates
  const certificates = userProgress
    .filter(p => p.certificateIssued && p.certificateUrl)
    .map(p => ({
      id: p.id,
      moduleTitle: p.module.title,
      completedAt: p.completedAt,
      certificateUrl: p.certificateUrl,
    }));
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Training Progress</h1>
          <p className="text-muted-foreground">
            Track your training achievements and progress
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/training"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Back to Training
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Overall Progress</h3>
          <div className="w-full bg-secondary rounded-full h-4 mb-2">
            <div 
              className="bg-primary h-4 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-2xl font-bold">{progressPercentage}%</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
          <p className="text-2xl font-bold">{completedModules}</p>
          <p className="text-xs text-muted-foreground">
            out of {totalModules} modules
          </p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h3>
          <p className="text-2xl font-bold">{inProgressModules}</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Not Started</h3>
          <p className="text-2xl font-bold">{notStartedModules}</p>
        </div>
      </div>
      
      {certificates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="font-semibold mb-1">{cert.moduleTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed on {cert.completedAt 
                      ? new Date(cert.completedAt).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
                <div className="p-4">
                  <Link
                    href={cert.certificateUrl || "#"}
                    target="_blank"
                    className="w-full text-center py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium inline-block"
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
        <h2 className="text-xl font-semibold mb-4">All Modules</h2>
        <ProgressTable progress={userProgress} />
      </div>
    </div>
  );
}