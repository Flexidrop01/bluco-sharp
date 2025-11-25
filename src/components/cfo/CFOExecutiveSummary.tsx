import { CFOExecutiveSummary as CFOSummaryType } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Globe, Receipt, AlertCircle } from 'lucide-react';

interface CFOExecutiveSummaryProps {
  summary: CFOSummaryType;
}

const CFOExecutiveSummary = ({ summary }: CFOExecutiveSummaryProps) => {
  const statusConfig = {
    critical: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Crítico' },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Atención' },
    good: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Correcto' },
  };

  const status = statusConfig[summary.overallStatus];
  const StatusIcon = status.icon;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <Card className="border-cfo/20 bg-gradient-to-br from-cfo/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cfo" />
            Resumen Ejecutivo Fiscal
          </CardTitle>
          <Badge className={`${status.bg} ${status.color} border-0`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Transacciones</p>
            <p className="text-2xl font-bold text-foreground">
              {summary.totalTransactions.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Ventas (excl. IVA)</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalSalesExclVat)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">IVA Cobrado</p>
            <p className="text-2xl font-bold text-cfo">
              {formatCurrency(summary.totalVatCollected)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">IVA Debido</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalVatDue)}
            </p>
          </div>
        </div>

        {/* Discrepancy Alert */}
        {summary.vatDiscrepancy > 100 && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Discrepancia de IVA Detectada</p>
              <p className="text-sm text-muted-foreground">
                Diferencia de {formatCurrency(summary.vatDiscrepancy)} entre IVA cobrado y calculado
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
            <Globe className="w-8 h-8 text-cfo/70" />
            <div>
              <p className="text-2xl font-bold">{summary.countriesWithObligations}</p>
              <p className="text-xs text-muted-foreground">Países con obligación</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5">
            <XCircle className="w-8 h-8 text-destructive/70" />
            <div>
              <p className="text-2xl font-bold text-destructive">{summary.criticalIssues}</p>
              <p className="text-xs text-muted-foreground">Errores críticos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5">
            <AlertTriangle className="w-8 h-8 text-warning/70" />
            <div>
              <p className="text-2xl font-bold text-warning">{summary.highPriorityIssues}</p>
              <p className="text-xs text-muted-foreground">Alta prioridad</p>
            </div>
          </div>
        </div>

        {/* Main Risks */}
        {summary.mainRisks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Principales Riesgos</p>
            <div className="space-y-2">
              {summary.mainRisks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Corrections */}
        {summary.urgentCorrections.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Correcciones Urgentes (24h)</p>
            <div className="space-y-2">
              {summary.urgentCorrections.map((correction, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cfo/5 border border-cfo/20">
                  <TrendingUp className="w-4 h-4 text-cfo flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{correction}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CFOExecutiveSummary;
