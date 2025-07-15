
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WeightUnit } from "@/utils/unitConversion";
import { toast } from "@/hooks/use-toast";
import { createContext } from "@/utils/createContext";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useAuth } from "./AuthContext";

interface WeightUnitContextType {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  saveWeightUnitPreference: () => Promise<void>;
  isDefaultUnit: boolean;
  isLoading: boolean;
}

const [WeightUnitProvider, useWeightUnit] = createContext<WeightUnitContextType>();

export { useWeightUnit, WeightUnitProvider };

export const WeightUnitContextProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { user } = useAuth();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [defaultWeightUnit, setDefaultWeightUnit] = useState<WeightUnit>("kg");
  const { isLoading, withLoading } = useLoadingState(true);

  // Fetch user's preferred weight unit from profile
  useEffect(() => {
    const fetchWeightUnitPreference = async () => {
      if (!user) {
        return;
      }

      try {
        // Changed from .single() to .maybeSingle() to handle the case where no profile exists
        const { data, error } = await supabase
          .from("user_profiles")
          .select("weight_unit")
          .eq("id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching weight unit preference:", error);
          return;
        }

        // If data exists, use its weight_unit, otherwise fallback to "kg"
        const userWeightUnit = data?.weight_unit as WeightUnit || "kg";
        setWeightUnit(userWeightUnit);
        setDefaultWeightUnit(userWeightUnit);
        
        console.log(`[WeightUnit] Loaded user preference: ${userWeightUnit}`);
      } catch (error) {
        console.error("Error fetching weight unit preference:", error);
        // If there's an error, fall back to "kg"
        setWeightUnit("kg");
        setDefaultWeightUnit("kg");
      }
    };

    withLoading(fetchWeightUnitPreference());
  }, [user, withLoading]);

  const saveWeightUnitPreference = async () => {
    if (!user) return;

    try {
      // Try to update the profile if it exists, otherwise insert a new one
      const { error } = await supabase
        .from("user_profiles")
        .upsert({ 
          id: user.id, 
          weight_unit: weightUnit 
        });

      if (error) throw error;
      
      setDefaultWeightUnit(weightUnit);
      toast({ 
        title: "Success",
        description: "Weight unit preference saved" 
      });
      
      console.log(`[WeightUnit] Saved user preference: ${weightUnit}`);
    } catch (error) {
      console.error("Error saving weight unit preference:", error);
      toast({
        title: "Failed to save weight unit preference",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <WeightUnitProvider 
      value={{ 
        weightUnit, 
        setWeightUnit, 
        saveWeightUnitPreference,
        isDefaultUnit: weightUnit === defaultWeightUnit,
        isLoading
      }}
    >
      {!isLoading && children}
    </WeightUnitProvider>
  );
};
