
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
}

export function BaseCard({ children, className }: BaseCardProps) {
  return (
    <Card className={cn("bg-gray-900 border-gray-800", className)}>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}
