
import React from "react";
import { Calendar, Dumbbell, Timer, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/metrics/StatCard";
import { SectionHeader } from "@/components/profile/SectionHeader";

interface StatsSectionProps {
  totalWorkouts: number;
  totalSets: number;
  averageDuration: number;
  totalDuration: number;
}

export function StatsSection({
  totalWorkouts,
  totalSets,
  averageDuration,
  totalDuration,
}: StatsSectionProps) {
  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <SectionHeader title="Stats Overview" navigateTo="/overview" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <StatCard 
          icon={<Calendar className="h-5 w-5 text-purple-400" />}
          label="Total Workouts"
          value={totalWorkouts.toString()}
          className="hover:border-purple-800 transition-colors"
        />
        <StatCard 
          icon={<Dumbbell className="h-5 w-5 text-purple-400" />}
          label="Total Sets"
          value={totalSets.toString()}
          className="hover:border-purple-800 transition-colors"
        />
        <StatCard 
          icon={<Timer className="h-5 w-5 text-purple-400" />}
          label="Avg. Duration"
          value={formatTime(averageDuration)}
          className="hover:border-purple-800 transition-colors"
        />
        <StatCard 
          icon={<Flame className="h-5 w-5 text-purple-400" />}
          label="Total Time"
          value={`${Math.floor(totalDuration / 60)} min`}
          className="hover:border-purple-800 transition-colors"
        />
      </div>
    </Card>
  );
}
