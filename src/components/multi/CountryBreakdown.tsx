import { CountryMetrics } from '@/types/multiTransaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { CURRENCY_INFO } from '@/lib/columnMappings';

interface CountryBreakdownProps {
  countries: CountryMetrics[];
}

const CountryBreakdown = ({ countries }: CountryBreakdownProps) => {
  const formatCurrency = (amount: number, currency: string) => {
    const info = CURRENCY_INFO[currency] || { symbol: '$' };
    return `${info.symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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

  const sortedCountries = [...countries].sort((a, b) => b.grossSalesUSD - a.grossSalesUSD);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-multi" />
          Análisis por País
        </h2>
        <span className="text-sm text-muted-foreground">{countries.length} marketplaces</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedCountries.map((country) => {
          const status = getStatusBadge(country.feePercent, country.refundRate);
          
          return (
            <Card key={country.country} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">
                      {country.country === 'USA' ? '🇺🇸' :
                       country.country === 'UK' ? '🇬🇧' :
                       country.country === 'Germany' ? '🇩🇪' :
                       country.country === 'France' ? '🇫🇷' :
                       country.country === 'Spain' ? '🇪🇸' :
                       country.country === 'Italy' ? '🇮🇹' :
                       country.country === 'Canada' ? '🇨🇦' :
                       country.country === 'Mexico' ? '🇲🇽' :
                       country.country === 'Japan' ? '🇯🇵' :
                       country.country === 'Australia' ? '🇦🇺' : '🌍'}
                    </span>
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

                {/* Fee Breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Desglose de Fees</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referral:</span>
                      <span>{formatCurrency(country.fees.referral, country.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FBA:</span>
                      <span>{formatCurrency(country.fees.fba, country.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span>{formatCurrency(country.fees.storage, country.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ads:</span>
                      <span>{formatCurrency(country.fees.advertising, country.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Model Breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Por Modelo</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded bg-primary/10 text-center">
                      <p className="text-xs text-primary">FBA</p>
                      <p className="text-sm font-medium">{formatCurrency(country.modelBreakdown.fba.sales, country.currency)}</p>
                    </div>
                    <div className="flex-1 p-2 rounded bg-amazon-orange/10 text-center">
                      <p className="text-xs text-amazon-orange">FBM</p>
                      <p className="text-sm font-medium">{formatCurrency(country.modelBreakdown.fbm.sales, country.currency)}</p>
                    </div>
                    <div className="flex-1 p-2 rounded bg-idq/10 text-center">
                      <p className="text-xs text-idq">AWD</p>
                      <p className="text-sm font-medium">{formatCurrency(country.modelBreakdown.awd.sales, country.currency)}</p>
                    </div>
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
                    <p className={`text-lg font-bold ${country.ebitdaMargin > 20 ? 'text-status-success' : country.ebitdaMargin > 10 ? 'text-status-warning' : 'text-status-critical'}`}>
                      {country.ebitdaMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Error Alert */}
                {country.hasError && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-status-critical/10 border border-status-critical/30">
                    <AlertTriangle className="w-4 h-4 text-status-critical" />
                    <div className="text-xs">
                      <span className="text-status-critical font-medium">Discrepancia: </span>
                      <span className="text-foreground">{formatCurrency(Math.abs(country.discrepancy), country.currency)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CountryBreakdown;
