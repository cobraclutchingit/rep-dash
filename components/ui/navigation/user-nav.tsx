'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

import { useTheme } from '@/components/providers/theme-provider';

import { Dropdown, DropdownItem, DropdownSeparator } from '../dropdown';

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
        <button className="hover:bg-secondary flex items-center space-x-2 rounded-md p-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <span>{user?.name?.[0] || 'U'}</span>
            )}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-muted-foreground max-w-[150px] truncate text-xs">{user?.email}</p>
          </div>
        </button>
      }
    >
      <div className="p-2">
        <p className="text-sm font-medium">{user?.name || 'User'}</p>
        <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
      </div>
      <DropdownSeparator />
      <DropdownItem>
        <Link href="/profile" className="w-full text-left">
          Profile
        </Link>
      </DropdownItem>
      <DropdownItem>
        <Link href="/change-password" className="w-full text-left">
          Change Password
        </Link>
      </DropdownItem>
      <DropdownSeparator />
      <div className="px-2 py-1.5">
        <p className="mb-1.5 text-xs font-medium">Theme</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTheme('light')}
            className={`rounded-md p-1.5 ${
              theme === 'light' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            aria-label="Light mode"
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`rounded-md p-1.5 ${
              theme === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            aria-label="Dark mode"
          >
            🌙
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`rounded-md p-1.5 ${
              theme === 'system' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            aria-label="System preference"
          >
            💻
          </button>
        </div>
      </div>
      <DropdownSeparator />
      <DropdownItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive">
        Log out
      </DropdownItem>
    </Dropdown>
  );
}
