import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CityMetrics, RegionMetrics } from '@/types/multiTransaction';
import { MapPin, Building2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DemographicAnalysisProps {
  byCity: CityMetrics[];
  byRegion: RegionMetrics[];
}

const DemographicAnalysis = ({ byCity, byRegion }: DemographicAnalysisProps) => {
  const sortedCities = [...byCity].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);
  const sortedRegions = [...byRegion].sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);

  const cityChartData = sortedCities.map(city => ({
    name: city.city.length > 12 ? city.city.substring(0, 12) + '...' : city.city,
    fullName: city.city,
    sales: city.totalSales,
    transactions: city.transactionCount,
    country: city.country
  }));

  const regionChartData = sortedRegions.map(region => ({
    name: region.region.length > 12 ? region.region.substring(0, 12) + '...' : region.region,
    fullName: region.region,
    sales: region.totalSales,
    transactions: region.transactionCount,
    country: region.country
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--multi))', 'hsl(var(--idq))', 'hsl(var(--cfo))', 'hsl(var(--amazon-orange))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-border/50 rounded-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.country}</p>
          <p className="text-sm text-primary font-bold">${data.sales.toLocaleString()}</p>
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
            <p className="text-2xl font-bold">{byCity.length}</p>
            <p className="text-xs text-muted-foreground">Ciudades</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{byRegion.length}</p>
            <p className="text-xs text-muted-foreground">Regiones</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-status-success mx-auto mb-2" />
            <p className="text-2xl font-bold">${(sortedCities[0]?.totalSales || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Top Ciudad</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
            <p className="text-2xl font-bold">${(sortedRegions[0]?.totalSales || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Top Región</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                    {cityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                    {regionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cities Table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detalle por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedCities.map((city, index) => (
                <div key={`${city.city}-${city.country}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                    <p className="font-bold text-sm">${city.totalSales.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{city.transactionCount} trans.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regions Table */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Detalle por Región</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedRegions.map((region, index) => (
                <div key={`${region.region}-${region.country}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                    <p className="font-bold text-sm">${region.totalSales.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{region.transactionCount} trans.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top SKUs by City */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Productos por Ciudad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCities.slice(0, 6).map((city) => (
              <div key={`${city.city}-products`} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{city.city}</span>
                  <Badge variant="outline" className="text-[10px]">{city.country}</Badge>
                </div>
                <div className="space-y-1">
                  {city.topSKUs.slice(0, 3).map((sku, i) => (
                    <div key={`${city.city}-${sku.sku}`} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[150px] text-muted-foreground" title={sku.description || sku.sku}>
                        {i + 1}. {sku.sku}
                      </span>
                      <span className="font-medium">${sku.sales.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemographicAnalysis;
