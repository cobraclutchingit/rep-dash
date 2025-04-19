import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ModuleEditForm from "@/app/training/admin/modules/components/module-edit-form";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const module = await prisma.trainingModule.findUnique({
    where: { id: params.id },
  });
  
  if (!module) {
    return {
      title: "Module Not Found | Training Admin",
    };
  }
  
  return {
    title: `Edit: ${module.title} | Training Admin`,
  };
}

export default async function EditModulePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has admin role
  if (session.user.role !== "ADMIN") {
    redirect("/training");
  }
  
  // Get the module with all its sections and prerequisites
  const module = await prisma.trainingModule.findUnique({
    where: { id: params.id },
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
  
  if (!module) {
    notFound();
  }
  
  // Get all modules for prerequisites selection
  const allModules = await prisma.trainingModule.findMany({
    where: {
      id: { not: params.id }, // Exclude the current module
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
    orderBy: [
      { category: "asc" },
      { title: "asc" },
    ],
  });
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-2 space-x-2">
        <Link 
          href="/training/admin" 
          className="text-muted-foreground hover:text-foreground"
        >
          Training Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>Edit Module</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Training Module</h1>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Link
            href={`/training/modules/${module.id}`}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Preview
          </Link>
          
          <Link
            href="/training/admin"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      <ModuleEditForm 
        module={module} 
        allModules={allModules} 
      />
    </div>
  );
}