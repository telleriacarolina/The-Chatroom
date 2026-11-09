/**
 * useAsync Hook
 * 
 * A general-purpose hook for managing async operations with loading and error states.
 * Similar to useApiRequest but for any async operation, not just API calls.
 * 
 * @example
 * ```typescript
 * const { execute, isLoading, error, value } = useAsync(async () => {
 *   const data = await someAsyncOperation();
 *   return data;
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAsyncOptions<T = any> {
  /**
   * If true, execute the async function immediately on mount
   */
  immediate?: boolean;
  
  /**
   * Callback invoked when the async operation succeeds
   */
  onSuccess?: (data: T) => void | Promise<void>;
  
  /**
   * Callback invoked when the async operation fails
   */
  onError?: (error: Error) => void | Promise<void>;
}

export interface UseAsyncResult<T = any> {
  /**
   * Execute the async operation
   */
  execute: () => Promise<T | undefined>;
  
  /**
   * Whether the operation is currently in progress
   */
  isLoading: boolean;
  
  /**
   * Error if the operation failed, null otherwise
   */
  error: Error | null;
  
  /**
   * The value returned from the async operation
   */
  value: T | null;
  
  /**
   * Reset the state
   */
  reset: () => void;
}

/**
 * Hook for managing async operations with loading and error states
 * 
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns Object containing execute function, loading state, error, and value
 */
export function useAsync<T = any>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncResult<T> {
  const [isLoading, setIsLoading] = useState(options.immediate ?? false);
  const [error, setError] = useState<Error | null>(null);
  const [value, setValue] = useState<T | null>(null);
  
  const isMountedRef = useRef(true);

  // Stabilize options callbacks with refs to avoid recreating execute
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<T | undefined> => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        setValue(result);
        await onSuccessRef.current?.(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (isMountedRef.current) {
        setError(error);
        await onErrorRef.current?.(error);
      }
      
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [asyncFunction, isLoading]);

  const executeRef = useRef(execute);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  // Execute immediately if requested.
  // Use a ref to call the latest execute implementation without re-running
  // this effect whenever execute identity changes.
  useEffect(() => {
    if (options.immediate) {
      executeRef.current();
    }
  }, [options.immediate]); // Only re-run if immediate option changes

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setValue(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    value,
    reset,
  };
}
