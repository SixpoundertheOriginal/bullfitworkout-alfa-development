
import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({ icon, label, value, className, onClick }: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={cn(
        "flex flex-col items-center p-4 rounded-lg bg-gray-800/80 border border-gray-800 transition-all",
        onClick && "hover:bg-gray-800 hover:border-purple-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900",
        className
      )}
      onClick={onClick}
      aria-label={onClick ? `View more details about ${label}` : undefined}
    >
      <div className="mb-2 text-purple-400">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </Component>
  );
}
