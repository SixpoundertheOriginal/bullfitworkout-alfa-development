import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, X } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: string;
  data: any;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  metricType,
  data
}) => {
  const getModalContent = () => {
    switch (metricType) {
      case 'tonnage':
        return {
          title: 'Weekly Tonnage Analysis',
          description: 'Detailed breakdown of your training volume this week',
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{Math.round(data.currentWeek)}kg</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">vs Previous</p>
                      <Badge variant="default" className="mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8.3%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Recommendations:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Maintain current volume for consistent progress</li>
                      <li>• Consider slight increase (+5-10%) next week if recovery permits</li>
                      <li>• Track weekly changes to identify optimal volume range</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        };
        
      case 'strength':
        return {
          title: 'Strength Progress Details',
          description: 'Personal records and strength development tracking',
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{data.monthlyPRs}</p>
                      <p className="text-sm text-muted-foreground">PRs This Month</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Target Range</p>
                      <p className="text-sm text-muted-foreground">2-4 PRs/month</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Strength Development:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Focus on compound movements for maximum strength gains</li>
                      <li>• Track 1RM estimates to monitor progression</li>
                      <li>• Consider deload if progress stalls for 2+ weeks</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        };
        
      case 'consistency':
        return {
          title: 'Training Consistency Analysis',
          description: 'Workout frequency and adherence patterns',
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{data.weeklyConsistency}/7</p>
                      <p className="text-sm text-muted-foreground">Days This Week</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Optimal Range</p>
                      <p className="text-sm text-muted-foreground">4-6 days/week</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Consistency Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Schedule workouts like appointments</li>
                      <li>• Plan rest days to prevent overtraining</li>
                      <li>• Track patterns to identify optimal training times</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        };
        
      case 'volume':
        return {
          title: 'Volume Status Details',
          description: 'Training volume optimization and recommendations',
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge 
                        variant={data.status === 'optimal' ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {data.text}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Volume Optimization:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Monitor recovery between sessions</li>
                        <li>• Adjust volume based on progress and fatigue</li>
                        <li>• Use progressive overload principles</li>
                        <li>• Consider periodization for long-term gains</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        };
        
      default:
        return {
          title: 'Metric Details',
          description: 'Detailed information about this metric',
          content: <div>No details available for this metric.</div>
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{modalContent.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {modalContent.description}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {modalContent.content}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};