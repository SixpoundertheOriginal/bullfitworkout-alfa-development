
import React from 'react';
import { FeatureCard } from './FeatureCard';
import { Brain, Dumbbell, Notebook, ActivitySquare, FlaskConical } from "lucide-react";
import { darkModeText, getSectionHeadingClasses } from '@/lib/theme';

interface FeaturesSectionProps {
  onNavigate: (path: string) => void;
}

export const FeaturesSection = ({ onNavigate }: FeaturesSectionProps) => {
  return (
    <section className="animate-fade-in mb-8" style={{ animationDelay: '400ms' }}>
      <div className="flex justify-between items-center mb-4">
        <div className={getSectionHeadingClasses(true)}>
          <Brain className="text-purple-400" size={20} />
          <h2 className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Fitness Knowledge Hub
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard
          icon={<Dumbbell size={24} className="text-purple-400" />}
          title="Exercise Library"
          description="Browse detailed guides for 500+ exercises with proper form and technique"
          onClick={() => onNavigate('/exercises')}
        />
        <FeatureCard
          icon={<Notebook size={24} className="text-blue-400" />}
          title="Workout Templates"
          description="Pre-built routines for every fitness goal and experience level"
          onClick={() => onNavigate('/templates')}
        />
        <FeatureCard
          icon={<ActivitySquare size={24} className="text-green-400" />}
          title="Progress Insights"
          description="Visualize your gains and identify opportunities for improvement"
          onClick={() => onNavigate('/insights')}
        />
        <FeatureCard
          icon={<FlaskConical size={24} className="text-orange-400" />}
          title="Nutrition Science"
          description="Learn how to fuel your workouts and maximize recovery"
          onClick={() => onNavigate('/nutrition')}
        />
      </div>
    </section>
  );
};
