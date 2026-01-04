/**
 * useApiRequest Hook
 * 
 * A custom React hook that manages loading, error, and data state for API requests.
 * This hook implements the canonical loading-state ownership pattern by:
 * - Preventing double submissions
 * - Managing loading and error states
 * - Providing callbacks for success/error handling
 * 
 * @example
 * ```typescript
 * const { execute, isLoading, error, data } = useApiRequest(
 *   authApi.signin,
 *   {
 *     onSuccess: (result) => router.push('/dashboard'),
 *     onError: (err) => console.error('Login failed:', err)
 *   }
 * );
 * 
 * // In your component
 * <LoginForm onSubmit={execute} isLoading={isLoading} error={error} />
 * ```
 */

import { useState, useCallback, useRef } from 'react';

export interface UseApiRequestOptions<T = any> {
  /**
   * Callback invoked when the API request succeeds
   */
  onSuccess?: (data: T) => void | Promise<void>;
  
  /**
   * Callback invoked when the API request fails
   */
  onError?: (error: Error) => void | Promise<void>;
  
  /**
   * Callback invoked when the API request completes (success or failure)
   */
  onComplete?: () => void | Promise<void>;
}

export interface UseApiRequestResult<T = any> {
  /**
   * Execute the API request with the given arguments
   */
  execute: (...args: any[]) => Promise<T | undefined>;
  
  /**
   * Whether the request is currently in progress
   */
  isLoading: boolean;
  
  /**
   * Error message if the request failed, null otherwise
   */
  error: string | null;
  
  /**
   * The data returned from the API request, null if not yet loaded
   */
  data: T | null;
  
  /**
   * Reset the hook state (loading, error, data)
   */
  reset: () => void;
}

/**
 * Hook for managing API request state with loading, error, and data tracking
 * 
 * @param apiFunction - The API function to call (should be a Promise)
 * @param options - Configuration options for success/error callbacks
 * @returns Object containing execute function, loading state, error, and data
 */
export function useApiRequest<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Memoize the execute function to avoid unnecessary re-renders
  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      // Prevent double submission
      if (isLoading) {
        console.warn('Request already in progress, ignoring duplicate submission');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setData(result);
          await options.onSuccess?.(result);
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Request failed';
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(errorMessage);
          await options.onError?.(err as Error);
        }
        
        // Re-throw to allow caller to handle if needed
        throw err;
      } finally {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsLoading(false);
          await options.onComplete?.();
        }
      }
    },
    [apiFunction, isLoading, options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}
