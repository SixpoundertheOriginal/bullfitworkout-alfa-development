import React, { useState } from 'react';
import { TrendingUp, Award, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkoutInsight } from '@/types/ai-enhanced';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  insights: WorkoutInsight[];
  loading?: boolean;
  className?: string;
  onInsightAction?: (insightId: string, action: string) => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights = [],
  loading = false,
  className,
  onInsightAction
}) => {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const toggleInsight = (insightId: string) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="h-5 w-5 text-yellow-400" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-400" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-orange-400" />;
      case 'milestone': return <Target className="h-5 w-5 text-green-400" />;
      default: return <TrendingUp className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'trend': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'recommendation': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'milestone': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full bg-gray-900 border-gray-700', className)}>
        <CardHeader>
          <CardTitle className="text-white">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={cn('w-full bg-gray-900 border-gray-700', className)}>
        <CardHeader>
          <CardTitle className="text-white">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No insights available yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete more workouts to unlock personalized insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full bg-gray-900 border-gray-700', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          AI Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <Collapsible
            key={insight.id}
            open={expandedInsights.has(insight.id)}
            onOpenChange={() => toggleInsight(insight.id)}
          >
            <Card className="bg-gray-800 border-gray-600">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white text-sm leading-tight">
                            {insight.title}
                          </h4>
                          <Badge 
                            variant="outline"
                            className={cn('text-xs px-2 py-0.5', getTypeColor(insight.type))}
                          >
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2">
                      <div className="flex items-center gap-1">
                        <div 
                          className={cn('w-2 h-2 rounded-full', getPriorityColor(insight.priority))}
                        />
                        <span className="text-xs text-gray-400">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      {expandedInsights.has(insight.id) ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {insight.actionable && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-3">
                      <h5 className="font-medium text-purple-300 text-sm mb-1">
                        Recommended Action
                      </h5>
                      <p className="text-sm text-gray-300">
                        {insight.actionable}
                      </p>
                    </div>
                  )}
                  
                  {insight.metadata && Object.keys(insight.metadata).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-300 text-xs uppercase tracking-wide">
                        Details
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(insight.metadata).map(([key, value]) => (
                          <div key={key} className="bg-gray-700/50 rounded p-2">
                            <span className="text-gray-400 block">{key}</span>
                            <span className="text-white font-medium">
                              {typeof value === 'number' && value % 1 !== 0 
                                ? value.toFixed(1)
                                : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {onInsightAction && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsightAction(insight.id, 'helpful')}
                        className="text-xs"
                      >
                        Helpful
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsightAction(insight.id, 'not_helpful')}
                        className="text-xs"
                      >
                        Not Helpful
                      </Button>
                      {insight.actionable && (
                        <Button
                          size="sm"
                          onClick={() => onInsightAction(insight.id, 'apply_suggestion')}
                          className="text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};