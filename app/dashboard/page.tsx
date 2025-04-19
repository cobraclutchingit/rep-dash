"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
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
      title: "Dashboard Updated",
      description: "Your sales dashboard has been refreshed with the latest data.",
      variant: "success",
    });
  };

  if (status === "loading" || isLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <TypographyH1>Dashboard</TypographyH1>
          <TypographyMuted>
            Welcome back, {session?.user?.name}. Here's your sales overview.
          </TypographyMuted>
        </div>
        <Button onClick={handleNotificationTest}>
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
            <p className="text-xs text-muted-foreground">
              +12.5% from last year
            </p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="completed" />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +4.3% from last month
            </p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="in-progress" />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.targetCompletion}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div 
                className="h-full rounded-full bg-primary" 
                style={{ width: `${stats.targetCompletion}%` }} 
              />
            </div>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="in-progress" />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeals}</div>
            <p className="text-xs text-muted-foreground">
              Estimated value: $42,500
            </p>
          </CardContent>
          <CardFooter className="pt-1">
            <StatusBadge status="scheduled" />
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
                <p className="text-sm text-muted-foreground">Acme Corp</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$18,500</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Premium Support Renewal</p>
                <p className="text-sm text-muted-foreground">Globex Inc</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$4,200</p>
                <p className="text-sm text-muted-foreground">Yesterday</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Product Demo Call</p>
                <p className="text-sm text-muted-foreground">Initech LLC</p>
              </div>
              <div className="text-right">
                <p className="font-medium">-</p>
                <p className="text-sm text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Activity</Button>
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
                <p className="text-sm text-muted-foreground">Massive Dynamic</p>
              </div>
              <StatusBadge status="scheduled">Tomorrow</StatusBadge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Contract Negotiation</p>
                <p className="text-sm text-muted-foreground">Stark Industries</p>
              </div>
              <StatusBadge status="scheduled">April 22</StatusBadge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <div>
                <p className="font-medium">Quarterly Review</p>
                <p className="text-sm text-muted-foreground">Internal Meeting</p>
              </div>
              <StatusBadge status="scheduled">April 23</StatusBadge>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View Calendar</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}