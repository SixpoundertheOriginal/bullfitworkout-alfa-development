
import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SectionHeaderProps {
  title: string;
  navigateTo?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ 
  title, 
  navigateTo, 
  className,
  children 
}: SectionHeaderProps) {
  const ContentWrapper = navigateTo 
    ? ({ children }: { children: React.ReactNode }) => (
        <Link 
          to={navigateTo} 
          className="flex items-center justify-between group hover:text-purple-300 transition-colors"
          aria-label={`View more ${title}`}
        >
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="flex items-center justify-between">
          {children}
        </div>
      );

  return (
    <>
      <ContentWrapper>
        <h3 className={cn("text-xl font-semibold py-2", className)}>
          {title}
        </h3>
        
        {navigateTo && (
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors" />
        )}
        
        {children}
      </ContentWrapper>
      <Separator className="my-2 bg-gray-800" />
    </>
  );
}
