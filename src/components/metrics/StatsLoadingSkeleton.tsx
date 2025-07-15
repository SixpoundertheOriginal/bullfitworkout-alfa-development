
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Your Fitness Stats</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="h-5 w-5 rounded-full bg-gray-800 mb-2" />
                <Skeleton className="h-7 w-14 bg-gray-800 mb-1" />
                <Skeleton className="h-4 w-16 bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-40 bg-gray-800 mb-4" />
            <Skeleton className="h-[200px] w-full bg-gray-800 rounded-lg" />
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-40 bg-gray-800 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full bg-gray-800 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
