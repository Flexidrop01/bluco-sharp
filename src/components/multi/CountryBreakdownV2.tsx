import { AggregatedMetrics, CountryAggregates } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle } from 'lucide-react';
import { CURRENCY_INFO } from '@/lib/columnMappings';

interface CountryBreakdownV2Props {
  metrics: AggregatedMetrics;
}

const CountryBreakdownV2 = ({ metrics }: CountryBreakdownV2Props) => {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const info = CURRENCY_INFO[currency] || { symbol: '€' };
    return `${info.symbol}${Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (feePercent: number, refundRate: number) => {
    if (feePercent > 35 || refundRate > 10) {
      return { variant: 'destructive' as const, label: 'Crítico', color: 'text-status-critical' };
    }
    if (feePercent > 30 || refundRate > 7) {
      return { variant: 'secondary' as const, label: 'Alerta', color: 'text-status-warning' };
    }
    return { variant: 'default' as const, label: 'OK', color: 'text-status-success' };
  };

  // Convert Map to array and sort by grossSales
  const countries = Array.from(metrics.byCountry.entries())
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.grossSales - a.grossSales);

  const getCountryFlag = (country: string) => {
    const flagMap: Record<string, string> = {
      'Spain': '🇪🇸',
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'Japan': '🇯🇵',
      'Australia': '🇦🇺',
    };
    return flagMap[country] || '🌍';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-multi" />
          Análisis por País
        </h2>
        <span className="text-sm text-muted-foreground">{countries.length} marketplaces</span>
      </div>

      {countries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay datos de países disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {countries.map((country) => {
            const status = getStatusBadge(country.feePercent, country.refundRate);
            const ebitdaMargin = country.grossSales > 0 
              ? (country.ebitda / country.grossSales) * 100 
              : 0;
            
            return (
              <Card key={country.key} className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(country.country)}</span>
                      {country.country}
                    </CardTitle>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{country.marketplace} • {country.currency}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Ventas</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(country.grossSales, country.currency)}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Fees</p>
                      <p className={`text-lg font-bold ${country.feePercent > 32 ? 'text-status-critical' : 'text-foreground'}`}>
                        {country.feePercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Devoluciones</p>
                      <p className={`text-lg font-bold ${country.refundRate > 8 ? 'text-status-critical' : 'text-foreground'}`}>
                        {country.refundRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Ventas brutas:</span>
                      <span className="font-medium">{formatCurrency(country.grossSales, country.currency)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Fees totales:</span>
                      <span className="font-medium text-status-critical">{formatCurrency(country.fees, country.currency)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Reembolsos:</span>
                      <span className="font-medium text-status-warning">{formatCurrency(country.refunds, country.currency)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/20 rounded">
                      <span className="text-muted-foreground">Reembolsos:</span>
                      <span className="font-medium text-status-success">{formatCurrency(country.reimbursements, country.currency)}</span>
                    </div>
                  </div>

                  {/* EBITDA */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-multi/10 border border-multi/20">
                    <div>
                      <p className="text-xs text-multi font-medium">EBITDA</p>
                      <p className="text-xl font-bold text-multi">
                        {formatCurrency(country.ebitda, country.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Margen</p>
                      <p className={`text-lg font-bold ${ebitdaMargin > 20 ? 'text-status-success' : ebitdaMargin > 10 ? 'text-status-warning' : 'text-status-critical'}`}>
                        {ebitdaMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Transaction count */}
                  <div className="text-center text-xs text-muted-foreground">
                    {country.transactionCount.toLocaleString()} transacciones
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CountryBreakdownV2;
