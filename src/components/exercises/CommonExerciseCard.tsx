
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Exercise } from '@/types/exercise';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ExerciseCardVariant = 'workout-add' | 'library-manage';

interface CommonExerciseCardProps {
  exercise: Exercise;
  variant: ExerciseCardVariant;
  onAdd?: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onViewDetails?: (exercise: Exercise) => void;
  onDuplicate?: (exercise: Exercise) => void;
}

export const CommonExerciseCard: React.FC<CommonExerciseCardProps> = ({
  exercise,
  variant,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
  onDuplicate
}) => {
  return (
    <Card className="bg-gray-900 border-gray-800 transition-all hover:border-gray-700">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg">{exercise.name}</h3>
            {exercise.difficulty && (
              <Badge variant="outline" className="bg-gray-800">
                {exercise.difficulty}
              </Badge>
            )}
          </div>
          
          {exercise.primary_muscle_groups && exercise.primary_muscle_groups.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {exercise.primary_muscle_groups.map((muscle) => (
                <Badge key={muscle} variant="secondary" className="text-xs">
                  {muscle}
                </Badge>
              ))}
            </div>
          )}
          
          {exercise.equipment_type && exercise.equipment_type.length > 0 && (
            <div className="text-sm text-gray-400">
              Equipment: {exercise.equipment_type.join(', ')}
            </div>
          )}
          
          <div className="flex justify-end mt-2">
            {variant === 'workout-add' && (
              <Button
                onClick={() => onAdd?.(exercise)}
                size="sm"
                variant="outline"
                className="h-9 px-3 rounded-full bg-purple-900/30 border-purple-500/30 hover:bg-purple-800/50"
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            )}
            
            {variant === 'library-manage' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit?.(exercise)}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-full border-gray-700 hover:bg-gray-800"
                >
                  <Pencil size={15} />
                </Button>
                
                <Button
                  onClick={() => onDelete?.(exercise)}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 rounded-full border-red-900/30 hover:bg-red-900/30 hover:text-red-400"
                >
                  <Trash2 size={15} />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-2 rounded-full border-gray-700 hover:bg-gray-800"
                    >
                      <MoreVertical size={15} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                    <DropdownMenuItem 
                      onClick={() => onViewDetails?.(exercise)}
                      className="cursor-pointer hover:bg-gray-800"
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDuplicate?.(exercise)}
                      className="cursor-pointer hover:bg-gray-800"
                    >
                      Duplicate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
