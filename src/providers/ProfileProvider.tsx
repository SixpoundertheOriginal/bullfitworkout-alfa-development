import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  weight?: number | null;
  weight_unit?: string | null;
  [key: string]: any;
}

interface ProfileContextValue {
  profile: UserProfile | null;
  bodyweightKg: number; // Canonical bodyweight in kg with 70kg fallback
  isLoading: boolean;
  error: Error | null;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is acceptable
    throw error;
  }

  return data;
}

function convertToKg(weight: number, unit: string = 'kg'): number {
  return unit === 'lbs' ? weight * 0.453592 : weight;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });

  // Canonical bodyweight calculation with memoization
  const bodyweightKg = useMemo(() => {
    if (!profile?.weight) {
      return 70; // Canonical fallback
    }
    
    return convertToKg(profile.weight, profile.weight_unit || 'kg');
  }, [profile?.weight, profile?.weight_unit]);

  const contextValue = useMemo(() => ({
    profile,
    bodyweightKg,
    isLoading,
    error: error as Error | null,
  }), [profile, bodyweightKg, isLoading, error]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

/**
 * Canonical hook for accessing user's bodyweight in kg
 * Always returns a number (70kg fallback)
 */
export function useBodyweightKg(): number {
  const { bodyweightKg } = useProfile();
  return bodyweightKg;
}