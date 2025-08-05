import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useExerciseVariants } from '@/hooks/useExerciseVariants';
import { VariantSelectionData } from '@/types/exercise-variants';
import { formatDistanceToNow } from 'date-fns';

interface ExerciseVariantSelectorProps {
  exerciseId: string;
  exerciseName: string;
  onVariantSelect: (variantData: VariantSelectionData) => void;
  className?: string;
}

export const ExerciseVariantSelector: React.FC<ExerciseVariantSelectorProps> = ({
  exerciseId,
  exerciseName,
  onVariantSelect,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVariantData, setSelectedVariantData] = useState<VariantSelectionData>({});
  const { variants, recommendations, getProgressionTrend, getLastPerformed, getPersonalBest } = useExerciseVariants(exerciseId);

  const progressionTrend = getProgressionTrend(exerciseId);
  const lastPerformed = getLastPerformed(exerciseId);
  const personalBest = getPersonalBest(exerciseId);

  const handleVariantChange = (field: keyof VariantSelectionData, value: any) => {
    const updatedData = { ...selectedVariantData, [field]: value };
    setSelectedVariantData(updatedData);
    onVariantSelect(updatedData);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-500';
      case 'declining':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <Card className={`${className} border-white/10 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {exerciseName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {recommendations.length > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Recommended
              </Badge>
            )}
            {getTrendIcon(progressionTrend)}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lastPerformed && (
            <span>
              Last: {formatDistanceToNow(new Date(lastPerformed), { addSuffix: true })}
            </span>
          )}
          <span className={getTrendColor(progressionTrend)}>
            {progressionTrend}
          </span>
          {personalBest ? (
            <span>
              PR: {personalBest.weight}kg × {personalBest.reps}
            </span>
          ) : (
            <span>No PR yet</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-3 h-auto bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border border-accent/20"
            >
              <span className="font-medium">Advanced Variant & Tracking</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6 pt-4">
            {/* Variant Selection */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Exercise Variant</Label>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant="outline"
                      size="sm"
                      className={`text-left justify-start h-auto p-3 ${
                        selectedVariantData.variant_id === variant.id
                          ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/50'
                          : 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50 hover:from-muted/70 hover:to-muted/50'
                      }`}
                      onClick={() => handleVariantChange('variant_id', variant.id)}
                    >
                      <div>
                        <div className="font-medium">{variant.variant_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Difficulty: {variant.difficulty_modifier}x
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Grip Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Grip Type</Label>
                <Select 
                  value={selectedVariantData.grip_type || ''} 
                  onValueChange={(value) => handleVariantChange('grip_type', value)}
                >
                  <SelectTrigger className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50">
                    <SelectValue placeholder="Select grip type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overhand">Overhand</SelectItem>
                    <SelectItem value="underhand">Underhand</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="hook">Hook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Grip Width</Label>
                <Select 
                  value={selectedVariantData.grip_width || ''} 
                  onValueChange={(value) => handleVariantChange('grip_width', value)}
                >
                  <SelectTrigger className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50">
                    <SelectValue placeholder="Select grip width" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrow">Narrow</SelectItem>
                    <SelectItem value="close">Close</SelectItem>
                    <SelectItem value="shoulder_width">Shoulder Width</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                    <SelectItem value="extra_wide">Extra Wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Technique & Range of Motion */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technique</Label>
                <Select 
                  value={selectedVariantData.technique_type || ''} 
                  onValueChange={(value) => handleVariantChange('technique_type', value)}
                >
                  <SelectTrigger className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50">
                    <SelectValue placeholder="Select technique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="weighted">Weighted</SelectItem>
                    <SelectItem value="unilateral">Unilateral</SelectItem>
                    <SelectItem value="explosive">Explosive</SelectItem>
                    <SelectItem value="isometric">Isometric</SelectItem>
                    <SelectItem value="pause_rep">Pause Rep</SelectItem>
                    <SelectItem value="cluster">Cluster</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Range of Motion</Label>
                <Select 
                  value={selectedVariantData.range_of_motion || ''} 
                  onValueChange={(value) => handleVariantChange('range_of_motion', value)}
                >
                  <SelectTrigger className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50">
                    <SelectValue placeholder="Select ROM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="top_half">Top Half</SelectItem>
                    <SelectItem value="bottom_half">Bottom Half</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="dead_hang">Dead Hang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Parameters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tempo (Eccentric-Pause-Concentric-Pause)</Label>
                <Input 
                  placeholder="e.g., 3-1-2-0"
                  value={selectedVariantData.tempo || ''}
                  onChange={(e) => handleVariantChange('tempo', e.target.value)}
                  className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Added Weight (kg)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={selectedVariantData.added_weight || 0}
                  onChange={(e) => handleVariantChange('added_weight', parseFloat(e.target.value) || 0)}
                  className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">RPE (Rate of Perceived Exertion)</Label>
                <div className="px-3">
                  <Slider
                    value={[selectedVariantData.rpe || 5]}
                    onValueChange={([value]) => handleVariantChange('rpe', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 (Very Easy)</span>
                    <span className="font-medium text-foreground">RPE: {selectedVariantData.rpe || 5}</span>
                    <span>10 (Maximum)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea 
                  placeholder="Add any notes about this set..."
                  value={selectedVariantData.notes || ''}
                  onChange={(e) => handleVariantChange('notes', e.target.value)}
                  className="bg-gradient-to-r from-muted/50 to-muted/30 border-muted/50 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};