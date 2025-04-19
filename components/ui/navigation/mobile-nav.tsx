"use client";

import { useState, useEffect, Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { SidebarItemType } from "./sidebar";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  items: SidebarItemType[];
  title: string;
  userRole?: string;
  footer?: React.ReactNode;
}

export function MobileNav({ items, title, userRole, footer }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = items.filter(
    (item) => !item.requiresAdmin || userRole === "admin"
  );

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b md:hidden">
        <Link href="/dashboard" className="text-xl font-bold">
          {title}
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md hover:bg-secondary"
          aria-label="Open mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-card shadow-lg transition-transform">
                <div className="flex h-screen flex-col">
                  <div className="flex items-center justify-between p-4 border-b">
                    <Dialog.Title className="text-xl font-bold">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-md hover:bg-secondary"
                      aria-label="Close mobile menu"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 flex-grow overflow-y-auto">
                    <nav className="space-y-2">
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
                  </div>
                  {footer && <div className="p-4 border-t">{footer}</div>}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}