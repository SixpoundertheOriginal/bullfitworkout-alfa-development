import React, { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WorkoutNameSuggestion } from '@/types/ai-enhanced';
import { cn } from '@/lib/utils';

interface SmartWorkoutNamingProps {
  suggestions: WorkoutNameSuggestion[];
  defaultName?: string;
  onNameSelected: (name: string) => void;
  onFeedback?: (suggestionId: string, action: 'accepted' | 'rejected' | 'modified', userChoice?: string) => void;
  loading?: boolean;
  className?: string;
}

export const SmartWorkoutNaming: React.FC<SmartWorkoutNamingProps> = ({
  suggestions = [],
  defaultName = '',
  onNameSelected,
  onFeedback,
  loading = false,
  className
}) => {
  const [selectedName, setSelectedName] = useState(defaultName);
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (suggestions.length > 0 && !selectedName && !defaultName) {
      // Auto-select the highest confidence suggestion
      const topSuggestion = suggestions[0];
      setSelectedName(topSuggestion.name);
      onNameSelected(topSuggestion.name);
    }
  }, [suggestions, selectedName, defaultName, onNameSelected]);

  const handleSuggestionSelect = (suggestion: WorkoutNameSuggestion) => {
    setSelectedName(suggestion.name);
    setShowCustomInput(false);
    onNameSelected(suggestion.name);
    
    if (onFeedback && !feedbackGiven[suggestion.name]) {
      onFeedback(suggestion.name, 'accepted');
      setFeedbackGiven(prev => ({ ...prev, [suggestion.name]: true }));
    }
  };

  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      setSelectedName(customName.trim());
      onNameSelected(customName.trim());
      setShowCustomInput(false);
      
      if (onFeedback && suggestions.length > 0) {
        onFeedback(suggestions[0].name, 'modified', customName.trim());
      }
    }
  };

  const handleFeedback = (suggestion: WorkoutNameSuggestion, action: 'thumbs_up' | 'thumbs_down') => {
    if (onFeedback && !feedbackGiven[suggestion.name]) {
      onFeedback(suggestion.name, action === 'thumbs_up' ? 'accepted' : 'rejected');
      setFeedbackGiven(prev => ({ ...prev, [suggestion.name]: true }));
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getSuggestionCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise-based': return '🏋️';
      case 'muscle-based': return '💪';
      case 'performance-based': return '🎯';
      case 'time-based': return '⏱️';
      default: return '✨';
    }
  };

  return (
    <Card className={cn('w-full bg-gray-900 border-gray-700', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-purple-400" />
          AI Workout Naming
          {loading && (
            <div className="animate-pulse">
              <div className="h-2 w-8 bg-gray-600 rounded"></div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-3">
                  AI-powered suggestions based on your workout:
                </p>
                
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.name}
                    className={cn(
                      'p-3 rounded-lg border transition-all cursor-pointer hover:border-purple-500',
                      selectedName === suggestion.name
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-800'
                    )}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">
                          {getSuggestionCategoryIcon(suggestion.category)}
                        </span>
                        <span className="font-medium text-white">
                          {suggestion.name}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'text-xs px-2 py-0.5',
                            getConfidenceColor(suggestion.confidence)
                          )}
                        >
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                      
                      {selectedName !== suggestion.name && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-green-600/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedback(suggestion, 'thumbs_up');
                            }}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-600/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedback(suggestion, 'thumbs_down');
                            }}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-400 mt-1 ml-6">
                        {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-gray-700">
              {!showCustomInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Create Custom Name
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter custom workout name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomNameSubmit()}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCustomNameSubmit}
                      disabled={!customName.trim()}
                    >
                      Use Custom Name
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {selectedName && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  Selected name: <span className="font-semibold text-white">{selectedName}</span>
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};