import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TRAINING_FOCUSES, TrainingFocus } from '@/types/training-setup';
import {
  brandColors,
  componentPatterns,
  typography,
  effects,
} from '@/utils/tokenUtils';
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

interface FocusCardProps {
  focus: TrainingFocus;
  icon: React.ReactNode;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

function FocusCard({
  focus,
  icon,
  isSelected,
  isExpanded,
  onClick,
}: FocusCardProps) {
  const baseClasses =
    (componentPatterns as any).cards?.metric?.() ||
    componentPatterns.card.metric();
  return (
    <div
      onClick={onClick}
      className={cn(
        baseClasses,
        `hover:${effects.glow.subtle()}`,
        (isSelected || isExpanded) && effects.glow.medium(),
        (isSelected || isExpanded) && 'ring-2 ring-purple-500/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${brandColors.gradient()} flex items-center justify-center`}
          >
            {icon}
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
              'h-4 w-4 transition-transform duration-200 text-muted-foreground',
              isExpanded && 'rotate-90'
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function TrainingFocusSelector({ selectedFocus, onSelect }: TrainingFocusSelectorProps) {
  const [expandedFocus, setExpandedFocus] = useState<string | null>(null);
  const [selectedSubFocus, setSelectedSubFocus] = useState<string | null>(null);

  const handleFocusSelect = (focus: TrainingFocus) => {
    if (expandedFocus === focus.category) {
      onSelect(focus);
    } else {
      setSelectedSubFocus(null);
      setExpandedFocus(focus.category);
    }
  };

  const handleSubFocusSelect = (focus: TrainingFocus, subFocus: string) => {
    setSelectedSubFocus(subFocus);
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
              <FocusCard
                focus={focus}
                icon={FOCUS_ICONS[focus.category]}
                isSelected={isSelected}
                isExpanded={isExpanded}
                onClick={() => handleFocusSelect(focus)}
              />

              <AnimatePresence>
                {isExpanded && focus.subFocus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2"
                  >
                    <div
                      className={`${
                        (componentPatterns as any).cards?.progress?.() ||
                        componentPatterns.card.progress()
                      } mt-1`}
                    >
                      <h4
                        className={`${typography.caption()} text-zinc-400 uppercase tracking-wide mb-3`}
                      >
                        Choose sub-focus:
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {focus.subFocus.map((subFocus) => (
                          <motion.button
                            key={subFocus}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubFocusSelect(focus, subFocus);
                            }}
                            className={cn(
                              componentPatterns.card.secondary(),
                              'relative overflow-hidden px-3 py-2 text-sm rounded-lg transition-all',
                              `hover:${effects.glow.subtle()}`,
                              selectedSubFocus === subFocus &&
                                `text-white ${effects.glow.medium()}`
                            )}
                          >
                            <AnimatePresence>
                              {selectedSubFocus === subFocus && (
                                <motion.span
                                  layoutId="subFocusSelection"
                                  className={`absolute inset-0 rounded-lg bg-gradient-to-r ${brandColors.gradient()}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                />
                              )}
                            </AnimatePresence>
                            <span className="relative z-10">{subFocus}</span>
                          </motion.button>
                        ))}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubFocus('general');
                            onSelect(focus);
                            setExpandedFocus(null);
                          }}
                          className={cn(
                            componentPatterns.card.secondary(),
                            'relative overflow-hidden px-3 py-2 text-sm rounded-lg text-zinc-400 transition-all',
                            `hover:${effects.glow.subtle()}`,
                            selectedSubFocus === 'general' &&
                              `text-white ${effects.glow.medium()}`
                          )}
                        >
                          <AnimatePresence>
                            {selectedSubFocus === 'general' && (
                              <motion.span
                                layoutId="subFocusSelection"
                                className={`absolute inset-0 rounded-lg bg-gradient-to-r ${brandColors.gradient()}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              />
                            )}
                          </AnimatePresence>
                          <span className="relative z-10">General {focus.category}</span>
                        </motion.button>
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