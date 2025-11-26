import { AggregatedMetrics } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Package, Truck, BarChart3, Percent, 
  ShoppingCart, Archive, Megaphone, ArrowDownRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { CURRENCY_INFO } from '@/lib/columnMappings';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface FeeBreakdownProps {
  metrics: AggregatedMetrics;
}

const FeeBreakdown = ({ metrics }: FeeBreakdownProps) => {
  const [showAllTypes, setShowAllTypes] = useState(false);
  
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

  // Totales principales
  const ventasConIVA = metrics.salesWithTax;
  const gastosTotales = Math.abs(metrics.totalFees);
  
  // Desglose de gastos por categoría principal
  const sellingFees = Math.abs(metrics.sellingFees);
  const fbaFees = Math.abs(metrics.fbaFees);
  const otherTransactionFees = Math.abs(metrics.otherTransactionFees);
  const otherFees = Math.abs(metrics.otherFees);
  const storageFees = Math.abs(metrics.storageFees);
  const advertisingFees = Math.abs(metrics.advertisingFees);
  const inboundFees = Math.abs(metrics.inboundFees);

  // Calcular porcentajes sobre ventas
  const calcPercent = (value: number) => ventasConIVA > 0 ? (value / ventasConIVA) * 100 : 0;

  // Categorías principales de fees
  const mainFeeCategories = [
    { 
      name: 'Comisiones Venta', 
      amount: sellingFees, 
      percent: calcPercent(sellingFees),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      description: 'Comisión por referencia de Amazon sobre cada venta'
    },
    { 
      name: 'Logística FBA', 
      amount: fbaFees, 
      percent: calcPercent(fbaFees),
      icon: Truck,
      color: 'bg-orange-500',
      description: 'Tarifas de envío y fulfillment de Amazon'
    },
    { 
      name: 'Almacenamiento', 
      amount: storageFees, 
      percent: calcPercent(storageFees),
      icon: Archive,
      color: 'bg-purple-500',
      description: 'Tarifas de almacenamiento en centros FBA'
    },
    { 
      name: 'Publicidad', 
      amount: advertisingFees, 
      percent: calcPercent(advertisingFees),
      icon: Megaphone,
      color: 'bg-green-500',
      description: 'Gasto en PPC y publicidad de Amazon'
    },
    { 
      name: 'Inbound/Placement', 
      amount: inboundFees, 
      percent: calcPercent(inboundFees),
      icon: ArrowDownRight,
      color: 'bg-cyan-500',
      description: 'Tarifas de colocación de inventario'
    },
    { 
      name: 'Otras Transacciones', 
      amount: otherTransactionFees, 
      percent: calcPercent(otherTransactionFees),
      icon: DollarSign,
      color: 'bg-amber-500',
      description: 'Otras tarifas por transacción'
    },
    { 
      name: 'Otros', 
      amount: otherFees, 
      percent: calcPercent(otherFees),
      icon: Package,
      color: 'bg-gray-500',
      description: 'Tarifas misceláneas y ajustes'
    }
  ].filter(f => f.amount > 0).sort((a, b) => b.amount - a.amount);

  // Datos para gráficos
  const pieData = mainFeeCategories.map(cat => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color.replace('bg-', '').replace('-500', '')
  }));

  const COLORS = ['#3b82f6', '#f97316', '#a855f7', '#22c55e', '#06b6d4', '#f59e0b', '#6b7280'];

  // Desglose por tipo de fee desde byFeeType
  const feesByType = Array.from(metrics.byFeeType.entries())
    .map(([type, amount]) => ({ type, amount: Math.abs(amount), percent: calcPercent(Math.abs(amount)) }))
    .sort((a, b) => b.amount - a.amount);

  const displayedFeeTypes = showAllTypes ? feesByType : feesByType.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header con totales */}
      <Card className="glass-card border-cfo/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Ventas CON IVA</p>
              <p className="text-xl font-bold text-status-success">{formatCurrency(ventasConIVA)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Gastos Totales</p>
              <p className="text-xl font-bold text-status-critical">{formatCurrency(-gastosTotales)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">% Gastos/Ventas</p>
              <p className={`text-xl font-bold ${calcPercent(gastosTotales) > 30 ? 'text-status-critical' : 'text-status-warning'}`}>
                {formatPercent(calcPercent(gastosTotales))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Tipos de Fee</p>
              <p className="text-xl font-bold">{metrics.byFeeType.size}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de distribución */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cfo" />
              Distribución de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categorías principales */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="w-4 h-4 text-cfo" />
              Categorías de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mainFeeCategories.map((category, index) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${category.color}/20 flex items-center justify-center`}>
                        <category.icon className={`w-4 h-4 ${category.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-status-critical">{formatCurrency(-category.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatPercent(category.percent)}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${category.color}`}
                      style={{ width: `${Math.min((category.amount / gastosTotales) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose detallado por tipo */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-cfo" />
              Desglose Detallado por Tipo de Fee
            </CardTitle>
            <Badge variant="outline">{feesByType.length} tipos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayedFeeTypes.map((fee, index) => (
              <div 
                key={fee.type} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{fee.type}</p>
                    <p className="text-xs text-muted-foreground">{formatPercent(fee.percent)} de ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-status-critical">{formatCurrency(-fee.amount)}</p>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full rounded-full bg-status-critical"
                      style={{ width: `${Math.min((fee.amount / gastosTotales) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {feesByType.length > 8 && (
            <button 
              onClick={() => setShowAllTypes(!showAllTypes)}
              className="w-full mt-4 py-2 text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-1"
            >
              {showAllTypes ? (
                <>Ver menos <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Ver todos ({feesByType.length - 8} más) <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Comparativa con benchmarks */}
      <Card className="glass-card border-status-warning/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-status-warning" />
            Comparativa vs Benchmarks del Sector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Comisiones Venta</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{formatPercent(calcPercent(sellingFees))}</p>
                <Badge variant={calcPercent(sellingFees) > 15 ? 'destructive' : 'secondary'} className="mb-1">
                  Benchmark: 12-15%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {calcPercent(sellingFees) > 15 ? '⚠️ Por encima del promedio' : '✓ Dentro de lo normal'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Logística FBA</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{formatPercent(calcPercent(fbaFees))}</p>
                <Badge variant={calcPercent(fbaFees) > 15 ? 'destructive' : 'secondary'} className="mb-1">
                  Benchmark: 10-15%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {calcPercent(fbaFees) > 15 ? '⚠️ Revisar tamaños de producto' : '✓ Eficiente'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Total Fees</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{formatPercent(calcPercent(gastosTotales))}</p>
                <Badge variant={calcPercent(gastosTotales) > 35 ? 'destructive' : 'secondary'} className="mb-1">
                  Benchmark: 28-35%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {calcPercent(gastosTotales) > 35 ? '⚠️ Optimización necesaria' : '✓ Competitivo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeBreakdown;
