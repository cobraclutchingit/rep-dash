import { Label } from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { ReactNode, ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

// Root form component
const Form = FormProvider;

// Form field component
interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  children: ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ children, ...props }: FormFieldProps<TFieldValues, TName>) {
  return <div className="space-y-2">{children}</div>;
}

// Form item component
export interface FormItemProps extends ComponentPropsWithoutRef<'div'> {}

export const FormItem = forwardRef<ElementRef<'div'>, FormItemProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('space-y-2', className)} {...props} />;
  }
);
FormItem.displayName = 'FormItem';

// Form label component
export interface FormLabelProps extends ComponentPropsWithoutRef<typeof Label> {}

export const FormLabel = forwardRef<ElementRef<typeof Label>, FormLabelProps>(
  ({ className, ...props }, ref) => {
    return <Label ref={ref} className={cn('text-sm font-medium', className)} {...props} />;
  }
);
FormLabel.displayName = 'FormLabel';

// Form control component
export interface FormControlProps extends ComponentPropsWithoutRef<'div'> {
  asChild?: boolean;
}

export const FormControl = forwardRef<ElementRef<'div'>, FormControlProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Component = asChild ? Slot : 'div';
    return <Component ref={ref} className={cn('', className)} {...props} />;
  }
);
FormControl.displayName = 'FormControl';

// Form description component
export interface FormDescriptionProps extends ComponentPropsWithoutRef<'p'> {}

export const FormDescription = forwardRef<ElementRef<'p'>, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-muted-foreground text-xs', className)} {...props} />;
  }
);
FormDescription.displayName = 'FormDescription';

// Form error message component
export interface FormMessageProps extends ComponentPropsWithoutRef<'p'> {
  name?: string;
}

export const FormMessage = forwardRef<ElementRef<'p'>, FormMessageProps>(
  ({ className, children, name, ...props }, ref) => {
    const { formState } = useFormContext();
    const fieldState = name ? formState.errors[name] : null;
    const message = fieldState?.message as string | undefined;

    return (
      <p
        ref={ref}
        className={cn('text-destructive font-medium text-xs', className)}
        {...props}
      >
        {children || message}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

export const formClasses = {
  input: 'text-foreground bg-background focus:ring-primary relative block w-full rounded-md border-0 px-3 py-2 ring-1 ring-inset ring-input focus:z-10 focus:ring-2 sm:text-sm sm:leading-6',
  label: 'mb-1 block text-sm font-medium',
  errorText: 'text-destructive font-medium text-xs mt-1',
  successText: 'text-green-600 font-medium text-xs mt-1',
};

export {
  Form,
}