import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMetricCardProps {
  id: string;
  title: string;
  value: string | number;
  trend?: string;
  status: 'excellent' | 'good' | 'needs-improvement';
  icon: LucideIcon;
  context?: string;
  benchmark?: string;
  onClick: () => void;
}

export const InteractiveMetricCard: React.FC<InteractiveMetricCardProps> = ({
  title,
  value,
  trend,
  status,
  icon: Icon,
  context,
  benchmark,
  onClick
}) => {
  const statusConfig = {
    excellent: {
      bgClass: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15',
      iconColor: 'text-green-400',
      trendColor: 'text-green-400',
      badgeVariant: 'default' as const
    },
    good: {
      bgClass: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15',
      iconColor: 'text-blue-400',
      trendColor: 'text-blue-400',
      badgeVariant: 'secondary' as const
    },
    'needs-improvement': {
      bgClass: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15',
      iconColor: 'text-orange-400',
      trendColor: 'text-orange-400',
      badgeVariant: 'destructive' as const
    }
  };

  const config = statusConfig[status];

  const getTrendIcon = (trendText: string) => {
    if (trendText.includes('+') || trendText.toLowerCase().includes('excellent') || trendText.toLowerCase().includes('good')) {
      return <TrendingUp className="h-3 w-3" />;
    }
    if (trendText.includes('-') || trendText.toLowerCase().includes('low')) {
      return <TrendingDown className="h-3 w-3" />;
    }
    return <Minus className="h-3 w-3" />;
  };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        config.bgClass
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('rounded-full p-2 bg-background/10', config.iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
          {status === 'excellent' && (
            <Badge variant={config.badgeVariant} className="text-xs">
              Optimal
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>

          {trend && (
            <div className={cn('flex items-center gap-1 text-sm', config.trendColor)}>
              {getTrendIcon(trend)}
              <span>{trend}</span>
              {context && <span className="text-muted-foreground ml-1">({context})</span>}
            </div>
          )}

          {benchmark && (
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
              {benchmark}
            </p>
          )}
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-muted-foreground">Click for details →</div>
        </div>
      </CardContent>
    </Card>
  );
};