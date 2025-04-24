import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { z } from 'zod';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseZodFormProps<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodType<T>;
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseZodFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  status: FormStatus;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  resetStatus: () => void;
}

/**
 * Custom form hook that integrates React Hook Form with Zod validation
 * and handles submission state
 */
export function useZodForm<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  ...formConfig
}: UseZodFormProps<T>): UseZodFormReturn<T> {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formConfig,
  });

  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    return form.handleSubmit(async (values) => {
      try {
        setStatus('loading');
        setError(null);
        await onSubmit(values);
        setStatus('success');
        onSuccess?.();
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(err as Error);
      }
    })(e);
  };

  const resetStatus = () => {
    setStatus('idle');
    setError(null);
  };

  return {
    ...form,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    handleSubmit,
    resetStatus,
  };
}