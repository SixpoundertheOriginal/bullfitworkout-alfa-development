
import React from "react";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { Switch } from "@/components/ui/switch";
import { Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeightUnitToggleProps {
  variant?: "switch" | "badge" | "button";
  className?: string;
  showLabel?: boolean;
}

export const WeightUnitToggle: React.FC<WeightUnitToggleProps> = ({
  variant = "switch",
  className = "",
  showLabel = true
}) => {
  const { weightUnit, setWeightUnit, isDefaultUnit } = useWeightUnit();

  const toggleWeightUnit = () => {
    setWeightUnit(weightUnit === "kg" ? "lb" : "kg");
  };

  if (variant === "badge") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer hover:bg-gray-800 font-mono text-gray-300 border-gray-700",
          className
        )}
        onClick={toggleWeightUnit}
      >
        <Weight size={14} className="mr-1" />
        {weightUnit.toUpperCase()}
      </Badge>
    );
  }

  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleWeightUnit}
        className={cn("flex items-center gap-1 text-gray-400 hover:text-white", className)}
      >
        <Weight size={16} />
        {showLabel && <span>{weightUnit.toUpperCase()}</span>}
      </Button>
    );
  }

  // Default switch variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && <span className="text-sm text-gray-400">KG</span>}
      <Switch
        checked={weightUnit === "lb"}
        onCheckedChange={() => toggleWeightUnit()}
      />
      {showLabel && <span className="text-sm text-gray-400">LB</span>}
    </div>
  );
};
