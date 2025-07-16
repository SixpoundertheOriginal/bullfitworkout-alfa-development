import { LucideIcon } from 'lucide-react';

export interface MetricConfig {
  id: string;
  type: 'time' | 'counter' | 'progress' | 'timer';
  label: string;
  icon: LucideIcon;
  tooltip?: string;
  priority: number; // Lower number = higher priority
  isRealTime: boolean;
  calculationKey: string;
  displayFormat?: 'time' | 'number' | 'percentage';
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface MetricValue {
  value: string | number;
  rawValue?: number;
  status?: 'normal' | 'warning' | 'critical';
  progress?: number;
  description?: string;
}

export interface MetricData {
  config: MetricConfig;
  value: MetricValue;
}

export class MetricRegistry {
  private static instance: MetricRegistry;
  private metrics: Map<string, MetricConfig> = new Map();

  private constructor() {}

  static getInstance(): MetricRegistry {
    if (!MetricRegistry.instance) {
      MetricRegistry.instance = new MetricRegistry();
    }
    return MetricRegistry.instance;
  }

  register(config: MetricConfig): void {
    this.metrics.set(config.id, config);
  }

  getMetric(id: string): MetricConfig | undefined {
    return this.metrics.get(id);
  }

  getAllMetrics(): MetricConfig[] {
    return Array.from(this.metrics.values()).sort((a, b) => a.priority - b.priority);
  }

  getMetricsByType(type: MetricConfig['type']): MetricConfig[] {
    return this.getAllMetrics().filter(metric => metric.type === type);
  }

  getHighPriorityMetrics(maxCount: number = 4): MetricConfig[] {
    return this.getAllMetrics().slice(0, maxCount);
  }
}