'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { Loading } from '@/components/ui/loading';
import { toast } from '@/components/ui/toast';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    thisMonth: 0,
    targetCompletion: 0,
    pendingDeals: 0,
  });

  useEffect(() => {
    // Simulate API request
    setTimeout(() => {
      setStats({
        totalSales: 127500,
        thisMonth: 24300,
        targetCompletion: 67,
        pendingDeals: 4,
      });
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleNotificationTest = () => {
    toast({
      title: 'Dashboard Updated',
      description: 'Your sales dashboard has been refreshed with the latest data.',
      variant: 'success',
    });
  };

  if (status === 'loading' || isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
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
        <Button onClick={handleNotificationTest}>Refresh Dashboard</Button>
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
            <Button variant="outline" className="w-full">
              View All Activity
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
            <Button variant="outline" className="w-full">
              View Calendar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
