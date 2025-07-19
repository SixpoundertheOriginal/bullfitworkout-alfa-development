
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Calendar, Award } from "lucide-react";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { Skeleton } from "@/components/ui/skeleton";

export const PersonalRecordsCard: React.FC = () => {
  const { recentRecords, isLoading } = usePersonalRecords();
  const { weightUnit } = useWeightUnit();

  const getPRIcon = (type: string) => {
    switch (type) {
      case 'weight': return <Trophy className="h-4 w-4 text-yellow-400" />;
      case 'reps': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'volume': return <Award className="h-4 w-4 text-purple-400" />;
      default: return <Trophy className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getPRColor = (type: string) => {
    switch (type) {
      case 'weight': return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
      case 'reps': return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
      case 'volume': return 'bg-purple-900/30 text-purple-300 border-purple-500/30';
      default: return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
    }
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'weight': return `${value} ${weightUnit}`;
      case 'reps': return `${value} reps`;
      case 'volume': return `${value} ${weightUnit}`;
      default: return value.toString();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Recent Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-gray-700" />
              <Skeleton className="h-6 w-16 bg-gray-700" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayRecords = recentRecords.slice(0, 5);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Recent Personal Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayRecords.length > 0 ? (
          <div className="space-y-3">
            {displayRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getPRIcon(record.type)}
                  <div>
                    <p className="text-sm font-medium text-white">{record.exercise_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.date)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="outline" className={getPRColor(record.type)}>
                    {formatValue(record.type, record.value)}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{record.type} PR</p>
                </div>
              </div>
            ))}
            
            {recentRecords.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400">
                  +{recentRecords.length - 5} more records
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No personal records yet</p>
            <p className="text-gray-500 text-xs mt-1">Complete workouts to start tracking PRs!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
