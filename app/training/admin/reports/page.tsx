import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ReportGenerator from "@/app/training/admin/reports/components/report-generator";

export const metadata: Metadata = {
  title: "Training Reports | Admin Dashboard",
  description: "Generate and export training reports",
};

export default async function TrainingReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Check if user has admin role
  if (session.user.role !== "ADMIN") {
    redirect("/training");
  }
  
  // Get all modules for report filters
  const modules = await prisma.trainingModule.findMany({
    orderBy: [
      { category: "asc" },
      { title: "asc" },
    ],
    select: {
      id: true,
      title: true,
      category: true,
    },
  });
  
  // Get all users for report filters
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
    },
  });
  
  // Recent reports (in a real app, these would be stored reports)
  const sampleReports = [
    {
      id: "1",
      name: "Monthly Training Completions",
      type: "module_completions",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdBy: "Admin User",
    },
    {
      id: "2",
      name: "Sales Team Progress Report",
      type: "user_progress",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      createdBy: "Admin User",
    },
    {
      id: "3",
      name: "New Hire Onboarding Completion",
      type: "training_gap",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      createdBy: "Admin User",
    },
  ];
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Training Reports</h1>
          <p className="text-muted-foreground">
            Generate custom training reports and export data
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Link
            href="/training/admin/analytics"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            View Analytics
          </Link>
          <Link
            href="/training/admin"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Back to Admin
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
            <ReportGenerator 
              modules={modules}
              users={users}
            />
          </div>
        </div>
        
        <div>
          <div className="bg-card text-card-foreground rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
            
            {sampleReports.length > 0 ? (
              <div className="space-y-3">
                {sampleReports.map((report) => (
                  <div key={report.id} className="p-3 border rounded-md hover:bg-muted/40">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{report.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {report.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {report.type.replace(/_/g, " ")}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        By: {report.createdBy}
                      </span>
                      <button className="text-xs text-primary hover:underline">
                        Download CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No recent reports found.
              </p>
            )}
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Scheduled Reports</h2>
            <p className="text-muted-foreground mb-4">
              Set up automatic reports to be generated and sent to specific users.
            </p>
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Schedule a Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}