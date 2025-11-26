import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { CURRENCY_INFO } from '@/lib/columnMappings';

interface CountryBreakdownV2Props {
  metrics: AggregatedMetrics;
}

const CountryBreakdownV2 = ({ metrics }: CountryBreakdownV2Props) => {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    const info = CURRENCY_INFO[currency] || { symbol: '€' };
    const sign = amount < 0 ? '-' : '';
    return `${sign}${info.symbol}${Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // IMPORTANTE: Usar los totales GLOBALES de metrics (los mismos que el resumen ejecutivo)
  const totalProductSales = metrics.productSales; // Ventas SIN IVA
  const totalSalesWithTax = metrics.salesWithTax; // Ventas CON IVA  
  const totalFees = metrics.totalFees; // Gastos (ya negativos)

  // Convert Map to array and sort by contribution
  const countries = Array.from(metrics.byCountry.entries())
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.productSales - a.productSales);

  // Si solo hay un país, sus datos DEBEN coincidir con los globales
  // Si hay múltiples países, mostrar proporciones relativas
  const isSingleCountry = countries.length === 1;

  const getCountryFlag = (country: string) => {
    const flagMap: Record<string, string> = {
      'Spain': '🇪🇸', 'España': '🇪🇸',
      'USA': '🇺🇸', 'United States': '🇺🇸',
      'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'Gran Bretaña': '🇬🇧',
      'Germany': '🇩🇪', 'Alemania': '🇩🇪',
      'France': '🇫🇷', 'Francia': '🇫🇷',
      'Italy': '🇮🇹', 'Italia': '🇮🇹',
      'Canada': '🇨🇦', 'Canadá': '🇨🇦',
      'Mexico': '🇲🇽', 'México': '🇲🇽',
      'Japan': '🇯🇵', 'Japón': '🇯🇵',
      'Australia': '🇦🇺',
    };
    return flagMap[country] || '🌍';
  };

  return (
    <div className="space-y-6">
      {/* Header con totales globales - SIEMPRE usa los datos de metrics (resumen ejecutivo) */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Ventas SIN IVA</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalProductSales)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Ventas CON IVA</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(totalSalesWithTax)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Gastos Totales</p>
              <p className="text-xl font-bold text-status-critical">{formatCurrency(totalFees)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Países</p>
              <p className="text-xl font-bold">{countries.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de países */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-multi" />
          Desglose por Marketplace
        </h2>
      </div>

      {countries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay datos de países disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {countries.map((country, index) => {
            // Si hay un solo país, usar los valores globales para evitar discrepancias
            const countryProductSales = isSingleCountry ? totalProductSales : country.productSales;
            const countrySalesWithTax = isSingleCountry ? totalSalesWithTax : country.salesWithTax;
            const countryFees = isSingleCountry ? totalFees : country.fees;
            const countrySellingFees = isSingleCountry ? metrics.sellingFees : country.sellingFees;
            const countryFbaFees = isSingleCountry ? metrics.fbaFees : country.fbaFees;
            const countryOtherFees = isSingleCountry ? metrics.otherFees : country.otherFees;
            const countryRefunds = isSingleCountry ? metrics.totalRefunds : country.refunds;

            const ebitda = countrySalesWithTax + countryFees; // fees ya son negativos
            const ebitdaMargin = countrySalesWithTax > 0 ? (ebitda / countrySalesWithTax) * 100 : 0;
            const feePercent = countrySalesWithTax > 0 ? (Math.abs(countryFees) / countrySalesWithTax) * 100 : 0;
            const contributionPercent = isSingleCountry ? 100 : (totalSalesWithTax > 0 ? (countrySalesWithTax / totalSalesWithTax) * 100 : 0);
            
            return (
              <Card key={country.key} className="glass-card hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCountryFlag(country.country)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{country.country}</h3>
                        <p className="text-xs text-muted-foreground">{country.marketplace} • {country.currency}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatPercent(contributionPercent)} del total
                    </Badge>
                  </div>

                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Ventas SIN IVA</p>
                      </div>
                      <p className="text-lg font-bold">{formatCurrency(countryProductSales, country.currency)}</p>
                    </div>
                    
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                      <div className="flex items-center gap-1 mb-1">
                        <ShoppingCart className="w-3 h-3 text-primary" />
                        <p className="text-xs text-primary">Ventas CON IVA</p>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(countrySalesWithTax, country.currency)}</p>
                    </div>
                    
                    <div className="bg-status-critical/10 rounded-lg p-3 border border-status-critical/20">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown className="w-3 h-3 text-status-critical" />
                        <p className="text-xs text-status-critical">Gastos</p>
                      </div>
                      <p className="text-lg font-bold text-status-critical">{formatCurrency(countryFees, country.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatPercent(feePercent)}</p>
                    </div>
                    
                    <div className={`rounded-lg p-3 border ${ebitda >= 0 ? 'bg-status-success/10 border-status-success/20' : 'bg-status-critical/10 border-status-critical/20'}`}>
                      <p className="text-xs text-muted-foreground mb-1">EBITDA</p>
                      <p className={`text-lg font-bold ${ebitda >= 0 ? 'text-status-success' : 'text-status-critical'}`}>
                        {formatCurrency(ebitda, country.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatPercent(ebitdaMargin)} margen</p>
                    </div>
                  </div>

                  {/* Desglose de gastos */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Tarifas venta</p>
                      <p className="text-sm font-medium">{formatCurrency(countrySellingFees, country.currency)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">FBA Fees</p>
                      <p className="text-sm font-medium">{formatCurrency(countryFbaFees, country.currency)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Otros</p>
                      <p className="text-sm font-medium">{formatCurrency(countryOtherFees, country.currency)}</p>
                    </div>
                  </div>

                  {/* Footer con métricas adicionales */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <span>{country.orderCount.toLocaleString()} pedidos</span>
                    <span>{country.transactionCount.toLocaleString()} transacciones</span>
                    {countryRefunds > 0 && (
                      <span className="text-status-warning">Reembolsos: {formatCurrency(countryRefunds, country.currency)}</span>
                    )}
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
