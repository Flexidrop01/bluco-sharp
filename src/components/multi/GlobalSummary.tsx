import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, TrendingUp, TrendingDown, Percent, 
  Package, AlertTriangle, RefreshCw, Globe, Euro
} from 'lucide-react';
import { CURRENCY_INFO } from '@/lib/columnMappings';

interface GlobalSummaryProps {
  metrics: AggregatedMetrics;
  fileCount: number;
}

const GlobalSummary = ({ metrics, fileCount }: GlobalSummaryProps) => {
  // Detectar moneda principal
  const primaryCurrency = Array.from(metrics.currencies)[0] || 'EUR';
  const currencyInfo = CURRENCY_INFO[primaryCurrency] || { symbol: '€' };
  
  const formatCurrency = (amount: number) => {
    const sign = amount < 0 ? '-' : '';
    return `${sign}${currencyInfo.symbol}${Math.abs(amount).toLocaleString('es-ES', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Usar datos EXACTOS del procesador
  const ventasSinIVA = metrics.productSales;
  const ventasConIVA = metrics.salesWithTax;
  const gastosTotales = Math.abs(metrics.totalFees);
  const reembolsos = metrics.totalRefunds;
  const ebitda = metrics.ebitda;
  const margenEbitda = ventasConIVA > 0 ? (ebitda / ventasConIVA) * 100 : 0;
  const feePercent = ventasConIVA > 0 ? (gastosTotales / ventasConIVA) * 100 : 0;
  const refundRate = ventasConIVA > 0 ? (reembolsos / ventasConIVA) * 100 : 0;

  const mainMetrics = [
    {
      label: 'Ventas SIN IVA',
      value: formatCurrency(ventasSinIVA),
      icon: DollarSign,
      color: 'text-foreground',
      bg: 'bg-muted/50'
    },
    {
      label: 'Ventas CON IVA',
      value: formatCurrency(ventasConIVA),
      icon: primaryCurrency === 'EUR' ? Euro : DollarSign,
      color: 'text-status-success',
      bg: 'bg-status-success/10'
    },
    {
      label: 'Gastos Totales',
      value: formatCurrency(-gastosTotales),
      subValue: formatPercent(feePercent),
      icon: Percent,
      color: 'text-status-critical',
      bg: 'bg-status-critical/10'
    },
    {
      label: 'Reembolsos',
      value: formatCurrency(reembolsos),
      subValue: formatPercent(refundRate),
      icon: RefreshCw,
      color: refundRate > 8 ? 'text-status-critical' : 'text-status-warning',
      bg: refundRate > 8 ? 'bg-status-critical/10' : 'bg-status-warning/10'
    },
    {
      label: 'EBITDA',
      value: formatCurrency(ebitda),
      subValue: `${formatPercent(margenEbitda)} margen`,
      icon: ebitda > 0 ? TrendingUp : TrendingDown,
      color: ebitda > 0 ? 'text-multi' : 'text-status-critical',
      bg: ebitda > 0 ? 'bg-multi/10' : 'bg-status-critical/10',
      highlight: true
    }
  ];

  const statsCards = [
    { label: 'Archivos', value: fileCount, icon: Package },
    { label: 'Países', value: metrics.byCountry.size, icon: Globe },
    { label: 'SKUs', value: metrics.uniqueSKUs.size, icon: Package },
    { label: 'Transacciones', value: metrics.validTransactions.toLocaleString(), icon: RefreshCw }
  ];

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mainMetrics.map((metric) => (
          <Card 
            key={metric.label} 
            className={`glass-card ${metric.highlight ? 'border-multi/50 ring-1 ring-multi/30' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                  {metric.subValue && (
                    <p className="text-xs text-muted-foreground">{metric.subValue}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <stat.icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Health Indicators */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Indicadores de Salud del Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee %</span>
                <span className={feePercent > 30 ? 'text-status-critical' : 'text-status-success'}>
                  {formatPercent(feePercent)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${feePercent > 30 ? 'bg-status-critical' : 'bg-status-success'}`}
                  style={{ width: `${Math.min(feePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &lt;28%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Refund Rate</span>
                <span className={refundRate > 8 ? 'text-status-critical' : 'text-status-success'}>
                  {formatPercent(refundRate)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${refundRate > 8 ? 'bg-status-critical' : 'bg-status-success'}`}
                  style={{ width: `${Math.min(refundRate * 5, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &lt;6%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Margen EBITDA</span>
                <span className={margenEbitda > 15 ? 'text-status-success' : 'text-status-warning'}>
                  {formatPercent(margenEbitda)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${margenEbitda > 15 ? 'bg-status-success' : 'bg-status-warning'}`}
                  style={{ width: `${Math.min(Math.max(margenEbitda, 0) * 2, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &gt;20%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diversificación</span>
                <span className="text-status-success">{metrics.byCountry.size} países</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-multi"
                  style={{ width: `${Math.min(metrics.byCountry.size * 12, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: 5+ países</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalSummary;
