'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorBoundary, ErrorUI } from '@/components/ui/error-boundary';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/components/ui/toast';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useAuth } from '@/lib/hooks/use-auth';
import { trackDbQuery } from '@/lib/utils/metrics';

// Types for dashboard stats
interface DashboardStats {
  totalSales: number;
  thisMonth: number;
  targetCompletion: number;
  pendingDeals: number;
}

// Dashboard content component
function DashboardContent() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    thisMonth: 0,
    targetCompletion: 0,
    pendingDeals: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user) return;
      
      try {
        // Simulate API request with performance tracking
        const startTime = performance.now();
        
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalSales: 127500,
          thisMonth: 24300,
          targetCompletion: 67,
          pendingDeals: 4,
        });
        
        // Track query duration
        const duration = (performance.now() - startTime) / 1000;
        trackDbQuery('query', 'dashboard_stats', duration);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
        console.error('Error loading dashboard:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user]);

  const handleNotificationTest = () => {
    toast({
      title: 'Dashboard Updated',
      description: 'Your sales dashboard has been refreshed with the latest data.',
      variant: 'success',
    });
  };

  if (authLoading || isDataLoading) {
    return <Loading text="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <ErrorUI 
        error={error} 
        reset={() => {
          setError(null);
          setIsDataLoading(true);
          router.refresh();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1>Dashboard</TypographyH1>
          <TypographyMuted>
            Welcome back, {session?.user?.name}. Here&apos;s your sales overview.
          </TypographyMuted>
        </div>
        <Button onClick={handleNotificationTest} data-testid="refresh-dashboard">
          Refresh Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">+12.5% from last year</p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="completed">Completed</StatusBadge>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonth.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">+4.3% from last month</p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="in-progress">In Progress</StatusBadge>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.targetCompletion}%</div>
            <div className="bg-secondary mt-2 h-2 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${stats.targetCompletion}%` }}
                role="progressbar"
                aria-valuenow={stats.targetCompletion}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="in-progress">In Progress</StatusBadge>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeals}</div>
            <p className="text-muted-foreground text-xs">Estimated value: $42,500</p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="scheduled">Scheduled</StatusBadge>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest sales and customer interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Enterprise Solutions Deal</p>
                <p className="text-muted-foreground text-sm">Acme Corp</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$18,500</p>
                <p className="text-muted-foreground text-sm">Today</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Premium Support Renewal</p>
                <p className="text-muted-foreground text-sm">Globex Inc</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$4,200</p>
                <p className="text-muted-foreground text-sm">Yesterday</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Product Demo Call</p>
                <p className="text-muted-foreground text-sm">Initech LLC</p>
              </div>
              <div className="text-right">
                <p className="font-medium">-</p>
                <p className="text-muted-foreground text-sm">2 days ago</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/activity">View All Activity</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Client Presentation</p>
                <p className="text-muted-foreground text-sm">Massive Dynamic</p>
              </div>
              <StatusBadge status="scheduled">Tomorrow</StatusBadge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Contract Negotiation</p>
                <p className="text-muted-foreground text-sm">Stark Industries</p>
              </div>
              <StatusBadge status="scheduled">April 22</StatusBadge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Quarterly Review</p>
                <p className="text-muted-foreground text-sm">Internal Meeting</p>
              </div>
              <StatusBadge status="scheduled">April 23</StatusBadge>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Client-side auth guard with custom hook
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }
  
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
