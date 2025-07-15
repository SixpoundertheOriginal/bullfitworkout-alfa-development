
/**
 * Enhanced storage utility for working with localStorage with fallbacks
 */
export const Storage = {
  /**
   * Get an item from localStorage with error handling
   */
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  
  /**
   * Set an item in localStorage with error handling
   */
  set: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error setting item in storage:', error);
      
      // Try to clear some space if we hit a quota error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Try to remove old items to make space
        try {
          const keysToPreserve = ['workout_in_progress']; // Keep critical data
          
          // Get all keys in localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const itemKey = localStorage.key(i);
            if (itemKey && !keysToPreserve.includes(itemKey)) {
              localStorage.removeItem(itemKey);
            }
          }
          
          // Try again after clearing space
          localStorage.setItem(key, value);
          return true;
        } catch (fallbackError) {
          console.error('Failed to make space in localStorage:', fallbackError);
        }
      }
      
      return false;
    }
  },
  
  /**
   * Remove an item from localStorage with error handling
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  },
  
  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};
