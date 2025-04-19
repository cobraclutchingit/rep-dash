"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SidebarItemType {
  name: string;
  path: string;
  icon: React.ReactNode;
  requiresAdmin?: boolean;
}

interface SidebarProps {
  items: SidebarItemType[];
  className?: string;
  userRole?: string;
}

export function Sidebar({ items, className, userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = items.filter(
    (item) => !item.requiresAdmin || userRole === "admin"
  );

  return (
    <nav className={cn("space-y-2", className)}>
      {filteredItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.path
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
          )}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}