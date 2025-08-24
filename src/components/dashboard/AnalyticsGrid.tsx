import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Award, BarChart3, Timer, Target } from 'lucide-react';
import { StrengthProgressionCard } from '@/components/metrics/StrengthProgressionCard';
import { TransparentEfficiencyCard } from '@/components/metrics/TransparentEfficiencyCard';
import { RestPatternAnalytics } from '@/components/metrics/RestPatternAnalytics';
import { PersonalRecordsCard } from '@/components/personalRecords/PersonalRecordsCard';

interface AnalyticsGridProps {
  workouts: any[];
  processedMetrics: any;
  userBodyweight: number;
  onPanelToggle?: (panelId: string, isOpen: boolean) => void;
}

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  workouts,
  processedMetrics,
  userBodyweight,
  onPanelToggle
}) => {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set(['strength']));

  const togglePanel = (panelId: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedPanels(newExpanded);
    onPanelToggle?.(panelId, newExpanded.has(panelId));
  };

  const panels = [
    {
      id: 'strength',
      title: 'Strength Progression Analytics',
      icon: Award,
      description: '1RM trends, strength ratios, plateau detection',
      priority: 'high',
      component: <StrengthProgressionCard workouts={workouts} userBodyweight={userBodyweight} />
    },
    {
      id: 'volume',
      title: 'Volume & Efficiency Analytics', 
      icon: BarChart3,
      description: 'Training load, density metrics, optimization insights',
      priority: 'high',
      component: processedMetrics?.processedMetrics && (
        <TransparentEfficiencyCard metrics={processedMetrics.processedMetrics} />
      )
    },
    {
      id: 'personal-records',
      title: 'Personal Records Tracking',
      icon: Target,
      description: 'Recent PRs, record progression, achievement milestones',
      priority: 'medium',
      component: <PersonalRecordsCard />
    },
    {
      id: 'rest-patterns',
      title: 'Recovery & Rest Analytics',
      icon: Timer,
      description: 'Rest time patterns, recovery insights, fatigue indicators',
      priority: 'medium',
      component: <RestPatternAnalytics workouts={workouts} />
    }
  ];

  const priorityOrder = ['high', 'medium', 'low'];
  const sortedPanels = panels.sort((a, b) => 
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Detailed Analytics</h2>
        <span className="text-sm text-muted-foreground">
          {expandedPanels.size} of {panels.length} sections expanded
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedPanels.map((panel) => {
          const isExpanded = expandedPanels.has(panel.id);
          const Icon = panel.icon;
          
          return (
            <Collapsible 
              key={panel.id} 
              open={isExpanded}
              onOpenChange={() => togglePanel(panel.id)}
            >
              <Card className="relative overflow-hidden border-muted/20 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/10 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-medium">{panel.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{panel.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {panel.priority === 'high' && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                          Priority
                        </div>
                      </div>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t border-muted/20 pt-4">
                      {panel.component || (
                        <div className="text-center text-muted-foreground py-8">
                          Component not available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};