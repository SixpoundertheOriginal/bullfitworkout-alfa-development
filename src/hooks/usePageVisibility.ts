
import { useState, useEffect } from 'react';

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState<boolean>(
    document ? document.visibilityState === 'visible' : true
  );
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      console.log('Visibility changed:', { 
        isVisible: visible, 
        state: document.visibilityState 
      });
      setIsVisible(visible);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check
    setIsVisible(document.visibilityState === 'visible');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return { isVisible };
}
