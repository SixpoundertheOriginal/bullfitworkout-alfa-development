
import { useState, useCallback, useRef } from 'react';

export const useStopwatch = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [isRunning, elapsedTime]);

  const pause = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current!);
      setIsRunning(false);
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setElapsedTime(0);
  }, []);

  return {
    isRunning,
    elapsedTime,
    start,
    pause,
    reset
  };
};
