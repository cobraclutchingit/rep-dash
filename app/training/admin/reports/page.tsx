import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import ReportGenerator from '@/app/training/admin/reports/components/report-generator';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Training Reports | Admin Dashboard',
  description: 'Generate and export training reports',
};

export default async function TrainingReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN') {
    redirect('/training');
  }

  // Get all modules for report filters
  const modules = await prisma.trainingModule.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
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
    orderBy: { name: 'asc' },
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
      id: '1',
      name: 'Monthly Training Completions',
      type: 'module_completions',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdBy: 'Admin User',
    },
    {
      id: '2',
      name: 'Sales Team Progress Report',
      type: 'user_progress',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      createdBy: 'Admin User',
    },
    {
      id: '3',
      name: 'New Hire Onboarding Completion',
      type: 'training_gap',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      createdBy: 'Admin User',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Training Reports</h1>
          <p className="text-muted-foreground">Generate custom training reports and export data</p>
        </div>
        <div className="mt-4 space-x-2 md:mt-0">
          <Link
            href="/training/admin/analytics"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            View Analytics
          </Link>
          <Link
            href="/training/admin"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Generate Report</h2>
            <ReportGenerator modules={modules} users={users} />
          </div>
        </div>

        <div>
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Recent Reports</h2>

            {sampleReports.length > 0 ? (
              <div className="space-y-3">
                {sampleReports.map((report) => (
                  <div key={report.id} className="hover:bg-muted/40 rounded-md border p-3">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{report.name}</h3>
                      <span className="text-muted-foreground text-xs">
                        {report.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {report.type
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">By: {report.createdBy}</span>
                      <button className="text-primary text-xs hover:underline">Download CSV</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent reports found.</p>
            )}
          </div>

          <div className="bg-card text-card-foreground mt-6 rounded-lg p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Scheduled Reports</h2>
            <p className="text-muted-foreground mb-4">
              Set up automatic reports to be generated and sent to specific users.
            </p>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2">
              Schedule a Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
