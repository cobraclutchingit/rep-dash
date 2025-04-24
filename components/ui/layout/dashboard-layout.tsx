'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

import { MobileNav } from '../navigation/mobile-nav';
import { Sidebar, SidebarItemType } from '../navigation/sidebar';
import { UserNav } from '../navigation/user-nav';

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: SidebarItemType[];
  title: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
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
        <div className="fixed inset-y-0 hidden md:flex md:w-64 md:flex-col">
          <div className="bg-card flex h-screen flex-1 flex-col border-r">
            <div className="flex h-16 items-center border-b px-4">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
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
        <div className="w-full flex-1 md:pl-64">
          <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
