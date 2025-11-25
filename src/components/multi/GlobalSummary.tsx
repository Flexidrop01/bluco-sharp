import { MultiAnalysisResult } from '@/types/multiTransaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, TrendingUp, TrendingDown, Percent, 
  Package, AlertTriangle, RefreshCw, Globe 
} from 'lucide-react';

interface GlobalSummaryProps {
  global: MultiAnalysisResult['global'];
  fileCount: number;
}

const GlobalSummary = ({ global, fileCount }: GlobalSummaryProps) => {
  const formatUSD = (amount: number) => 
    `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const metrics = [
    {
      label: 'Ventas Totales',
      value: formatUSD(global.totalSalesUSD),
      icon: DollarSign,
      color: 'text-status-success',
      bg: 'bg-status-success/10'
    },
    {
      label: 'Total Fees',
      value: formatUSD(global.totalFeesUSD),
      subValue: `${global.globalFeePercent.toFixed(1)}%`,
      icon: Percent,
      color: global.globalFeePercent > 30 ? 'text-status-critical' : 'text-status-warning',
      bg: global.globalFeePercent > 30 ? 'bg-status-critical/10' : 'bg-status-warning/10'
    },
    {
      label: 'Devoluciones',
      value: formatUSD(global.totalRefundsUSD),
      subValue: `${global.globalRefundRate.toFixed(1)}%`,
      icon: RefreshCw,
      color: global.globalRefundRate > 8 ? 'text-status-critical' : 'text-status-warning',
      bg: global.globalRefundRate > 8 ? 'bg-status-critical/10' : 'bg-status-warning/10'
    },
    {
      label: 'Reembolsos Amazon',
      value: formatUSD(global.totalReimbursementsUSD),
      icon: TrendingUp,
      color: 'text-status-success',
      bg: 'bg-status-success/10'
    },
    {
      label: 'EBITDA Neto',
      value: formatUSD(global.netProfitUSD),
      subValue: `${global.profitMargin.toFixed(1)}% margen`,
      icon: global.profitMargin > 15 ? TrendingUp : TrendingDown,
      color: global.profitMargin > 15 ? 'text-multi' : 'text-status-warning',
      bg: global.profitMargin > 15 ? 'bg-multi/10' : 'bg-status-warning/10',
      highlight: true
    }
  ];

  const statsCards = [
    { label: 'Archivos', value: fileCount, icon: Package },
    { label: 'Países', value: global.countriesCount, icon: Globe },
    { label: 'SKUs', value: global.skuCount, icon: Package },
    { label: 'Transacciones', value: global.transactionCount.toLocaleString(), icon: RefreshCw }
  ];

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
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
                <span className={global.globalFeePercent > 30 ? 'text-status-critical' : 'text-status-success'}>
                  {global.globalFeePercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${global.globalFeePercent > 30 ? 'bg-status-critical' : 'bg-status-success'}`}
                  style={{ width: `${Math.min(global.globalFeePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &lt;28%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Refund Rate</span>
                <span className={global.globalRefundRate > 8 ? 'text-status-critical' : 'text-status-success'}>
                  {global.globalRefundRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${global.globalRefundRate > 8 ? 'bg-status-critical' : 'bg-status-success'}`}
                  style={{ width: `${Math.min(global.globalRefundRate * 5, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &lt;6%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Margen EBITDA</span>
                <span className={global.profitMargin > 15 ? 'text-status-success' : 'text-status-warning'}>
                  {global.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${global.profitMargin > 15 ? 'bg-status-success' : 'bg-status-warning'}`}
                  style={{ width: `${Math.min(global.profitMargin * 2, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objetivo: &gt;20%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diversificación</span>
                <span className="text-status-success">{global.countriesCount} países</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-multi"
                  style={{ width: `${Math.min(global.countriesCount * 12, 100)}%` }}
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
