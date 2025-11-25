import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { AnalysisResult, SKUData, MarketplaceData } from '@/types/analysis';
import MetricCard from './MetricCard';
import { cn } from '@/lib/utils';

interface NumericalDiagnosisProps {
  metrics: AnalysisResult['metrics'];
  skuPerformance: SKUData[];
  marketplaceBreakdown: MarketplaceData[];
}

const NumericalDiagnosis = ({ metrics, skuPerformance, marketplaceBreakdown }: NumericalDiagnosisProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: 'critical' | 'warning' | 'success') => {
    switch (status) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-destructive/20 text-destructive">CRÍTICO</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">ALERTA</span>;
      case 'success':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/20 text-success">OK</span>;
    }
  };

  return (
    <section className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="glass-card p-6">
        <div className="section-header">
          <div className="section-icon">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Diagnóstico Numérico</h2>
            <p className="text-sm text-muted-foreground">KPIs principales del período</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard metric={metrics.grossSales} delay={0} />
          <MetricCard metric={metrics.netSales} delay={50} />
          <MetricCard metric={metrics.totalFees} delay={100} />
          <MetricCard metric={metrics.feePercent} delay={150} />
          <MetricCard metric={metrics.refunds} delay={200} />
          <MetricCard metric={metrics.refundRate} delay={250} />
          {metrics.profitEstimate && (
            <MetricCard metric={metrics.profitEstimate} delay={300} />
          )}
        </div>
      </div>

      {/* SKU Performance Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Rendimiento por SKU</h3>
          <span className="text-xs text-muted-foreground">{skuPerformance.length} productos</span>
        </div>
        
        <div className="overflow-x-auto scrollbar-thin">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th className="text-right">Ventas</th>
                <th className="text-right">Fees</th>
                <th className="text-right">% Fee</th>
                <th className="text-right">Refund %</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {skuPerformance.map((sku, index) => (
                <tr key={sku.sku} className={cn(
                  'transition-colors',
                  sku.status === 'critical' && 'bg-destructive/5'
                )}>
                  <td className="font-mono text-xs">{sku.sku}</td>
                  <td className="max-w-[200px] truncate">{sku.name}</td>
                  <td className="text-right font-medium">{formatCurrency(sku.sales)}</td>
                  <td className="text-right">{formatCurrency(sku.fees)}</td>
                  <td className={cn(
                    'text-right font-medium',
                    sku.feePercent > 35 ? 'text-destructive' : sku.feePercent > 30 ? 'text-warning' : 'text-success'
                  )}>
                    {formatPercent(sku.feePercent)}
                  </td>
                  <td className={cn(
                    'text-right font-medium',
                    sku.refundRate > 8 ? 'text-destructive' : sku.refundRate > 5 ? 'text-warning' : 'text-success'
                  )}>
                    {formatPercent(sku.refundRate)}
                  </td>
                  <td>{getStatusBadge(sku.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketplace Breakdown */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Desglose por Marketplace</h3>
          <span className="text-xs text-muted-foreground">{marketplaceBreakdown.length} mercados</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketplaceBreakdown.map((mp, index) => (
            <div 
              key={mp.marketplace}
              className={cn(
                'p-4 rounded-lg border transition-all',
                mp.status === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                mp.status === 'warning' ? 'border-warning/30 bg-warning/5' :
                'border-border/50 bg-muted/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">{mp.marketplace}</span>
                {getStatusBadge(mp.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Ventas</p>
                  <p className="font-semibold text-foreground">{formatCurrency(mp.sales)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fees</p>
                  <p className="font-semibold text-foreground">{formatCurrency(mp.fees)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">% Fees</p>
                  <p className={cn(
                    'font-semibold',
                    mp.feePercent > 35 ? 'text-destructive' : mp.feePercent > 30 ? 'text-warning' : 'text-success'
                  )}>
                    {formatPercent(mp.feePercent)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pedidos</p>
                  <p className="font-semibold text-foreground">{mp.orders}</p>
                </div>
              </div>
              
              {mp.status === 'critical' && (
                <div className="mt-3 pt-3 border-t border-destructive/20 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Requiere acción inmediata</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NumericalDiagnosis;
