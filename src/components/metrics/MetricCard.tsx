
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
  className?: string;
  onClick?: () => void;
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
  className,
  onClick
}: MetricCardProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300",
            "relative overflow-hidden group",
            "min-w-[100px] w-full",
            onClick && "cursor-pointer",
            className
          )}
          style={{
            background: `
              linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%),
              linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)
            `,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.1)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
          }}
          onClick={onClick}
        >
          {/* Inner highlight overlay */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
            }}
          />

          {/* Premium glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)',
              filter: 'blur(1px)'
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <div 
              className="mb-2 rounded-full shadow-inner flex h-12 w-12 items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Icon 
                className="h-6 w-6"
                style={{ color: 'rgba(139,92,246,0.8)' }}
              />
            </div>

            {/* Value (prominent heading) */}
            <div
              className={cn(
                "mt-1 text-center font-bold text-2xl",
                "bg-gradient-to-br from-white via-white to-purple-200 bg-clip-text text-transparent",
                valueClass
              )}
            >
              {value}
            </div>

            {/* Label (subheading, muted) */}
            <div 
              className={cn(
                "text-center mt-1.5 text-sm",
                labelClass
              )}
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {label}
            </div>

            {/* Description (smaller text, optional) */}
            {description && (
              <div 
                className="text-center text-xs mt-1"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {description}
              </div>
            )}

            {/* Progress (if present) */}
            {progressValue !== undefined && (
              <div className="w-full mt-3">
                <Progress
                  value={progressValue}
                  className="h-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent
          side="bottom"
          className="bg-gray-900 border border-gray-800 text-white"
        >
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  );
};
