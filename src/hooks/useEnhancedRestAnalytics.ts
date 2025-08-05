
import { useState, useCallback, useRef } from 'react';
import { useRestTimeAnalytics } from './useRestTimeAnalytics';

interface RestSession {
  exerciseName: string;
  setNumber: number;
  plannedRestTime: number;
  startTime: number;
  endTime?: number;
  actualRestTime?: number;
  wasOptimal?: boolean;
}

interface RestAnalytics {
  totalRestTime: number;
  averageRestTime: number;
  optimalRestPercentage: number;
  restEfficiencyScore: number;
  recommendations: string[];
}

export const useEnhancedRestAnalytics = () => {
  const [restSessions, setRestSessions] = useState<RestSession[]>([]);
  const { logRestTime } = useRestTimeAnalytics();
  const activeRestRef = useRef<RestSession | null>(null);

  const startRestTimer = useCallback((exerciseName: string, setNumber: number, plannedRestTime: number) => {
    // End any active rest session first
    if (activeRestRef.current && !activeRestRef.current.endTime) {
      endRestTimer();
    }

    const restSession: RestSession = {
      exerciseName,
      setNumber,
      plannedRestTime,
      startTime: Date.now(),
    };

    activeRestRef.current = restSession;
    setRestSessions(prev => [...prev, restSession]);
  }, []);

  const endRestTimer = useCallback(async () => {
    if (!activeRestRef.current || activeRestRef.current.endTime) return;

    const endTime = Date.now();
    const actualRestTime = Math.floor((endTime - activeRestRef.current.startTime) / 1000);
    const wasOptimal = Math.abs(actualRestTime - activeRestRef.current.plannedRestTime) <= 15; // 15 second tolerance

    const completedSession = {
      ...activeRestRef.current,
      endTime,
      actualRestTime,
      wasOptimal,
    };

    // Update the session in state
    setRestSessions(prev => {
      const updatedSessions = prev.map(session => 
        session === activeRestRef.current ? completedSession : session
      );
      
      // Store completed rest sessions in localStorage for workout save integration
      try {
        const completedSessions = updatedSessions.filter(s => s.actualRestTime !== undefined);
        localStorage.setItem('rest-analytics-sessions', JSON.stringify(completedSessions));
        console.log('📊 Rest analytics saved to localStorage');
      } catch (error) {
        console.warn('Failed to save rest analytics to localStorage:', error);
      }
      
      return updatedSessions;
    });

    // Log to analytics service
    await logRestTime({
      exerciseName: completedSession.exerciseName,
      plannedRestTime: completedSession.plannedRestTime,
      actualRestTime,
      performanceImpact: wasOptimal ? 1 : 0,
    });

    activeRestRef.current = null;
    return completedSession;
  }, [logRestTime]);

  const getRestAnalytics = useCallback((): RestAnalytics => {
    const completedSessions = restSessions.filter(s => s.actualRestTime !== undefined);
    
    if (completedSessions.length === 0) {
      return {
        totalRestTime: 0,
        averageRestTime: 0,
        optimalRestPercentage: 0,
        restEfficiencyScore: 0,
        recommendations: [],
      };
    }

    const totalRestTime = completedSessions.reduce((sum, s) => sum + (s.actualRestTime || 0), 0);
    const averageRestTime = totalRestTime / completedSessions.length;
    const optimalSessions = completedSessions.filter(s => s.wasOptimal).length;
    const optimalRestPercentage = (optimalSessions / completedSessions.length) * 100;

    // Calculate efficiency score (0-100)
    let efficiencyScore = optimalRestPercentage;
    
    // Bonus for consistency
    const restVariance = completedSessions.reduce((variance, session) => {
      const diff = (session.actualRestTime || 0) - averageRestTime;
      return variance + (diff * diff);
    }, 0) / completedSessions.length;
    
    const consistencyBonus = Math.max(0, 20 - (restVariance / 100)); // Lower variance = higher bonus
    efficiencyScore = Math.min(100, efficiencyScore + consistencyBonus);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (optimalRestPercentage < 60) {
      recommendations.push("Try to stick closer to planned rest times for better consistency");
    }
    
    if (averageRestTime > 90) {
      recommendations.push("Consider reducing rest times to improve workout density");
    }
    
    if (averageRestTime < 45) {
      recommendations.push("You might benefit from slightly longer rest periods for better recovery");
    }

    if (restVariance > 400) { // High variance
      recommendations.push("Work on consistency - try to maintain similar rest times between sets");
    }

    return {
      totalRestTime,
      averageRestTime,
      optimalRestPercentage,
      restEfficiencyScore: efficiencyScore,
      recommendations,
    };
  }, [restSessions]);

  const getCurrentRestTime = useCallback(() => {
    if (!activeRestRef.current || activeRestRef.current.endTime) return 0;
    return Math.floor((Date.now() - activeRestRef.current.startTime) / 1000);
  }, []);

  const getOptimalRestSuggestion = useCallback((exerciseName: string, currentSetNumber: number) => {
    // Get historical data for this exercise
    const exerciseData = restSessions.filter(s => 
      s.exerciseName === exerciseName && s.actualRestTime !== undefined
    );

    if (exerciseData.length === 0) {
      // Default suggestions based on exercise type
      if (exerciseName.toLowerCase().includes('squat') || 
          exerciseName.toLowerCase().includes('deadlift')) {
        return 120; // Compound movements need more rest
      }
      return 60; // Default for isolation exercises
    }

    // Calculate optimal based on previous performance
    const avgRestTime = exerciseData.reduce((sum, s) => sum + (s.actualRestTime || 0), 0) / exerciseData.length;
    const optimalSessions = exerciseData.filter(s => s.wasOptimal);
    
    if (optimalSessions.length > 0) {
      const optimalAvg = optimalSessions.reduce((sum, s) => sum + (s.actualRestTime || 0), 0) / optimalSessions.length;
      return Math.round(optimalAvg);
    }

    return Math.round(avgRestTime);
  }, [restSessions]);

  const resetAnalytics = useCallback(() => {
    setRestSessions([]);
    activeRestRef.current = null;
    
    // Clear localStorage as well
    try {
      localStorage.removeItem('rest-analytics-sessions');
      console.log('📊 Rest analytics cleared from localStorage');
    } catch (error) {
      console.warn('Failed to clear rest analytics from localStorage:', error);
    }
  }, []);

  return {
    startRestTimer,
    endRestTimer,
    getRestAnalytics,
    getCurrentRestTime,
    getOptimalRestSuggestion,
    resetAnalytics,
    activeRestSession: activeRestRef.current,
    restSessions,
  };
};
