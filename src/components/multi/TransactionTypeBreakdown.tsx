import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransactionTypeMetrics } from '@/types/multiTransaction';
import { Receipt, ArrowDownCircle, ArrowUpCircle, RefreshCw, Truck, CreditCard, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface TransactionTypeBreakdownProps {
  byTransactionType: TransactionTypeMetrics[];
  fbaVsFbm: {
    fba: { sales: number; fees: number; refunds: number; transactions: number };
    fbm: { sales: number; fees: number; refunds: number; transactions: number };
  };
}

const TransactionTypeBreakdown = ({ byTransactionType, fbaVsFbm }: TransactionTypeBreakdownProps) => {
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order': return <Receipt className="w-4 h-4" />;
      case 'refund': return <RefreshCw className="w-4 h-4" />;
      case 'transfer': return <ArrowUpCircle className="w-4 h-4" />;
      case 'adjustment': return <ArrowDownCircle className="w-4 h-4" />;
      case 'service fee': return <CreditCard className="w-4 h-4" />;
      case 'fba inventory fee': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order': return 'hsl(var(--status-success))';
      case 'refund': return 'hsl(var(--status-critical))';
      case 'transfer': return 'hsl(var(--primary))';
      case 'adjustment': return 'hsl(var(--multi))';
      case 'service fee': return 'hsl(var(--amazon-orange))';
      case 'fba inventory fee': return 'hsl(var(--idq))';
      case 'debt': return 'hsl(var(--cfo))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const pieData = byTransactionType.map(t => ({
    name: t.type,
    value: t.count,
    color: getTypeColor(t.type)
  }));

  const fbaFbmData = [
    {
      name: 'Ventas',
      FBA: fbaVsFbm.fba.sales,
      FBM: fbaVsFbm.fbm.sales
    },
    {
      name: 'Fees',
      FBA: fbaVsFbm.fba.fees,
      FBM: fbaVsFbm.fbm.fees
    },
    {
      name: 'Devoluciones',
      FBA: fbaVsFbm.fba.refunds,
      FBM: fbaVsFbm.fbm.refunds
    }
  ];

  const totalTransactions = byTransactionType.reduce((sum, t) => sum + t.count, 0);
  const totalFBA = fbaVsFbm.fba.transactions;
  const totalFBM = fbaVsFbm.fbm.transactions;

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
                <p className="text-2xl font-bold text-primary">${(fbaVsFbm.fba.sales / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Ventas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{totalFBA.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-warning/10">
                <p className="text-xl font-bold text-status-warning">${(fbaVsFbm.fba.fees / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Fees</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-critical/10">
                <p className="text-xl font-bold text-status-critical">${(fbaVsFbm.fba.refunds / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Devoluciones</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge className="bg-primary">{totalFBA > 0 ? ((totalFBA / (totalFBA + totalFBM)) * 100).toFixed(0) : 0}% del volumen</Badge>
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
                <p className="text-2xl font-bold text-amazon-orange">${(fbaVsFbm.fbm.sales / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Ventas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{totalFBM.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Transacciones</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-warning/10">
                <p className="text-xl font-bold text-status-warning">${(fbaVsFbm.fbm.fees / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Fees</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-status-critical/10">
                <p className="text-xl font-bold text-status-critical">${(fbaVsFbm.fbm.refunds / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Devoluciones</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge className="bg-amazon-orange">{totalFBM > 0 ? ((totalFBM / (totalFBA + totalFBM)) * 100).toFixed(0) : 0}% del volumen</Badge>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <BarChart data={fbaFbmData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
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
            {byTransactionType.sort((a, b) => b.count - a.count).map((type) => (
              <div 
                key={type.type} 
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                style={{ borderLeft: `4px solid ${getTypeColor(type.type)}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: getTypeColor(type.type) }}>{getTypeIcon(type.type)}</span>
                    <span className="font-medium text-sm">{type.type}</span>
                  </div>
                  <Badge variant="outline">{type.percentOfTotal.toFixed(1)}%</Badge>
                </div>
                <p className="text-2xl font-bold">{type.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">transacciones</p>
                {type.totalAmount !== 0 && (
                  <p className={`text-sm font-medium mt-1 ${type.totalAmount < 0 ? 'text-status-critical' : 'text-status-success'}`}>
                    {type.totalAmount < 0 ? '-' : '+'}${Math.abs(type.totalAmount).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-primary">FBA: {type.fulfillmentBreakdown.fba.count}</span>
                  <span className="text-amazon-orange">FBM: {type.fulfillmentBreakdown.fbm.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionTypeBreakdown;
