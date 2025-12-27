import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../api/auth';

export function useHeartbeat(isAuthenticated) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    sendHeartbeat().catch(console.error);
    intervalRef.current = setInterval(() => {
      sendHeartbeat().catch(console.error);
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);
}
