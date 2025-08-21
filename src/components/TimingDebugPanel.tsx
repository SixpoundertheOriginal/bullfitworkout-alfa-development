import React, { useState } from 'react';
import { Bug, Clock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWorkoutTimingCoordinator } from '@/hooks/useWorkoutTimingCoordinator';
import { formatTime } from '@/utils/formatTime';
import { cn } from '@/lib/utils';

interface TimingDebugPanelProps {
  className?: string;
}

/**
 * Development panel for debugging and validating workout timing systems.
 * Only shows in development mode or when explicitly enabled.
 */
export const TimingDebugPanel: React.FC<TimingDebugPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(process.env.NODE_ENV === 'development');
  
  const {
    validateTiming,
    getTimingDebugInfo,
    reconcileTiming,
    lastValidation
  } = useWorkoutTimingCoordinator();

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 opacity-30 hover:opacity-100"
      >
        <Bug size={16} />
      </Button>
    );
  }

  const debugInfo = getTimingDebugInfo();
  const validation = validateTiming();

  const handleReconcile = () => {
    const result = reconcileTiming();
    console.log('🔧 Timing reconciliation result:', result);
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 max-w-sm", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "mb-2 bg-background/90 backdrop-blur",
              !validation.isValid && "border-destructive text-destructive"
            )}
          >
            <Clock size={16} className="mr-2" />
            Timing Debug
            {!validation.isValid && (
              <AlertTriangle size={14} className="ml-2 text-destructive" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="bg-background/95 backdrop-blur border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Timing Analysis</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={validation.isValid ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {validation.isValid ? (
                      <><CheckCircle size={12} className="mr-1" /> Valid</>
                    ) : (
                      <><AlertTriangle size={12} className="mr-1" /> Issues</>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                  >
                    <EyeOff size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 text-xs">
              {/* Global Timer Status */}
              <div className="space-y-1">
                <h4 className="font-medium text-primary">Global Timer</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Elapsed: {formatTime(debugInfo.globalTimer.elapsed)}</span>
                  <span>Paused: {debugInfo.globalTimer.isPaused ? 'Yes' : 'No'}</span>
                  <span>Paused time: {formatTime(Math.floor(debugInfo.globalTimer.totalPausedMs / 1000))}</span>
                  <span>Active: {debugInfo.globalTimer.startTime ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Rest Analytics */}
              <div className="space-y-1">
                <h4 className="font-medium text-primary">Rest Analytics</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Total rest: {formatTime(debugInfo.restAnalytics.totalRestTime)}</span>
                  <span>Avg rest: {formatTime(Math.floor(debugInfo.restAnalytics.averageRestTime))}</span>
                  <span>Sessions: {debugInfo.restAnalytics.completedSessions}</span>
                </div>
              </div>

              {/* Exercise Timing */}
              <div className="space-y-1">
                <h4 className="font-medium text-primary">Exercise Time</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Estimated: {formatTime(debugInfo.setTimings.totalEstimatedExerciseTime)}</span>
                  <span>Sets: {debugInfo.setTimings.setCount}</span>
                </div>
              </div>

              {/* Validation Results */}
              <div className="space-y-1">
                <h4 className="font-medium text-primary">Validation</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>Calculated: {formatTime(validation.breakdown.calculatedTotal)}</span>
                    <span>Global: {formatTime(validation.breakdown.globalElapsed)}</span>
                  </div>
                  {validation.discrepancy !== undefined && (
                    <div className={cn(
                      "text-xs font-mono px-2 py-1 rounded",
                      validation.discrepancy > 30 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                    )}>
                      Discrepancy: {validation.discrepancy}s
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-destructive">Warnings</h4>
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconcile}
                  disabled={validation.isValid}
                  className="flex-1 text-xs"
                >
                  Reconcile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('📊 Full timing debug:', debugInfo)}
                  className="flex-1 text-xs"
                >
                  Log Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};