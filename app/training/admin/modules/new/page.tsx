import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NewModuleForm from "@/app/training/admin/modules/components/new-module-form";

export const metadata: Metadata = {
  title: "Create New Module | Training Admin",
  description: "Create a new training module for sales representatives",
};

export default async function NewModulePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has admin role
  if (session.user.role !== "ADMIN") {
    redirect("/training");
  }
  
  // Get modules for prerequisites selection
  const allModules = await prisma.trainingModule.findMany({
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
  
  // Get the highest order of existing modules to set a default for new module
  const highestOrder = await prisma.trainingModule.findFirst({
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });
  
  const nextOrder = highestOrder ? highestOrder.order + 1 : 1;
  
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
        <span>New Module</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Training Module</h1>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/training/admin"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      <NewModuleForm 
        allModules={allModules}
        nextOrder={nextOrder}
      />
    </div>
  );
}