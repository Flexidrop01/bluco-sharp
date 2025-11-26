import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp,
  DollarSign, Percent, RefreshCw, Package, Globe, Zap, Target
} from 'lucide-react';
import { CURRENCY_INFO } from '@/lib/columnMappings';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: string;
  recommendation: string;
  icon: React.ReactNode;
  impact: 'high' | 'medium' | 'low';
}

interface AlertsPanelProps {
  metrics: AggregatedMetrics;
}

const AlertsPanel = ({ metrics }: AlertsPanelProps) => {
  const primaryCurrency = Array.from(metrics.currencies)[0] || 'EUR';
  const currencyInfo = CURRENCY_INFO[primaryCurrency] || { symbol: '€' };
  
  const formatCurrency = (amount: number) => {
    return `${currencyInfo.symbol}${Math.abs(amount).toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Calcular métricas para generar alertas
  const ventasConIVA = metrics.salesWithTax;
  const gastosTotales = Math.abs(metrics.totalFees);
  const reembolsos = metrics.totalRefunds;
  const ebitda = metrics.ebitda;
  
  const feePercent = ventasConIVA > 0 ? (gastosTotales / ventasConIVA) * 100 : 0;
  const refundRate = ventasConIVA > 0 ? (reembolsos / ventasConIVA) * 100 : 0;
  const margenEbitda = ventasConIVA > 0 ? (ebitda / ventasConIVA) * 100 : 0;
  const sellingFeePercent = ventasConIVA > 0 ? (Math.abs(metrics.sellingFees) / ventasConIVA) * 100 : 0;
  const fbaFeePercent = ventasConIVA > 0 ? (Math.abs(metrics.fbaFees) / ventasConIVA) * 100 : 0;
  const storageFeePercent = ventasConIVA > 0 ? (Math.abs(metrics.storageFees) / ventasConIVA) * 100 : 0;
  
  // Discrepancia
  const discrepancy = Math.abs(metrics.calculatedTotal - metrics.actualTotal);
  const hasDiscrepancy = discrepancy > 1;

  // Generar alertas basadas en análisis
  const alerts: Alert[] = [];

  // ALERTAS CRÍTICAS
  if (margenEbitda < 0) {
    alerts.push({
      id: 'negative-ebitda',
      type: 'critical',
      title: 'EBITDA Negativo',
      description: `Tu negocio está perdiendo dinero. El EBITDA es ${formatCurrency(ebitda)} (${formatPercent(margenEbitda)} margen).`,
      metric: formatCurrency(ebitda),
      recommendation: 'URGENTE: Revisa la estructura de costes, aumenta precios o reduce SKUs no rentables.',
      icon: <TrendingDown className="w-5 h-5" />,
      impact: 'high'
    });
  }

  if (feePercent > 40) {
    alerts.push({
      id: 'very-high-fees',
      type: 'critical',
      title: 'Gastos Amazon Excesivos',
      description: `Los fees de Amazon representan el ${formatPercent(feePercent)} de tus ventas, muy por encima del benchmark del sector (28-35%).`,
      metric: formatPercent(feePercent),
      recommendation: 'Analiza productos con fees desproporcionados. Considera optimizar tamaños de packaging o cambiar a FBM para algunos productos.',
      icon: <Percent className="w-5 h-5" />,
      impact: 'high'
    });
  }

  if (refundRate > 10) {
    alerts.push({
      id: 'very-high-refunds',
      type: 'critical',
      title: 'Tasa de Devolución Crítica',
      description: `La tasa de devolución del ${formatPercent(refundRate)} está muy por encima del 6% aceptable. Esto impacta gravemente la rentabilidad.`,
      metric: formatPercent(refundRate),
      recommendation: 'Revisa descripciones de productos, calidad de imágenes y opiniones de clientes. Identifica productos problemáticos.',
      icon: <RefreshCw className="w-5 h-5" />,
      impact: 'high'
    });
  }

  // ALERTAS DE ADVERTENCIA
  if (feePercent > 30 && feePercent <= 40) {
    alerts.push({
      id: 'high-fees',
      type: 'warning',
      title: 'Fees por Encima del Objetivo',
      description: `Los gastos Amazon (${formatPercent(feePercent)}) superan el objetivo del 28%. Tienes margen de optimización.`,
      metric: formatPercent(feePercent),
      recommendation: 'Revisa las comisiones de venta y logística FBA por producto. Algunos pueden tener fees desproporcionados.',
      icon: <Percent className="w-5 h-5" />,
      impact: 'medium'
    });
  }

  if (refundRate > 6 && refundRate <= 10) {
    alerts.push({
      id: 'high-refunds',
      type: 'warning',
      title: 'Tasa de Devolución Elevada',
      description: `El ${formatPercent(refundRate)} de devoluciones supera el benchmark del 6%. Esto reduce tu beneficio neto.`,
      metric: formatPercent(refundRate),
      recommendation: 'Identifica los SKUs con mayor tasa de devolución y mejora sus listings o considera descontinuarlos.',
      icon: <RefreshCw className="w-5 h-5" />,
      impact: 'medium'
    });
  }

  if (margenEbitda > 0 && margenEbitda < 15) {
    alerts.push({
      id: 'low-margin',
      type: 'warning',
      title: 'Margen EBITDA Bajo',
      description: `El margen EBITDA del ${formatPercent(margenEbitda)} está por debajo del objetivo del 20%. El negocio es rentable pero con poco colchón.`,
      metric: formatPercent(margenEbitda),
      recommendation: 'Optimiza gastos, negocia mejores precios de producto o aumenta precios de venta donde el mercado lo permita.',
      icon: <TrendingDown className="w-5 h-5" />,
      impact: 'medium'
    });
  }

  if (fbaFeePercent > 15) {
    alerts.push({
      id: 'high-fba-fees',
      type: 'warning',
      title: 'Logística FBA Costosa',
      description: `Los fees de FBA (${formatPercent(fbaFeePercent)}) superan el 15%. Revisa dimensiones y pesos de productos.`,
      metric: formatPercent(fbaFeePercent),
      recommendation: 'Considera reducir tamaño de packaging o evaluar FBM para productos voluminosos.',
      icon: <Package className="w-5 h-5" />,
      impact: 'medium'
    });
  }

  if (storageFeePercent > 3) {
    alerts.push({
      id: 'high-storage',
      type: 'warning',
      title: 'Almacenamiento Costoso',
      description: `Los fees de almacenamiento (${formatPercent(storageFeePercent)}) son elevados. Posible exceso de inventario.`,
      metric: formatPercent(storageFeePercent),
      recommendation: 'Ajusta niveles de inventario, considera promociones para stock antiguo o solicita devoluciones.',
      icon: <Package className="w-5 h-5" />,
      impact: 'medium'
    });
  }

  if (hasDiscrepancy && discrepancy > 100) {
    alerts.push({
      id: 'calculation-discrepancy',
      type: 'warning',
      title: 'Discrepancia en Cálculos',
      description: `Existe una diferencia de ${formatCurrency(discrepancy)} entre el total calculado y el total real del archivo.`,
      metric: formatCurrency(discrepancy),
      recommendation: 'Revisa que todas las transacciones estén correctamente categorizadas. Puede haber tipos de transacción no reconocidos.',
      icon: <AlertTriangle className="w-5 h-5" />,
      impact: 'low'
    });
  }

  // ALERTAS INFORMATIVAS / OPORTUNIDADES
  if (metrics.byCountry.size === 1) {
    alerts.push({
      id: 'single-market',
      type: 'info',
      title: 'Concentración en Un Solo Mercado',
      description: 'Todo el negocio está en un único marketplace. Considera diversificar para reducir riesgo.',
      recommendation: 'Evalúa expansión a otros marketplaces europeos (DE, FR, IT) para diversificar ingresos.',
      icon: <Globe className="w-5 h-5" />,
      impact: 'low'
    });
  }

  if (sellingFeePercent > 15) {
    alerts.push({
      id: 'category-fees',
      type: 'info',
      title: 'Comisiones de Venta Altas',
      description: `Las comisiones de venta (${formatPercent(sellingFeePercent)}) sugieren productos en categorías con fees elevados.`,
      recommendation: 'Algunas categorías tienen comisiones más bajas. Analiza si puedes recategorizar productos.',
      icon: <DollarSign className="w-5 h-5" />,
      impact: 'low'
    });
  }

  // ALERTAS POSITIVAS
  if (margenEbitda >= 20) {
    alerts.push({
      id: 'good-margin',
      type: 'success',
      title: 'Excelente Margen EBITDA',
      description: `Tu margen EBITDA del ${formatPercent(margenEbitda)} supera el objetivo del 20%. ¡Buen trabajo!`,
      metric: formatPercent(margenEbitda),
      recommendation: 'Mantén esta eficiencia. Considera reinvertir en inventario o publicidad para escalar.',
      icon: <TrendingUp className="w-5 h-5" />,
      impact: 'low'
    });
  }

  if (refundRate <= 4) {
    alerts.push({
      id: 'low-refunds',
      type: 'success',
      title: 'Excelente Tasa de Devolución',
      description: `Solo el ${formatPercent(refundRate)} de devoluciones. Muy por debajo del 6% benchmark.`,
      metric: formatPercent(refundRate),
      recommendation: 'Tus listings y productos generan satisfacción. Usa esto como ventaja competitiva.',
      icon: <CheckCircle className="w-5 h-5" />,
      impact: 'low'
    });
  }

  if (feePercent <= 28) {
    alerts.push({
      id: 'good-fees',
      type: 'success',
      title: 'Estructura de Gastos Óptima',
      description: `Los fees Amazon (${formatPercent(feePercent)}) están por debajo del objetivo del 28%.`,
      metric: formatPercent(feePercent),
      recommendation: 'Tu estructura de costes es competitiva. Prioriza el crecimiento de ventas.',
      icon: <CheckCircle className="w-5 h-5" />,
      impact: 'low'
    });
  }

  // Ordenar por severidad
  const sortedAlerts = alerts.sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2, success: 3 };
    return priority[a.type] - priority[b.type];
  });

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-status-critical/50 bg-status-critical/5';
      case 'warning':
        return 'border-status-warning/50 bg-status-warning/5';
      case 'success':
        return 'border-status-success/50 bg-status-success/5';
      default:
        return 'border-primary/50 bg-primary/5';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-status-critical';
      case 'warning': return 'text-status-warning';
      case 'success': return 'text-status-success';
      default: return 'text-primary';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const successCount = alerts.filter(a => a.type === 'success').length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Alertas</p>
              <p className="text-2xl font-bold">{alerts.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Críticas</p>
              <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-status-critical' : 'text-foreground'}`}>
                {criticalCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Advertencias</p>
              <p className={`text-2xl font-bold ${warningCount > 0 ? 'text-status-warning' : 'text-foreground'}`}>
                {warningCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Logros</p>
              <p className={`text-2xl font-bold ${successCount > 0 ? 'text-status-success' : 'text-foreground'}`}>
                {successCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {sortedAlerts.map((alert) => (
          <Card key={alert.id} className={`glass-card border ${getAlertStyles(alert.type)}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  alert.type === 'critical' ? 'bg-status-critical/20' :
                  alert.type === 'warning' ? 'bg-status-warning/20' :
                  alert.type === 'success' ? 'bg-status-success/20' :
                  'bg-primary/20'
                }`}>
                  <span className={getIconColor(alert.type)}>{alert.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{alert.title}</h3>
                    <Badge variant={getBadgeVariant(alert.type) as any} className="text-xs">
                      {alert.type === 'critical' ? 'Crítico' : 
                       alert.type === 'warning' ? 'Atención' :
                       alert.type === 'success' ? 'Positivo' : 'Info'}
                    </Badge>
                    {alert.metric && (
                      <Badge variant="outline" className="text-xs">{alert.metric}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                    <Target className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{alert.recommendation}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">¡Todo en Orden!</h3>
              <p className="text-muted-foreground">
                No se detectaron problemas significativos en tu cuenta. Continúa monitorizando regularmente.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
