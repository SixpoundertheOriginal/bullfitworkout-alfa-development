import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRAINING_FOCUSES, TrainingFocus } from '@/types/training-setup';
import { 
  Dumbbell, 
  ArrowUp, 
  ArrowDown, 
  Zap, 
  Target, 
  Heart, 
  Shield,
  ChevronRight
} from 'lucide-react';

interface TrainingFocusSelectorProps {
  selectedFocus: TrainingFocus | null;
  onSelect: (focus: TrainingFocus, subFocus?: string) => void;
}

const FOCUS_ICONS = {
  'Push': <ArrowUp className="h-5 w-5" />,
  'Pull': <ArrowDown className="h-5 w-5" />,
  'Legs': <Dumbbell className="h-5 w-5" />,
  'Full Body': <Zap className="h-5 w-5" />,
  'Arms': <Target className="h-5 w-5" />,
  'Core': <Heart className="h-5 w-5" />,
  'Deload / Rehab': <Shield className="h-5 w-5" />
};

const FOCUS_GRADIENTS = {
  'Push': 'from-red-500/20 to-orange-500/20',
  'Pull': 'from-blue-500/20 to-cyan-500/20',
  'Legs': 'from-purple-500/20 to-pink-500/20',
  'Full Body': 'from-green-500/20 to-emerald-500/20',
  'Arms': 'from-yellow-500/20 to-amber-500/20',
  'Core': 'from-indigo-500/20 to-violet-500/20',
  'Deload / Rehab': 'from-gray-500/20 to-slate-500/20'
};

const FOCUS_BORDERS = {
  'Push': 'border-red-500/30',
  'Pull': 'border-blue-500/30',
  'Legs': 'border-purple-500/30',
  'Full Body': 'border-green-500/30',
  'Arms': 'border-yellow-500/30',
  'Core': 'border-indigo-500/30',
  'Deload / Rehab': 'border-gray-500/30'
};

export function TrainingFocusSelector({ selectedFocus, onSelect }: TrainingFocusSelectorProps) {
  const [expandedFocus, setExpandedFocus] = useState<string | null>(null);

  const handleFocusSelect = (focus: TrainingFocus) => {
    if (expandedFocus === focus.category) {
      onSelect(focus);
    } else {
      setExpandedFocus(focus.category);
    }
  };

  const handleSubFocusSelect = (focus: TrainingFocus, subFocus: string) => {
    onSelect(focus, subFocus);
    setExpandedFocus(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {TRAINING_FOCUSES.map((focus) => {
          const isSelected = selectedFocus?.category === focus.category;
          const isExpanded = expandedFocus === focus.category;
          
          return (
            <motion.div
              key={focus.category}
              layout
              className="relative"
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                  "bg-background/50 backdrop-blur-sm border",
                  isSelected 
                    ? FOCUS_BORDERS[focus.category]
                    : "border-border/50 hover:border-border",
                  isExpanded && "ring-2 ring-primary/20"
                )}
                onClick={() => handleFocusSelect(focus)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        "bg-gradient-to-br",
                        FOCUS_GRADIENTS[focus.category],
                        "border",
                        FOCUS_BORDERS[focus.category]
                      )}>
                        {FOCUS_ICONS[focus.category]}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-foreground">
                          {focus.category}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {focus.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          Selected
                        </Badge>
                      )}
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {isExpanded && focus.subFocus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 ml-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-medium mb-2">
                        Choose sub-focus:
                      </div>
                      {focus.subFocus.map((subFocus) => (
                        <Button
                          key={subFocus}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubFocusSelect(focus, subFocus);
                          }}
                        >
                          <span className="text-sm">{subFocus}</span>
                        </Button>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-3 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(focus);
                          setExpandedFocus(null);
                        }}
                      >
                        <span className="text-sm">General {focus.category}</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}