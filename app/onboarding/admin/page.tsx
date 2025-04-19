import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageOnboarding } from "@/lib/utils/permissions";
import prisma from "@/lib/prisma";
import AdminOnboardingTabs from "../components/admin/admin-onboarding-tabs";

export const metadata: Metadata = {
  title: "Onboarding Administration | Sales Rep Dashboard",
  description: "Manage onboarding tracks and steps",
};

export default async function OnboardingAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has permission to manage onboarding
  if (!canManageOnboarding(session)) {
    redirect("/onboarding");
  }
  
  // Get all onboarding tracks
  const tracks = await prisma.onboardingTrack.findMany({
    include: {
      steps: {
        orderBy: {
          order: "asc",
        },
        include: {
          resources: true,
        },
      },
      _count: {
        select: {
          steps: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  
  // Get all resources
  const resources = await prisma.resource.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  
  // Get user progress statistics
  const userStats = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      createdAt: true,
      onboardingProgress: {
        select: {
          id: true,
          status: true,
          completedAt: true,
          step: {
            select: {
              id: true,
              title: true,
              trackId: true,
            },
          },
        },
      },
    },
  });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Onboarding Administration</h1>
      
      <AdminOnboardingTabs 
        tracks={tracks} 
        resources={resources}
        userStats={userStats}
      />
    </div>
  );
}