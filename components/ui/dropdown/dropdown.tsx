'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'bg-card ring-opacity-5 absolute z-50 mt-2 w-56 rounded-md border shadow-lg ring-1 ring-black focus:outline-none',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  className,
  disabled = false,
}: DropdownItemProps) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={cn(
            active ? 'bg-secondary text-secondary-foreground' : 'text-foreground',
            'group flex w-full items-center px-4 py-2 text-sm',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          disabled={disabled}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />;
}
