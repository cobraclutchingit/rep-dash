"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Dropdown, DropdownItem, DropdownSeparator } from "../dropdown";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Dropdown
      trigger={
        <button className="flex items-center space-x-2 rounded-md p-2 hover:bg-secondary">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <span>{user?.name?.[0] || "U"}</span>
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user?.email}
            </p>
          </div>
        </button>
      }
    >
      <div className="p-2">
        <p className="text-sm font-medium">{user?.name || "User"}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>
      <DropdownSeparator />
      <DropdownItem>
        <Link href="/profile" className="w-full text-left">
          Profile
        </Link>
      </DropdownItem>
      <DropdownItem>
        <Link href="/auth/change-password" className="w-full text-left">
          Change Password
        </Link>
      </DropdownItem>
      <DropdownSeparator />
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium mb-1.5">Theme</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme("light")}
            className={`p-1.5 rounded-md ${
              theme === "light" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary"
            }`}
            aria-label="Light mode"
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-1.5 rounded-md ${
              theme === "dark" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary"
            }`}
            aria-label="Dark mode"
          >
            🌙
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-1.5 rounded-md ${
              theme === "system" 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-secondary"
            }`}
            aria-label="System preference"
          >
            💻
          </button>
        </div>
      </div>
      <DropdownSeparator />
      <DropdownItem
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="text-destructive"
      >
        Log out
      </DropdownItem>
    </Dropdown>
  );
}