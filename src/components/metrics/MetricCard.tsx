
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { theme, withTheme } from "@/lib/theme";
import { typography } from "@/lib/typography";

interface MetricCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  tooltip?: string;
  description?: string;
  progressValue?: number;
  gradientClass?: string;
  valueClass?: string;
  labelClass?: string;
  className?: string; // Added className prop
}

export const MetricCard = ({
  icon: Icon,
  value,
  label,
  tooltip,
  description,
  progressValue,
  gradientClass,
  valueClass,
  labelClass,
  className
}: MetricCardProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300",
            "bg-card card-gradient",
            gradientClass,
            "hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
            "min-w-[100px] w-full",
            "relative overflow-hidden",
            className // Added className to the classNames list
          )}
        >
          {/* Subtle glow effect in background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-80" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2 rounded-full bg-white/8 shadow-inner flex h-12 w-12 items-center justify-center">
              <Icon className={cn("h-6 w-6", theme.colors.text.accent)} />
            </div>

            {/* Value (prominent heading) */}
            <div
              className={cn(
                typography.headings.h3,
                "mt-1 text-center font-bold text-2xl", // Removed previously custom Tailwind only
                valueClass
              )}
            >
              {value}
            </div>

            {/* Label (subheading, muted) */}
            <div className={cn(
              typography.text.secondary,
              "text-center mt-1.5",
              labelClass
            )}>
              {label}
            </div>

            {/* Description (smaller text, optional) */}
            {description && (
              <div className={cn(
                typography.text.muted,
                "text-center text-xs mt-1"
              )}>
                {description}
              </div>
            )}

            {/* Progress (if present) */}
            {progressValue !== undefined && (
              <div className="w-full mt-3">
                <Progress
                  value={progressValue}
                  className="h-1.5 bg-gray-800/60 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent
          side="bottom"
          className={withTheme("bg-gray-900 border border-gray-800", theme.colors.text.light)}
        >
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  );
};
