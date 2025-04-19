"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Sidebar, SidebarItemType } from "../navigation/sidebar";
import { UserNav } from "../navigation/user-nav";
import { MobileNav } from "../navigation/mobile-nav";

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: SidebarItemType[];
  title: string;
}

export function DashboardLayout({
  children,
  navItems,
  title,
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const userRole = user?.role as string | undefined;

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNav
        items={navItems}
        title={title}
        userRole={userRole}
        footer={user ? <UserNav user={user} /> : null}
      />

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0">
          <div className="flex flex-col flex-1 bg-card border-r h-screen">
            <div className="flex h-16 items-center border-b px-4">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <Sidebar items={navItems} userRole={userRole} />
            </div>
            {user && (
              <div className="border-t p-4">
                <UserNav user={user} />
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="md:pl-64 flex-1 w-full">
          <main className="max-w-7xl mx-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}