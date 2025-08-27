import { useState, useEffect } from 'react';

/**
 * Custom hook for mobile web keyboard handling
 * Provides keyboard visibility state and height for better mobile UX
 */
export const useMobileKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    // Modern browsers with Visual Viewport API
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff);
        setIsKeyboardVisible(heightDiff > 150); // Threshold for keyboard detection
      };
      
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport.removeEventListener('resize', handleViewportChange);
    }
    
    // Fallback for older browsers
    const handleResize = () => {
      const heightDiff = window.screen.height - window.innerHeight;
      setIsKeyboardVisible(heightDiff > 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { keyboardHeight, isKeyboardVisible };
};