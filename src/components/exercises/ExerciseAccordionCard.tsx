
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronDown, ChevronUp, Dumbbell, Target, BarChart2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Exercise } from "@/types/exercise";
import { typography } from '@/lib/typography';
import { Badge } from "@/components/ui/badge";

const MAX_DESCRIPTION_LENGTH = 150; // Increased from 80

interface ExerciseAccordionCardProps {
  exercise: Exercise;
  expanded: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExerciseAccordionCard({
  exercise,
  expanded,
  onEdit,
  onDelete,
  onSelect,
}: ExerciseAccordionCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onSelect(exercise);
  };

  const truncateDescription = (text: string) => {
    if (!text) return "";
    if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
    return `${text.slice(0, MAX_DESCRIPTION_LENGTH)}...`;
  };

  // Badge color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return "bg-green-700/30 text-green-400 border-green-800/50";
      case 'intermediate':
        return "bg-blue-700/30 text-blue-400 border-blue-800/50";
      case 'advanced':
        return "bg-orange-700/30 text-orange-400 border-orange-800/50";
      case 'expert':
        return "bg-red-700/30 text-red-300 border-red-800/50";
      default:
        return "bg-gray-700/30 text-gray-300 border-gray-700/50";
    }
  };

  return (
    <AccordionItem value={exercise.id} className="mb-3 border-none">
      <Card 
        tabIndex={0}
        className="bg-gray-900/70 border-gray-700/50 hover:bg-gray-800/80 transition-all cursor-pointer outline-none ring-0 overflow-hidden"
        onClick={handleCardClick}
        aria-expanded={expanded}
      >
        <AccordionTrigger className="w-full p-0 !no-underline focus:outline-none select-none">
          <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className={typography.headings.h4 + " truncate"}>{exercise.name}</h3>
                <Badge variant="outline" className={getDifficultyColor(exercise.difficulty)}>
                  {exercise.difficulty}
                </Badge>
                {exercise.is_compound && (
                  <Badge variant="outline" className="bg-purple-700/30 text-purple-300 border-purple-800/50">
                    compound
                  </Badge>
                )}
              </div>
              <p className={typography.text.muted + " line-clamp-2"}>
                {truncateDescription(exercise.description || '')}
              </p>
              
              <div className="flex gap-3 mt-2 items-center flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Target className="h-3.5 w-3.5 text-purple-400/90" />
                  <span className="capitalize">
                    {exercise.primary_muscle_groups[0] || "General"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Dumbbell className="h-3.5 w-3.5 text-blue-400/90" />
                  <span className="capitalize">
                    {exercise.equipment_type[0] || "No equipment"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <BarChart2 className="h-3.5 w-3.5 text-green-400/90" />
                  <span className="capitalize">
                    {exercise.movement_pattern || "General"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onEdit(exercise.id); }}
                className="text-white bg-gray-800 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onDelete(exercise.id); }}
                className="bg-red-900/50 hover:bg-red-800 text-white"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              {expanded ? 
                <ChevronUp className="w-5 h-5 text-purple-300 ml-1" /> :
                <ChevronDown className="w-5 h-5 text-gray-400 ml-1" />
              }
            </div>
          </CardContent>
        </AccordionTrigger>

        <AccordionContent>
          <div className="bg-gray-900/80 px-5 py-4 rounded-b-lg border-t border-gray-700/50 text-gray-200">
            <div className="grid gap-6">
              {/* Description Section */}
              <div className="space-y-2">
                <label className={typography.special.accent + " block font-medium"}>Description</label>
                <p className={typography.text.secondary + " whitespace-pre-wrap"}>
                  {exercise.description || "No description available"}
                </p>
              </div>

              {/* Muscle Groups Grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={typography.special.accent + " block font-medium"}>Primary Muscles</label>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primary_muscle_groups.length > 0 ? 
                      exercise.primary_muscle_groups.map(muscle => (
                        <Badge key={muscle} 
                          className="px-2 py-1 bg-purple-900/30 hover:bg-purple-900/40 
                                   text-purple-200 border border-purple-700/30 capitalize">
                          {muscle}
                        </Badge>
                      )) : 
                      <span className="text-gray-400 text-sm">None specified</span>
                    }
                  </div>
                </div>

                {exercise.secondary_muscle_groups?.length > 0 && (
                  <div className="space-y-2">
                    <label className={typography.special.accent + " block font-medium"}>Secondary Muscles</label>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.secondary_muscle_groups.map(muscle => (
                        <Badge key={muscle} 
                          className="px-2 py-1 bg-gray-800/50 hover:bg-gray-800/70 
                                   text-gray-300 border border-gray-700/30 capitalize">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Equipment & Difficulty */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={typography.special.accent + " block font-medium"}>Equipment</label>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.equipment_type.length > 0 ?
                      exercise.equipment_type.map(equipment => (
                        <Badge key={equipment} 
                          className="px-2 py-1 bg-blue-900/20 hover:bg-blue-900/30 
                                   text-blue-200 border border-blue-800/30 capitalize">
                          {equipment}
                        </Badge>
                      )) :
                      <span className="text-gray-400 text-sm">None required</span>
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className={typography.special.accent + " block font-medium"}>Movement Pattern</label>
                  <span className="px-2 py-1 bg-green-900/20 hover:bg-green-900/30 
                                 text-green-200 border border-green-800/30 rounded capitalize inline-block">
                    {exercise.movement_pattern || "Not specified"}
                  </span>
                </div>
              </div>

              {/* Instructions & Tips in Grid */}
              <div className="grid sm:grid-cols-2 gap-5">
                {exercise.instructions && Object.keys(exercise.instructions).length > 0 && (
                  <div className="space-y-2">
                    <label className={typography.special.accent + " block font-medium"}>Instructions</label>
                    <div className={typography.text.secondary + " space-y-2"}>
                      {typeof exercise.instructions === "string" ? (
                        <p>{exercise.instructions}</p>
                      ) : (
                        <ol className="list-decimal ml-5 space-y-1">
                          {Object.entries(exercise.instructions).map(([key, value]) => (
                            <li key={key}>{value}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}

                {exercise.tips?.length > 0 && (
                  <div className="space-y-2">
                    <label className={typography.special.accent + " block font-medium"}>Tips</label>
                    <ul className="list-disc ml-5 space-y-1">
                      {exercise.tips.map((tip, i) => (
                        <li key={i} className={typography.text.secondary}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Variations */}
              {exercise.variations?.length > 0 && (
                <div className="space-y-2">
                  <label className={typography.special.accent + " block font-medium"}>Variations</label>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.variations.map((variation, i) => (
                      <Badge key={i} 
                        className="px-2 py-1 bg-gray-800/70 hover:bg-gray-800/90 
                                 text-gray-200 border border-gray-700/50">
                        {variation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
