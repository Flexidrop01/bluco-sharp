import { CheckSquare, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { ActionItem } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface ActionPlanProps {
  actions: ActionItem[];
}

const ActionPlan = ({ actions }: ActionPlanProps) => {
  const getPriorityStyles = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          badge: 'bg-destructive text-destructive-foreground',
          icon: 'text-destructive'
        };
      case 'high':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          badge: 'bg-warning text-warning-foreground',
          icon: 'text-warning'
        };
      case 'medium':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          badge: 'bg-primary text-primary-foreground',
          icon: 'text-primary'
        };
      case 'low':
        return {
          bg: 'bg-muted',
          border: 'border-border',
          badge: 'bg-muted-foreground text-background',
          icon: 'text-muted-foreground'
        };
    }
  };

  const getPriorityLabel = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical': return 'CRÍTICO';
      case 'high': return 'ALTA';
      case 'medium': return 'MEDIA';
      case 'low': return 'BAJA';
    }
  };

  return (
    <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
      <div className="section-header">
        <div className="section-icon">
          <CheckSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Plan de Acción Prioritario</h2>
          <p className="text-sm text-muted-foreground">Decisiones de mayor impacto inmediato</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {actions.map((action, index) => {
          const styles = getPriorityStyles(action.priority);
          
          return (
            <div 
              key={index}
              className={cn(
                'p-4 rounded-lg border transition-all hover:scale-[1.01]',
                styles.bg,
                styles.border
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className={cn(
                    'inline-block px-2 py-1 rounded text-xs font-bold',
                    styles.badge
                  )}>
                    {getPriorityLabel(action.priority)}
                  </span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-foreground">{action.action}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-success">
                      <ArrowRight className="w-3 h-3" />
                      <span>{action.impact}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{action.timeframe}</span>
                    </div>
                  </div>
                </div>
                
                <div className={cn('flex-shrink-0', styles.icon)}>
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActionPlan;
