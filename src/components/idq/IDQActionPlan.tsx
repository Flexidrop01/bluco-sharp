import { IDQActionPlan as IDQActionPlanType } from '@/types/idq';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Zap, Calendar } from 'lucide-react';

interface IDQActionPlanProps {
  actions: IDQActionPlanType[];
}

const IDQActionPlan = ({ actions }: IDQActionPlanProps) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return {
          label: 'Inmediato',
          icon: <Zap className="w-4 h-4" />,
          color: 'text-status-critical',
          bg: 'bg-status-critical/20',
          border: 'border-status-critical/30'
        };
      case 'short-term':
        return {
          label: 'Corto plazo',
          icon: <Clock className="w-4 h-4" />,
          color: 'text-amazon-orange',
          bg: 'bg-amazon-orange/20',
          border: 'border-amazon-orange/30'
        };
      case 'medium-term':
        return {
          label: 'Medio plazo',
          icon: <Calendar className="w-4 h-4" />,
          color: 'text-status-warning',
          bg: 'bg-status-warning/20',
          border: 'border-status-warning/30'
        };
      default:
        return {
          label: priority,
          icon: <Target className="w-4 h-4" />,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-muted'
        };
    }
  };

  const groupedActions = {
    immediate: actions.filter(a => a.priority === 'immediate'),
    'short-term': actions.filter(a => a.priority === 'short-term'),
    'medium-term': actions.filter(a => a.priority === 'medium-term')
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-idq" />
          Plan de Acción Priorizado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acciones ordenadas por impacto y urgencia para maximizar el IDQ
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedActions).map(([priority, priorityActions]) => {
          if (priorityActions.length === 0) return null;
          const config = getPriorityConfig(priority);
          
          return (
            <div key={priority} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center ${config.color}`}>
                  {config.icon}
                </div>
                <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {priorityActions.length} acciones
                </Badge>
              </div>
              
              <div className="space-y-2 pl-10">
                {priorityActions.map((action, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${config.border} bg-card/50 space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{action.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">{action.impact}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {action.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {action.affectedAsins} ASINs
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default IDQActionPlan;
