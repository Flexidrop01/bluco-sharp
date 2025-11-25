import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { MetricData } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: MetricData;
  delay?: number;
}

const MetricCard = ({ metric, delay = 0 }: MetricCardProps) => {
  const getStatusIcon = () => {
    switch (metric.status) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      default:
        return null;
    }
  };

  const getChangeIcon = () => {
    if (metric.change === undefined) return null;
    if (metric.change > 0) return <TrendingUp className="w-4 h-4" />;
    if (metric.change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getChangeColor = () => {
    if (metric.change === undefined) return '';
    // For fees/refunds, negative change is good
    if (metric.label.toLowerCase().includes('fee') || metric.label.toLowerCase().includes('devoluc')) {
      return metric.change < 0 ? 'text-success' : 'text-destructive';
    }
    // For sales, positive change is good
    return metric.change > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <div 
      className={cn(
        'metric-card animate-fade-in',
        metric.status === 'critical' && 'border-destructive/30',
        metric.status === 'warning' && 'border-warning/30',
        metric.status === 'success' && 'border-success/30'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{metric.label}</span>
        {getStatusIcon()}
      </div>
      
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-foreground">{metric.value}</p>
        
        {metric.change !== undefined && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', getChangeColor())}>
            {getChangeIcon()}
            <span>{Math.abs(metric.change)}%</span>
          </div>
        )}
      </div>
      
      {metric.description && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          {metric.description}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
