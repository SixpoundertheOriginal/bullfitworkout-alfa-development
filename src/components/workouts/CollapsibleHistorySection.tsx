
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown } from "lucide-react";
import { typography } from '@/lib/typography';

interface CollapsibleHistorySectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleHistorySection = ({
  title,
  children,
  defaultOpen = true,
  className = "",
}: CollapsibleHistorySectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={className}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-2 hover:bg-gray-800/50"
        >
          <span className={typography.headings.collapsible}>{title}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-white" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
