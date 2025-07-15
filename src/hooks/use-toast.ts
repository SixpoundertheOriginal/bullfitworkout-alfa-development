
import * as React from "react"
import { toast as sonnerToast, type ExternalToast } from "sonner"

// Define the toast message cache to prevent duplicates
const recentToasts = new Map<string, number>();
const TOAST_EXPIRY_TIME = 3000; // 3 seconds

export interface ToastProps extends ExternalToast {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

function toast(message: string | ToastProps) {
  // If message is just a string, convert it to our ToastProps format
  const props = typeof message === 'string' 
    ? { title: message } as ToastProps
    : message;
  
  const { title, description, ...options } = props;
  
  // Create a message key for duplicate detection
  const messageKey = `${title || ''}-${description || ''}`;
  
  // Check if this exact toast was shown recently
  const lastShownTime = recentToasts.get(messageKey);
  const currentTime = Date.now();
  
  if (lastShownTime && currentTime - lastShownTime < TOAST_EXPIRY_TIME) {
    // Skip this toast as it's a duplicate within the time window
    return;
  }
  
  // Record this toast message with current timestamp
  recentToasts.set(messageKey, currentTime);
  
  // Clean up old entries from the cache to prevent memory leaks
  setTimeout(() => {
    if (recentToasts.has(messageKey)) {
      recentToasts.delete(messageKey);
    }
  }, TOAST_EXPIRY_TIME);
  
  return sonnerToast(title as React.ReactNode, {
    ...options,
    description,
  });
}

// Add convenience methods
toast.error = (title: string, options?: Omit<ToastProps, "title">) => {
  return toast({
    title,
    variant: "destructive",
    ...options,
  });
};

toast.success = (title: string, options?: Omit<ToastProps, "title">) => {
  return toast({
    title,
    ...options,
  });
};

toast.info = (title: string, options?: Omit<ToastProps, "title">) => {
  return toast({
    title,
    ...options,
  });
};

toast.warning = (title: string, options?: Omit<ToastProps, "title">) => {
  return toast({
    title,
    ...options,
  });
};

// Forward these methods directly from sonner
toast.dismiss = sonnerToast.dismiss;
toast.promise = sonnerToast.promise;
toast.custom = sonnerToast.custom;
toast.loading = sonnerToast.loading;
toast.message = sonnerToast.message;

// Create a useToast hook that returns the toast function
export function useToast() {
  return {
    toast
  };
}

export { toast };
