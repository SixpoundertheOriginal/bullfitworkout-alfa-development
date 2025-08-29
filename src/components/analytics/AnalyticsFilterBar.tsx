import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type GroupBy = 'day' | 'week' | 'month';
interface ExerciseOption {
  id: string;
  name: string;
}

export function AnalyticsFilterBar({
  groupBy,
  exerciseId,
  exerciseOptions = [],
  isExerciseLoading = false,
  onGroupByChange,
  onExerciseChange,
  onReset,
}: {
  groupBy: GroupBy;
  exerciseId?: string;
  exerciseOptions?: ExerciseOption[];
  isExerciseLoading?: boolean;
  onGroupByChange: (g: GroupBy) => void;
  onExerciseChange?: (id?: string) => void;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-sm text-gray-400">Group:</div>
      <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupBy)}>
        <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-700 text-gray-200">
          <SelectValue placeholder="By day" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 text-gray-200 border-gray-700">
          <SelectItem value="day">By day</SelectItem>
          <SelectItem value="week">By week</SelectItem>
          <SelectItem value="month">By month</SelectItem>
        </SelectContent>
      </Select>

      {onExerciseChange && (
        <>
          <div className="text-sm text-gray-400">Exercise:</div>
          <Select
            value={exerciseId ?? 'all'}
            disabled={isExerciseLoading}
            onValueChange={(v) => onExerciseChange(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700 text-gray-200">
              <SelectValue placeholder={isExerciseLoading ? 'Loading...' : 'All exercises'} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 text-gray-200 border-gray-700">
              <SelectItem value="all">All exercises</SelectItem>
              {isExerciseLoading && (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              )}
              {!isExerciseLoading && exerciseOptions.length === 0 && (
                <SelectItem value="none" disabled>
                  No exercises found
                </SelectItem>
              )}
              {exerciseOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {onReset && (
        <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/10" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}

