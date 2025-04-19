import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Certificates | Training Portal",
  description: "View and download your training certificates",
};

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const userId = session.user.id;
  
  // Get certificates
  const certificates = await prisma.trainingProgress.findMany({
    where: { 
      userId,
      status: "COMPLETED",
      certificateIssued: true,
    },
    include: {
      module: true,
    },
    orderBy: { completedAt: "desc" },
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-muted-foreground">
            View and download your training achievement certificates
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
      
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-primary/5 flex items-center justify-center relative">
                <span className="text-6xl">🏆</span>
                <div className="absolute top-2 right-2">
                  {cert.module.isRequired && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Required
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{cert.module.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Category: {cert.module.category.replace(/_/g, " ")}
                </p>
                
                <div className="text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>
                      {cert.completedAt
                        ? new Date(cert.completedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  
                  {cert.quizScore && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <span>{Math.round(cert.quizScore)}%</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <Link
                    href={cert.certificateUrl || `/api/training/certificates/${cert.id}`}
                    target="_blank"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                  >
                    View Certificate
                  </Link>
                  
                  <Link
                    href={`/training/modules/${cert.moduleId}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Review Module
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card text-card-foreground rounded-lg shadow">
          <div className="h-20 w-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-4xl">🎓</span>
          </div>
          <h3 className="text-xl font-medium mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Complete training modules to earn certificates.
          </p>
          <Link
            href="/training"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Browse Training Modules
          </Link>
        </div>
      )}
    </div>
  );
}