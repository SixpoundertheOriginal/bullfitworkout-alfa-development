
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuickSetupTemplates } from "@/hooks/useQuickSetupTemplates";
import { Clock, Star, Calendar, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickSetupTemplatesProps {
  onSelect: (config: {
    trainingType: string;
    tags: string[];
    duration: number;
  }) => void;
}

export function QuickSetupTemplates({ onSelect }: QuickSetupTemplatesProps) {
  const { templates, isLoading, generateDynamicTemplate } = useQuickSetupTemplates();
  
  // Always include a dynamic template
  const dynamicTemplate = generateDynamicTemplate();
  const allTemplates = [dynamicTemplate, ...templates.slice(0, 2)];
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {allTemplates.map((template, index) => (
        <Card
          key={template.name + index}
          className={cn(
            "bg-gray-800 hover:bg-gray-750 transition-all duration-300 cursor-pointer border border-gray-700",
            "group hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 overflow-hidden",
            template.is_system_generated && "border-purple-500/30"
          )}
          onClick={() => onSelect({
            trainingType: template.training_type,
            tags: template.tags,
            duration: template.duration
          })}
        >
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                {template.name}
              </h3>
              {template.is_system_generated && (
                <Star 
                  size={16} 
                  className="text-purple-400 absolute top-4 right-4" 
                  fill="currentColor" 
                />
              )}
            </div>
            
            <div className="text-sm text-gray-400 mb-3 pr-6">
              {template.description}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Dumbbell 
                  size={14} 
                  className="text-purple-400 flex-shrink-0" 
                />
                <span className="truncate">{template.training_type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock 
                  size={14} 
                  className="text-purple-400 flex-shrink-0" 
                />
                <span>{template.duration}m</span>
              </div>
              {template.time_of_day && (
                <div className="flex items-center gap-1">
                  <Calendar 
                    size={14} 
                    className="text-purple-400 flex-shrink-0" 
                  />
                  <span>{template.time_of_day}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
