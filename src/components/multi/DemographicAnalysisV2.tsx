import { AggregatedMetrics, CityAggregates, RegionAggregates } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DemographicAnalysisV2Props {
  metrics: AggregatedMetrics;
}

const DemographicAnalysisV2 = ({ metrics }: DemographicAnalysisV2Props) => {
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Convert Maps to arrays and sort
  const cities = Array.from(metrics.byCity?.entries() || [])
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.grossSales - a.grossSales);

  const regions = Array.from(metrics.byRegion?.entries() || [])
    .map(([key, data]) => ({ 
      key, 
      ...data,
      cityCount: data.cities?.size || 0
    }))
    .sort((a, b) => b.grossSales - a.grossSales);

  const topCities = cities.slice(0, 10);
  const topRegions = regions.slice(0, 10);

  const cityChartData = topCities.map(city => ({
    name: city.city.length > 12 ? city.city.substring(0, 12) + '...' : city.city,
    fullName: city.city,
    sales: city.grossSales,
    transactions: city.transactionCount,
    country: city.country
  }));

  const regionChartData = topRegions.map(region => ({
    name: region.region.length > 12 ? region.region.substring(0, 12) + '...' : region.region,
    fullName: region.region,
    sales: region.grossSales,
    transactions: region.transactionCount,
    country: region.country
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--multi))', 'hsl(var(--idq))', 'hsl(var(--cfo))', 'hsl(var(--amazon-orange))'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-border/50 rounded-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.country}</p>
          <p className="text-sm text-primary font-bold">{formatCurrency(data.sales)}</p>
          <p className="text-xs text-muted-foreground">{data.transactions} transacciones</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-multi mx-auto mb-2" />
            <p className="text-2xl font-bold">{cities.length}</p>
            <p className="text-xs text-muted-foreground">Ciudades</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{regions.length}</p>
            <p className="text-xs text-muted-foreground">Regiones</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-status-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(topCities[0]?.grossSales || 0)}</p>
            <p className="text-xs text-muted-foreground">Top Ciudad</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(topRegions[0]?.grossSales || 0)}</p>
            <p className="text-xs text-muted-foreground">Top Región</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {cities.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-multi" />
                Top 10 Ciudades por Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                      {cityChartData.map((entry, index) => (
                        <Cell key={`cell-city-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Regions Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Top 10 Regiones por Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                      {regionChartData.map((entry, index) => (
                        <Cell key={`cell-region-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cities Table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detalle por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            {cities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos de ciudades</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {topCities.map((city, index) => (
                  <div 
                    key={`${city.city}-${city.country}-${index}`} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-multi/20 text-multi text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{city.city}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{city.region}</span>
                          <Badge variant="outline" className="text-[10px] px-1">{city.country}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(city.grossSales)}</p>
                      <p className="text-xs text-muted-foreground">{city.transactionCount} trans.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regions Table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detalle por Región</CardTitle>
          </CardHeader>
          <CardContent>
            {regions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos de regiones</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {topRegions.map((region, index) => (
                  <div 
                    key={`${region.region}-${region.country}-${index}`} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{region.region}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{region.cityCount} ciudades</span>
                          <Badge variant="outline" className="text-[10px] px-1">{region.country}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(region.grossSales)}</p>
                      <p className="text-xs text-muted-foreground">{region.transactionCount} trans.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemographicAnalysisV2;
