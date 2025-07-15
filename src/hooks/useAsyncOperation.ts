
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncOperation<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  options: AsyncOperationOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    successMessage = 'Operation completed successfully',
    errorMessage = 'An error occurred',
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await operation(...args);
        if (showSuccessToast) {
          toast({
            title: successMessage
          });
        }
        if (onSuccess) {
          onSuccess();
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (showErrorToast) {
          toast({
            title: errorMessage,
            description: error.message,
            variant: "destructive"
          });
        }
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [operation, successMessage, errorMessage, showSuccessToast, showErrorToast, onSuccess, onError]
  );

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * A helper hook specifically for delete operations
 */
export function useDeleteOperation<T extends (id: string) => Promise<any>>(
  deleteFunction: T,
  options: AsyncOperationOptions & {
    redirectPath?: string;
    navigate?: (path: string) => void;
  } = {}
) {
  const { redirectPath, navigate, ...restOptions } = options;
  
  const asyncOperation = useAsyncOperation(deleteFunction, {
    successMessage: options.successMessage || 'Item deleted successfully',
    errorMessage: options.errorMessage || 'Failed to delete item',
    onSuccess: () => {
      if (redirectPath && navigate) {
        navigate(redirectPath);
      }
      if (options.onSuccess) {
        options.onSuccess();
      }
    },
    ...restOptions
  });
  
  return asyncOperation;
}
