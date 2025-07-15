
import React from 'react';
import { Loader2 } from 'lucide-react';

export const WorkoutDetailsLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-gray-400">Loading workout details...</p>
      </div>
    </div>
  );
};
