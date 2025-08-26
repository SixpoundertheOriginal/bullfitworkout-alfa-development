import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRAINING_FOCUSES, TrainingFocus } from '@/types/training-setup';
import { brandColors, componentPatterns, typography } from '@/utils/tokenUtils';
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

const FOCUS_CARD_VARIANTS: Record<string, string> = {
  'Push': `${componentPatterns.card.primary()} border-l-4 border-l-purple-600`,
  'Pull': `${componentPatterns.card.primary()} border-l-4 border-l-pink-600`,
  'Legs': `${componentPatterns.card.primary()} border-l-4 border-l-purple-700`,
  'Full Body': `${componentPatterns.card.primary()} border-l-4 border-l-pink-700`,
  'Arms': `${componentPatterns.card.primary()} border-l-4 border-l-purple-500`,
  'Core': `${componentPatterns.card.primary()} border-l-4 border-l-pink-500`,
  'Deload / Rehab': `${componentPatterns.card.primary()} border-l-4 border-l-zinc-500`
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
                  FOCUS_CARD_VARIANTS[focus.category],
                  isExpanded && "ring-2 ring-purple-500/30"
                )}
                onClick={() => handleFocusSelect(focus)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${brandColors.gradient()} flex items-center justify-center`}
                      >
                        {FOCUS_ICONS[focus.category]}
                      </div>

                      <div>
                        <h3 className={typography.headingMd()}>{focus.category}</h3>
                        <p className={`${typography.caption()} text-zinc-400`}>
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
                    className="overflow-hidden mt-2"
                  >
                    <div className={`${componentPatterns.card.secondary()} mt-1`}>
                      <h4 className={`${typography.caption()} text-zinc-400 uppercase tracking-wide mb-3`}>
                        Choose sub-focus:
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {focus.subFocus.map((subFocus) => (
                          <button
                            key={subFocus}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubFocusSelect(focus, subFocus);
                            }}
                            className={`${componentPatterns.button.secondary()} px-3 py-2 rounded-lg text-sm`}
                          >
                            {subFocus}
                          </button>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(focus);
                            setExpandedFocus(null);
                          }}
                          className={`${componentPatterns.button.secondary()} px-3 py-2 rounded-lg text-sm text-zinc-400`}
                        >
                          General {focus.category}
                        </button>
                      </div>
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