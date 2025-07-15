
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Exercise } from '@/types/exercise';

export interface TrainingConfig {
  trainingType: string;
  tags: string[];
  duration: number;
  timeOfDay?: string;
  intensity?: number;
  rankedExercises?: {
    recommended: Exercise[];
    other: Exercise[];
    matchData: Record<string, { score: number, reasons: string[] }>;
  };
  lastUpdated?: string;
}

const STORAGE_KEY = 'training_setup_';

export function useTrainingSetupPersistence() {
  const [storedConfig, setStoredConfig] = useState<TrainingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load stored config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        const key = `${STORAGE_KEY}${user.id}`;
        const savedConfig = localStorage.getItem(key);
        
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          // Check if config is older than 24 hours
          const timestamp = new Date(parsed.lastUpdated || 0);
          const isExpired = (new Date().getTime() - timestamp.getTime()) > 24 * 60 * 60 * 1000;
          
          if (isExpired) {
            localStorage.removeItem(key);
          } else {
            setStoredConfig(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading training configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);
  
  // Save config to localStorage
  const saveConfig = async (config: TrainingConfig) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const key = `${STORAGE_KEY}${user.id}`;
      const configWithTimestamp = {
        ...config,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(configWithTimestamp));
      setStoredConfig(configWithTimestamp);
    } catch (error) {
      console.error("Error saving training configuration:", error);
    }
  };
  
  // Clear stored config
  const clearConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const key = `${STORAGE_KEY}${user.id}`;
      localStorage.removeItem(key);
      setStoredConfig(null);
    } catch (error) {
      console.error("Error clearing training configuration:", error);
    }
  };
  
  return {
    storedConfig,
    isLoading,
    saveConfig,
    clearConfig
  };
}
