"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  showClose = true,
  size = "md",
}: ModalProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[90vw] max-h-[90vh]",
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "w-full transform rounded-lg bg-card p-6 text-left align-middle shadow-xl transition-all",
                  sizeClasses[size],
                  className
                )}
              >
                {showClose && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                    aria-label="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}

                {title && (
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-foreground"
                  >
                    {title}
                  </Dialog.Title>
                )}

                {description && (
                  <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                )}

                <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}