
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Calendar, Clock, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from 'date-fns';

interface WorkoutDetailsHeaderProps {
  workoutDetails: {
    id: string;
    name: string;
    training_type: string;
    start_time: string;
    duration: number;
  };
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const WorkoutDetailsHeader: React.FC<WorkoutDetailsHeaderProps> = ({
  workoutDetails,
  onEditClick,
  onDeleteClick,
}) => {
  const workoutDate = new Date(workoutDetails.start_time);
  const timeAgo = formatDistance(workoutDate, new Date(), { addSuffix: true });

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">{workoutDetails.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar size={14} />
              <span>
                {workoutDate.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{timeAgo}</span>
              <Clock size={14} />
              <span className="font-mono">{workoutDetails.duration} min</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
              {workoutDetails.training_type}
            </Badge>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditClick}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Edit size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDeleteClick}
                className="text-red-400 hover:text-red-300 hover:bg-gray-800"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
