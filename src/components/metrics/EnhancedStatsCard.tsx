
import React from "react";
import { BaseCard } from "@/components/ui/BaseCard";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/typography";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

const EnhancedStatsCardComponent = ({ 
  title, 
  value, 
  icon, 
  description, 
  className = "" 
}: StatsCardProps) => {
  return (
    <BaseCard className={className}>
      <div className="flex justify-between items-start">
        <div>
          <p className={cn(typography.text.secondary, "mb-1")}>{title}</p>
          <p className={cn(typography.headings.h3)}>{value}</p>
          {description && (
            <p className={cn(typography.text.muted, "mt-1")}>{description}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-gray-800 text-purple-400">
          {icon}
        </div>
      </div>
    </BaseCard>
  );
};

export const EnhancedStatsCard = React.memo(EnhancedStatsCardComponent);
