import { CFOAnalysisResult, CountryVATSummary } from '@/types/cfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CFOChartsProps {
  analysis: CFOAnalysisResult;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const CFOCharts = ({ analysis }: CFOChartsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value);

  // VAT by country data
  const vatByCountryData = analysis.countryObligations
    .slice(0, 8)
    .map(c => ({
      country: c.countryCode,
      vatCollected: c.totalVatCollected,
      vatDue: c.totalVatDue,
      sales: c.totalSales
    }));

  // VAT by rate data
  const vatByRateData = analysis.vatAnalysis.byRate.map(r => ({
    name: `${r.rate}%`,
    value: r.amount,
    count: r.count
  }));

  // Error distribution data
  const errorDistribution = [
    { name: 'Críticos', value: analysis.errors.filter(e => e.severity === 'critical').length, color: '#ef4444' },
    { name: 'Altos', value: analysis.errors.filter(e => e.severity === 'high').length, color: '#f59e0b' },
    { name: 'Medios', value: analysis.errors.filter(e => e.severity === 'medium').length, color: '#3b82f6' },
    { name: 'Bajos', value: analysis.errors.filter(e => e.severity === 'low').length, color: '#10b981' },
  ].filter(e => e.value > 0);

  // Sales classification data
  const salesClassificationData = [
    { name: 'Doméstico', value: analysis.countryObligations.reduce((sum, c) => sum + c.domesticSales, 0) },
    { name: 'Intra-EU B2B', value: analysis.intraEu.b2bTotal },
    { name: 'Intra-EU B2C', value: analysis.intraEu.b2cTotal },
    { name: 'Exportaciones', value: analysis.exports.totalExportsOutsideEu },
  ].filter(d => d.value > 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* VAT by Country */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cfo" />
            IVA por País
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vatByCountryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="country" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="vatCollected" name="IVA Cobrado" fill="hsl(var(--cfo))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vatDue" name="IVA Debido" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* VAT by Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribución por Tipo IVA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vatByRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                >
                  {vatByRateData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sales Classification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Clasificación de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesClassificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name }) => name}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                >
                  {salesClassificationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Error Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribución de Errores</CardTitle>
        </CardHeader>
        <CardContent>
          {errorDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No se detectaron errores
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Errores" radius={[0, 4, 4, 0]}>
                    {errorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CFOCharts;
