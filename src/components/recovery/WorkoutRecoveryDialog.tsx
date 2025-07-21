import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Trash2, Eye } from 'lucide-react';
import { StateCorruptionIssue } from '@/utils/workoutStateDebug';

interface WorkoutRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  issues: StateCorruptionIssue[];
  onRecover: () => void;
  onStartFresh: () => void;
  onViewDetails?: () => void;
  isRecovering?: boolean;
  showSimpleUI?: boolean; // New prop for simple one-button UI
}

export const WorkoutRecoveryDialog: React.FC<WorkoutRecoveryDialogProps> = ({
  isOpen,
  onClose,
  issues,
  onRecover,
  onStartFresh,
  onViewDetails,
  isRecovering = false,
  showSimpleUI = false
}) => {
  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const moderateIssues = issues.filter(issue => issue.severity === 'moderate');
  const minorIssues = issues.filter(issue => issue.severity === 'minor');

  const getSeverityColor = (severity: StateCorruptionIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'minor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getIssueDescription = (type: StateCorruptionIssue['type']) => {
    switch (type) {
      case 'stuck_saving':
        return 'Your workout got stuck while trying to save. This usually happens when the app loses connection or encounters an error.';
      case 'active_without_start':
        return 'The workout is marked as active but missing important timing information.';
      case 'outdated_version':
        return 'Your workout data is from an older version of the app and needs to be updated.';
      case 'invalid_data':
        return 'Some workout data has become corrupted and needs to be cleaned up.';
      case 'storage_corruption':
        return 'The device storage has issues that are affecting your workout data.';
      default:
        return 'An unknown issue was detected with your workout session.';
    }
  };

  if (showSimpleUI) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Your workout needs a quick fix to continue
            </DialogTitle>
            <DialogDescription>
              We detected an issue with your workout session, but we can fix it automatically while keeping your exercise data.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Button
              onClick={() => {
                onRecover();
                onClose();
              }}
              disabled={isRecovering}
              className="w-full"
              size="lg"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing workout...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fix Workout
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Workout Session Issue Detected
          </DialogTitle>
          <DialogDescription>
            We've detected {issues.length} issue{issues.length !== 1 ? 's' : ''} with your current workout session. 
            Don't worry - we can recover your data or help you start fresh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Critical Issues */}
          {criticalIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Critical Issues Found:</div>
                  {criticalIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant={getSeverityColor(issue.severity)} className="mt-0.5">
                        {issue.severity}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">{issue.message}</div>
                        <div className="text-muted-foreground mt-1">
                          {getIssueDescription(issue.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Moderate/Minor Issues */}
          {(moderateIssues.length > 0 || minorIssues.length > 0) && (
            <div className="space-y-2">
              {[...moderateIssues, ...minorIssues].map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Badge variant={getSeverityColor(issue.severity)} className="mt-0.5">
                    {issue.severity}
                  </Badge>
                  <div className="text-sm">
                    <div className="font-medium">{issue.message}</div>
                    <div className="text-muted-foreground mt-1">
                      {getIssueDescription(issue.type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recovery Options */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Recovery Options:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span><strong>Recover Workout:</strong> Fix the issues and preserve your current workout data</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span><strong>Start Fresh:</strong> Clear everything and begin a new workout session</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {onViewDetails && (
            <Button variant="outline" onClick={onViewDetails} className="mr-auto">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onStartFresh}
            disabled={isRecovering}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Start Fresh
          </Button>
          
          <Button
            onClick={onRecover}
            disabled={isRecovering}
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Recover Workout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};