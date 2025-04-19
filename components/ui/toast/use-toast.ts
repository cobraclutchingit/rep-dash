"use client";

import { toast as sonnerToast, ToastT } from "sonner";

type ToastProps = ToastT & {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function toast(props: ToastProps) {
  sonnerToast(props.title, {
    description: props.description,
    action: props.action
      ? {
          label: props.action.label,
          onClick: props.action.onClick,
        }
      : undefined,
    ...props,
  });
}

export function successToast(props: Omit<ToastProps, "variant">) {
  toast({ ...props, variant: "success" });
}

export function errorToast(props: Omit<ToastProps, "variant">) {
  toast({ ...props, variant: "error" });
}

export function warningToast(props: Omit<ToastProps, "variant">) {
  toast({ ...props, variant: "warning" });
}

export function infoToast(props: Omit<ToastProps, "variant">) {
  toast({ ...props, variant: "info" });
}