import { AggregatedMetrics, TransactionTypeDetail } from '@/lib/massiveFileProcessor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, ArrowDownCircle, ArrowUpCircle, RefreshCw, Truck, CreditCard, AlertCircle, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface TransactionBreakdownV2Props {
  metrics: AggregatedMetrics;
}

const TransactionBreakdownV2 = ({ metrics }: TransactionBreakdownV2Props) => {
  const formatCurrency = (value: number) => {
    return `${value >= 0 ? '' : '-'}€${Math.abs(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get transaction type details from metrics
  const transactionTypes = Array.from(metrics.byTransactionTypeDetail?.entries() || [])
    .map(([type, detail]) => ({
      type,
      ...detail
    }))
    .sort((a, b) => b.count - a.count);

  // Get fulfillment data
  const fbaData = metrics.byFulfillment.get('FBA') || { grossSales: 0, salesWithTax: 0, fees: 0, refunds: 0, refundsWithTax: 0, transactionCount: 0, model: 'FBA' };
  const fbmData = metrics.byFulfillment.get('FBM') || { grossSales: 0, salesWithTax: 0, fees: 0, refunds: 0, refundsWithTax: 0, transactionCount: 0, model: 'FBM' };

  const totalTransactions = transactionTypes.reduce((sum, t) => sum + t.count, 0);

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pedido') || lowerType.includes('order')) return <Receipt className="w-4 h-4" />;
    if (lowerType.includes('reembolso') || lowerType.includes('refund')) return <RefreshCw className="w-4 h-4" />;
    if (lowerType.includes('transfer')) return <ArrowUpCircle className="w-4 h-4" />;
    if (lowerType.includes('ajuste') || lowerType.includes('adjustment')) return <ArrowDownCircle className="w-4 h-4" />;
    if (lowerType.includes('tarifa') || lowerType.includes('fee')) return <CreditCard className="w-4 h-4" />;
    if (lowerType.includes('inventario') || lowerType.includes('fba')) return <Truck className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getTypeColor = (type: string, category: string) => {
    if (category === 'income') return 'hsl(var(--status-success))';
    if (category === 'expense') return 'hsl(var(--status-critical))';
    return 'hsl(var(--primary))';
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'income': return <Badge className="bg-status-success text-white text-xs">Ingreso</Badge>;
      case 'expense': return <Badge className="bg-status-critical text-white text-xs">Gasto</Badge>;
      default: return <Badge className="bg-primary text-white text-xs">Otro</Badge>;
    }
  };

  const pieData = transactionTypes.slice(0, 8).map(t => ({
    name: t.type,
    value: t.count,
    color: getTypeColor(t.type, t.category)
  }));

  const fbaFbmCompare = [
    {
      name: 'Ventas con IVA',
      FBA: fbaData.salesWithTax,
      FBM: fbmData.salesWithTax
    },
    {
      name: 'Fees',
      FBA: Math.abs(fbaData.fees),
      FBM: Math.abs(fbmData.fees)
    },
    {
      name: 'Reembolsos',
      FBA: Math.abs(fbaData.refundsWithTax),
      FBM: Math.abs(fbmData.refundsWithTax)
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border/50 rounded-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary">{payload[0].value.toLocaleString()} transacciones</p>
          <p className="text-xs text-muted-foreground">{((payload[0].value / totalTransactions) * 100).toFixed(1)}% del total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* FBA vs FBM Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              FBA (Logística de Amazon)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">{formatCurrency(fbaData.salesWithTax)}</p>
                <p className="text-xs text-muted-foreground">Ventas (IVA incl.)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{fbaData.transactionCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-warning/10">
                <p className="text-xl font-bold text-status-warning">{formatCurrency(fbaData.fees)}</p>
                <p className="text-xs text-muted-foreground">Fees</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-critical/10">
                <p className="text-xl font-bold text-status-critical">{formatCurrency(fbaData.refundsWithTax)}</p>
                <p className="text-xs text-muted-foreground">Reembolsos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-amazon-orange/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amazon-orange" />
              FBM (Vendedor)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-amazon-orange/10">
                <p className="text-2xl font-bold text-amazon-orange">{formatCurrency(fbmData.salesWithTax)}</p>
                <p className="text-xs text-muted-foreground">Ventas (IVA incl.)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{fbmData.transactionCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-warning/10">
                <p className="text-xl font-bold text-status-warning">{formatCurrency(fbmData.fees)}</p>
                <p className="text-xs text-muted-foreground">Fees</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-critical/10">
                <p className="text-xl font-bold text-status-critical">{formatCurrency(fbmData.refundsWithTax)}</p>
                <p className="text-xs text-muted-foreground">Reembolsos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types Pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por Tipo de Transacción</CardTitle>
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
                    label={({ name, percent }) => `${name.substring(0, 15)} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* FBA vs FBM Bar Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comparativa FBA vs FBM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fbaFbmCompare} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="FBA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="FBM" fill="hsl(var(--amazon-orange))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Types Detail */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detalle por Tipo de Transacción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {transactionTypes.map((txType) => (
              <div 
                key={txType.type} 
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                style={{ borderLeft: `4px solid ${getTypeColor(txType.type, txType.category)}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: getTypeColor(txType.type, txType.category) }}>
                      {getTypeIcon(txType.type)}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[120px]" title={txType.type}>
                      {txType.type}
                    </span>
                  </div>
                  {getCategoryBadge(txType.category)}
                </div>
                <p className="text-2xl font-bold">{txType.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">transacciones</p>
                {txType.totalAmount !== 0 && (
                  <p className={`text-sm font-medium mt-1 ${txType.totalAmount < 0 ? 'text-status-critical' : 'text-status-success'}`}>
                    {formatCurrency(txType.totalAmount)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Totals */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Banknote className="w-4 h-4 text-multi" />
            Resumen por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
              <p className="text-sm text-status-success font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold text-status-success">
                {formatCurrency(metrics.grossSales)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Con IVA: {formatCurrency(metrics.salesWithTax)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-status-critical/10 border border-status-critical/20">
              <p className="text-sm text-status-critical font-medium">Gastos Totales</p>
              <p className="text-2xl font-bold text-status-critical">
                {formatCurrency(metrics.totalFees)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reembolsos: {formatCurrency(metrics.totalRefunds)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">Otros Movimientos</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(metrics.otherMovements)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Transferencias, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionBreakdownV2;
