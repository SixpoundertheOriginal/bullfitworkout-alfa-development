
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { typography } from '@/lib/typography';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export const FeatureCard = ({ icon, title, description, onClick }: FeatureCardProps) => (
  <Card 
    className="relative overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 hover:border-purple-500/30"
    onClick={onClick}
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-600/5 rounded-bl-full transform translate-x-5 -translate-y-5 group-hover:translate-x-0 group-hover:-translate-y-0 transition-all duration-300"></div>
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={typography.headings.h3}>{title}</h3>
          <p className={typography.text.secondary}>{description}</p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <span className="text-purple-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Explore <ArrowRight size={14} />
        </span>
      </div>
    </CardContent>
  </Card>
);
