import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Brain, Target, TrendingUp, Clock } from 'lucide-react';
import { ExerciseRecommendation } from '@/types/exercise-variants';

interface AIRecommendationBadgeProps {
  recommendations: ExerciseRecommendation[];
  className?: string;
}

export const AIRecommendationBadge: React.FC<AIRecommendationBadgeProps> = ({ 
  recommendations, 
  className = '' 
}) => {
  if (recommendations.length === 0) return null;

  const highestConfidence = Math.max(...recommendations.map(r => r.confidence_score));
  const primaryRecommendation = recommendations.find(r => r.confidence_score === highestConfidence);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'weakness_target':
        return <Target className="w-3 h-3" />;
      case 'progression':
        return <TrendingUp className="w-3 h-3" />;
      case 'recovery':
        return <Clock className="w-3 h-3" />;
      case 'volume_match':
        return <Brain className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'weakness_target':
        return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300';
      case 'progression':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300';
      case 'recovery':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300';
      case 'volume_match':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-300';
      default:
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300';
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type) {
      case 'weakness_target':
        return 'Weakness Target';
      case 'progression':
        return 'Progression';
      case 'recovery':
        return 'Recovery';
      case 'volume_match':
        return 'Volume Match';
      default:
        return 'AI Recommended';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Badge 
        variant="secondary" 
        className={`bg-gradient-to-r ${getRecommendationColor(primaryRecommendation?.recommendation_type || 'progression')} animate-pulse`}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        AI Recommended
      </Badge>

      {recommendations.length > 0 && (
        <Card className="border-white/10 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-sm">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Brain className="w-3 h-3 text-purple-300" />
              </div>
              <span className="text-sm font-medium text-foreground">AI Insights</span>
            </div>
            
            <div className="space-y-1">
              {recommendations.slice(0, 2).map((rec, index) => (
                <div key={rec.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    {getRecommendationIcon(rec.recommendation_type)}
                    <span className="font-medium">{getRecommendationLabel(rec.recommendation_type)}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-muted/50 to-transparent" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(rec.confidence_score * 100)}%
                  </div>
                </div>
              ))}
            </div>

            {primaryRecommendation?.reasoning && (
              <p className="text-xs text-muted-foreground italic">
                "{primaryRecommendation.reasoning}"
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};