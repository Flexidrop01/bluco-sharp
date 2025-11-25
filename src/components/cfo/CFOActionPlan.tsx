import { ActionItem, RegularizationItem } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Clock, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

interface CFOActionPlanProps {
  actions: ActionItem[];
  regularizations: RegularizationItem[];
}

const CFOActionPlan = ({ actions, regularizations }: CFOActionPlanProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const urgencyConfig = {
    urgent_24h: { label: 'Urgente 24h', color: 'text-destructive', bg: 'bg-destructive', icon: AlertTriangle },
    high_48_72h: { label: 'Alta 48-72h', color: 'text-warning', bg: 'bg-warning', icon: Clock },
    medium_term: { label: 'Medio plazo', color: 'text-cfo', bg: 'bg-cfo', icon: Calendar },
    optional: { label: 'Opcional', color: 'text-muted-foreground', bg: 'bg-muted', icon: CheckCircle },
  };

  const groupedActions = {
    urgent_24h: actions.filter(a => a.urgency === 'urgent_24h'),
    high_48_72h: actions.filter(a => a.urgency === 'high_48_72h'),
    medium_term: actions.filter(a => a.urgency === 'medium_term'),
    optional: actions.filter(a => a.urgency === 'optional'),
  };

  const totalImpact = actions.reduce((sum, a) => sum + a.estimatedImpact, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-cfo/20 bg-gradient-to-br from-cfo/5 to-transparent">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{groupedActions.urgent_24h.length}</p>
              <p className="text-xs text-muted-foreground">Urgente 24h</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{groupedActions.high_48_72h.length}</p>
              <p className="text-xs text-muted-foreground">Alta prioridad</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-cfo">{groupedActions.medium_term.length}</p>
              <p className="text-xs text-muted-foreground">Medio plazo</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{formatCurrency(totalImpact)}</p>
              <p className="text-xs text-muted-foreground">Impacto total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cfo" />
            Plan de Acción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedActions).map(([urgency, items]) => {
            if (items.length === 0) return null;
            const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
            const Icon = config.icon;
            
            return (
              <div key={urgency} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${config.bg} text-white`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {items.length} acción{items.length > 1 ? 'es' : ''}
                  </span>
                </div>
                
                <div className="space-y-2 pl-2 border-l-2 border-border">
                  {items.map((action) => (
                    <div 
                      key={action.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <Checkbox id={action.id} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={action.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {action.title}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.description}
                        </p>
                        {action.country && (
                          <Badge variant="outline" className="text-xs mt-2">
                            {action.country}
                          </Badge>
                        )}
                      </div>
                      {action.estimatedImpact > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-medium ${config.color}`}>
                            {formatCurrency(action.estimatedImpact)}
                          </p>
                          <p className="text-xs text-muted-foreground">impacto</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Regularizations */}
      {regularizations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cfo" />
              Regularizaciones Necesarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regularizations.map((reg) => {
                const config = urgencyConfig[reg.urgency];
                
                return (
                  <div 
                    key={reg.id}
                    className="p-4 rounded-lg border border-border/50 bg-card/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {reg.type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={`${config.bg} text-white text-xs`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{reg.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          País: {reg.country}
                        </p>
                      </div>
                      {reg.amount > 0 && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-cfo">
                            {formatCurrency(reg.amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CFOActionPlan;
