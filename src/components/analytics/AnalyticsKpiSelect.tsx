import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type AnalyticsKpi = 'tonnage' | 'sets' | 'workouts' | 'duration' | 'reps';

const LABELS: Record<AnalyticsKpi, string> = {
  tonnage: 'Total Volume',
  sets: 'Total Sets',
  workouts: 'Workouts',
  duration: 'Total Duration',
  reps: 'Total Reps',
};

export function kpiLabel(k: AnalyticsKpi): string { return LABELS[k]; }

export function AnalyticsKpiSelect({ value, onChange }: { value: AnalyticsKpi; onChange: (k: AnalyticsKpi) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => onChange(v as AnalyticsKpi)}>
        <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700 text-gray-200">
          <SelectValue placeholder="Select KPI" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 text-gray-200 border-gray-700">
          <SelectItem value="tonnage">Total Volume</SelectItem>
          <SelectItem value="sets">Total Sets</SelectItem>
          <SelectItem value="workouts">Workouts</SelectItem>
          <SelectItem value="duration">Total Duration</SelectItem>
          <SelectItem value="reps">Total Reps</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

