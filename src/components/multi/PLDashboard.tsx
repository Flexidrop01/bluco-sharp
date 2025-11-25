import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, Truck, 
  RotateCcw, CreditCard, Building2, Calculator, AlertTriangle, Download, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { PLMetrics, MonthlyPLData } from '@/lib/metricsToPL';
import { exportPLToPDF } from '@/lib/plPdfExport';

// Re-export PLMetrics for backward compatibility
export type { PLMetrics } from '@/lib/metricsToPL';

interface PLDashboardProps {
  metrics: PLMetrics;
  currency: string;
  period: string;
  monthlyData?: MonthlyPLData[];
}

export const PLDashboard = ({ metrics, currency, period, monthlyData }: PLDashboardProps) => {
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '' : '-'}${Math.abs(value).toFixed(2)}%`;
  };

  const getValueColor = (value: number, isExpense: boolean = false) => {
    if (isExpense) {
      return value < 0 ? 'text-status-critical' : 'text-foreground';
    }
    return value > 0 ? 'text-status-success' : value < 0 ? 'text-status-critical' : 'text-foreground';
  };

  const handleExportPDF = () => {
    exportPLToPDF({
      total: metrics,
      monthly: monthlyData || [],
      currency,
      period,
      accountName: 'Amazon Seller Account'
    });
  };

  // Prepare chart data
  const monthlyChartData = monthlyData?.map(m => ({
    name: m.monthLabel,
    income: m.data.totalIncome,
    expenses: m.data.totalExpenses,
    ebitda: m.data.ebitda,
    netProfit: m.data.netProfit
  })) || [];

  const PLRow = ({ label, value, indent = 0, isHeader = false, isExpense = false, highlight = false }: {
    label: string;
    value: number | string;
    indent?: number;
    isHeader?: boolean;
    isExpense?: boolean;
    highlight?: boolean;
  }) => (
    <div className={`flex justify-between items-center py-1.5 px-2 ${highlight ? 'bg-primary/10 rounded' : ''} ${isHeader ? 'border-b border-border/50 font-bold' : ''}`}>
      <span className={`${isHeader ? 'font-semibold text-foreground' : 'text-muted-foreground'}`} style={{ paddingLeft: `${indent * 16}px` }}>
        {label}
      </span>
      <span className={`font-mono text-sm ${typeof value === 'number' ? getValueColor(value, isExpense) : ''} ${isHeader ? 'font-bold' : ''}`}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </span>
    </div>
  );

  const SectionHeader = ({ icon, title, total, color }: { icon: React.ReactNode; title: string; total?: number; color?: string }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${color || 'bg-muted/30'} mb-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      {total !== undefined && (
        <span className={`font-bold font-mono ${getValueColor(total)}`}>{formatCurrency(total)}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">P&L Dashboard</h2>
          <Badge variant="outline">{currency}</Badge>
        </div>
        <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-status-success/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-status-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-status-success">{formatCurrency(metrics.totalIncome)}</p>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 text-status-critical mx-auto mb-2" />
            <p className="text-2xl font-bold text-status-critical">{formatCurrency(metrics.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4 text-center">
            <Calculator className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.ebitda)}</p>
            <p className="text-xs text-muted-foreground">EBITDA ({formatPercent(metrics.ebitdaPercent)})</p>
          </CardContent>
        </Card>
        <Card className={`glass-card ${metrics.netProfit > 0 ? 'border-status-success/30' : 'border-status-critical/30'}`}>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
            <p className={`text-2xl font-bold ${metrics.netProfit > 0 ? 'text-status-success' : 'text-status-critical'}`}>
              {formatCurrency(metrics.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">Net Profit ({formatPercent(metrics.netProfitPercent)})</p>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancy Alert */}
      {Math.abs(metrics.mistake) > 1 && (
        <Card className="glass-card border-status-warning/50 bg-status-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-status-warning flex-shrink-0" />
            <div>
              <p className="font-semibold text-status-warning">Discrepancia Detectada</p>
              <p className="text-sm text-muted-foreground">
                Diferencia de {formatCurrency(metrics.mistake)} entre total calculado ({formatCurrency(metrics.calculatedTotal)}) y total real ({formatCurrency(metrics.actualTotal)})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="glass-card p-1 flex-wrap">
          <TabsTrigger value="summary">Resumen P&L</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          {monthlyData && monthlyData.length > 0 && (
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Mensual
            </TabsTrigger>
          )}
          <TabsTrigger value="detail">Detalle Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Summary */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-status-success" />
                  Resumen de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <PLRow label="TOTAL INCOME" value={metrics.totalIncome} isHeader highlight />
                <PLRow label="Excluding Taxes" value={metrics.excludingTaxes} />
                <div className="border-t border-border/30 my-2" />
                <PLRow label="FBA Sales" value={metrics.fba.totalRevenue} />
                <PLRow label="FBM Sales" value={metrics.fbm.totalRevenue} />
                <PLRow label="Other Income" value={metrics.otherIncome.shippingCredits + metrics.otherIncome.giftWrapCredits + metrics.otherIncome.reimbursements.total} />
                <PLRow label="Reimbursements" value={metrics.otherIncome.reimbursements.total} />
              </CardContent>
            </Card>

            {/* Expenses Summary */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-status-critical" />
                  Resumen de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <PLRow label="TOTAL EXPENSES" value={-metrics.totalExpenses} isHeader isExpense highlight />
                <PLRow label="Expenses per Sale" value={-metrics.expensesPerSale} isExpense />
                <div className="border-t border-border/30 my-2" />
                <PLRow label="Sales Commissions" value={-metrics.salesCommissions.total} isExpense />
                <PLRow label="FBA Commissions" value={-metrics.fbaCommissions.total} isExpense />
                <PLRow label="Other Expenses" value={-metrics.otherExpenses.total} isExpense />
                <PLRow label="Refunds" value={-(metrics.fba.refunds + metrics.fbm.refunds)} isExpense />
              </CardContent>
            </Card>
          </div>

          {/* FBA vs FBM Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="glass-card border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  FBA (Logística Amazon)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <PLRow label="Total Revenue" value={metrics.fba.totalRevenue} />
                <PLRow label="B. Taxable Income" value={metrics.fba.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={metrics.fba.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-metrics.fba.refunds} isExpense />
                <PLRow label="Refund Rate" value={formatPercent(metrics.fba.refundRate)} />
                <PLRow label="Commission" value={-metrics.salesCommissions.fba} isExpense />
                <PLRow label="FBA Fees" value={-metrics.fbaCommissions.total} isExpense />
              </CardContent>
            </Card>

            <Card className="glass-card border-amazon-orange/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-amazon-orange" />
                  FBM (Vendedor)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <PLRow label="Total Revenue" value={metrics.fbm.totalRevenue} />
                <PLRow label="B. Taxable Income" value={metrics.fbm.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={metrics.fbm.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-metrics.fbm.refunds} isExpense />
                <PLRow label="% Total Revenue" value={formatPercent(metrics.fbm.percentOfTotal)} />
                <PLRow label="Commission" value={-metrics.salesCommissions.fbm} isExpense />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Desglose Completo de Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SectionHeader icon={<DollarSign className="w-4 h-4 text-status-success" />} title="TOTAL SALES REVENUE" total={metrics.totalIncome} color="bg-status-success/10" />
              
              {/* FBM Section */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amazon-orange" /> FBM Sales
                </p>
                <PLRow label="Total Revenue" value={metrics.fbm.totalRevenue} />
                <PLRow label="B. Taxable Income" value={metrics.fbm.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={metrics.fbm.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-metrics.fbm.refunds} isExpense />
                <PLRow label="B. Taxable Refunds" value={-metrics.fbm.taxableRefunds} indent={1} isExpense />
                <PLRow label="Refund Tax" value={-metrics.fbm.refundTax} indent={1} isExpense />
                <PLRow label="% Total Revenue" value={formatPercent(metrics.fbm.percentOfTotal)} />
              </div>

              {/* FBA Section */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> FBA Sales
                </p>
                <PLRow label="Total Revenue" value={metrics.fba.totalRevenue} />
                <PLRow label="B. Taxable Income" value={metrics.fba.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={metrics.fba.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-metrics.fba.refunds} isExpense />
                <PLRow label="B. Taxable Refunds" value={-metrics.fba.taxableRefunds} indent={1} isExpense />
                <PLRow label="Refund Tax" value={-metrics.fba.refundTax} indent={1} isExpense />
                <PLRow label="% of Refunds on Sales" value={formatPercent(metrics.fba.refundRate)} />
              </div>

              {/* Other Income */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-multi" /> Other Income from Sales
                </p>
                <PLRow label="Shipping Credits" value={metrics.otherIncome.shippingCredits} />
                <PLRow label="Shipping Credits Tax" value={metrics.otherIncome.shippingCreditsTax} indent={1} />
                <PLRow label="Gift Wrap Credits" value={metrics.otherIncome.giftWrapCredits} />
                <PLRow label="Gift Wrap Credits Tax" value={metrics.otherIncome.giftWrapCreditsTax} indent={1} />
                <PLRow label="Regulatory Fee" value={metrics.otherIncome.regulatoryFee} />
                <PLRow label="Marketplace Withheld Tax" value={metrics.otherIncome.marketplaceWithheldTax} />
                <PLRow label="Promotional Rebates" value={-metrics.otherIncome.promotionalRebates} isExpense />
              </div>

              {/* Reimbursements */}
              <div className="border rounded-lg p-3 border-status-success/30 bg-status-success/5">
                <p className="font-semibold mb-2 flex items-center gap-2 text-status-success">
                  <RotateCcw className="w-4 h-4" /> FBA Inventory Reimbursements
                </p>
                <PLRow label="Lost: Warehouse" value={metrics.otherIncome.reimbursements.lostWarehouse} />
                <PLRow label="Customer Return" value={metrics.otherIncome.reimbursements.customerReturn} />
                <PLRow label="Damaged: Warehouse" value={metrics.otherIncome.reimbursements.damagedWarehouse} />
                <PLRow label="Customer Service Issue" value={metrics.otherIncome.reimbursements.customerServiceIssue} />
                <PLRow label="Lost: Inbound" value={metrics.otherIncome.reimbursements.lostInbound} />
                <PLRow label="TOTAL REIMBURSEMENTS" value={metrics.otherIncome.reimbursements.total} isHeader highlight />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Desglose Completo de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SectionHeader icon={<TrendingDown className="w-4 h-4 text-status-critical" />} title="TOTAL EXPENSES" total={-metrics.totalExpenses} color="bg-status-critical/10" />
              
              {/* Sales Commissions */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2">Sales Commissions ({formatPercent(metrics.salesCommissions.percentOfIncome)})</p>
                <PLRow label="FBM Sales Commission" value={-metrics.salesCommissions.fbm} isExpense />
                <PLRow label="FBA Sales Commission" value={-metrics.salesCommissions.fba} isExpense />
                <PLRow label="Refund Commission Credit" value={metrics.salesCommissions.refundCommissions} />
                <PLRow label="TOTAL COMMISSIONS" value={-metrics.salesCommissions.total} isHeader isExpense />
              </div>

              {/* FBA Commissions */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> FBA Commissions
                </p>
                <PLRow label="FBA Shipping Commission" value={-metrics.fbaCommissions.shipping} isExpense />
                <PLRow label="FBA Shipping Credits" value={metrics.fbaCommissions.shippingCredits} />
                <PLRow label="TOTAL FBA" value={-metrics.fbaCommissions.total} isHeader isExpense />
              </div>

              {/* Other Expenses */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" /> Other Expenses
                </p>
                <PLRow label="Subscription" value={-metrics.otherExpenses.subscription} isExpense />
                <PLRow label="Advertising" value={-metrics.otherExpenses.advertising} isExpense />
                <PLRow label="Partner Carrier Shipment" value={-metrics.otherExpenses.partnerCarrierShipment} isExpense />
                <PLRow label="Inventory Storage" value={-metrics.otherExpenses.inventoryStorage} isExpense />
                <PLRow label="General Adjustment" value={-metrics.otherExpenses.generalAdjustment} isExpense />
                <PLRow label="Return Postage Billing" value={-metrics.otherExpenses.returnPostageBilling} isExpense />
                <PLRow label="Discounts" value={-metrics.otherExpenses.discounts} isExpense />
                <PLRow label="Inbound Placement" value={-metrics.otherExpenses.inboundPlacement} isExpense />
                <PLRow label="Vine Enrollment" value={-metrics.otherExpenses.vineEnrollment} isExpense />
                <PLRow label="AWD Processing" value={-metrics.otherExpenses.awdProcessing} isExpense />
                <PLRow label="AWD Transportation" value={-metrics.otherExpenses.awdTransportation} isExpense />
                <PLRow label="AWD Storage" value={-metrics.otherExpenses.awdStorage} isExpense />
                <PLRow label="FBA Storage Fee" value={-metrics.otherExpenses.fbaStorageFee} isExpense />
                <PLRow label="Long-Term Storage" value={-metrics.otherExpenses.longTermStorage} isExpense />
                <PLRow label="Prep/Labeling" value={-metrics.otherExpenses.prepLabeling} isExpense />
                <PLRow label="Removal: Return" value={-metrics.otherExpenses.removalReturn} isExpense />
                <PLRow label="Removal: Disposal" value={-metrics.otherExpenses.removalDisposal} isExpense />
                <PLRow label="Others" value={-metrics.otherExpenses.others} isExpense />
                <PLRow label="TOTAL OTHER" value={-metrics.otherExpenses.total} isHeader isExpense />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {monthlyData && monthlyData.length > 0 && (
          <TabsContent value="monthly">
            <div className="space-y-6">
              {/* Monthly Evolution Charts */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Evolución Mensual - Ingresos vs Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey="income" name="Ingresos" fill="hsl(var(--status-success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Gastos" fill="hsl(var(--status-critical))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* EBITDA & Net Profit Line Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Evolución EBITDA y Beneficio Neto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                        <Line type="monotone" dataKey="netProfit" name="Beneficio Neto" stroke="hsl(var(--amazon-orange))" strokeWidth={2} dot={{ fill: 'hsl(var(--amazon-orange))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Table */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Detalle por Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 font-semibold">Mes</th>
                          <th className="text-right py-2 px-2 font-semibold">Income</th>
                          <th className="text-right py-2 px-2 font-semibold">Expenses</th>
                          <th className="text-right py-2 px-2 font-semibold">EBITDA</th>
                          <th className="text-right py-2 px-2 font-semibold">EBITDA %</th>
                          <th className="text-right py-2 px-2 font-semibold">Net Profit</th>
                          <th className="text-right py-2 px-2 font-semibold">FBA %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((m, idx) => (
                          <tr key={m.month} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                            <td className="py-2 px-2 font-medium">{m.monthLabel}</td>
                            <td className="py-2 px-2 text-right text-status-success font-mono">{formatCurrency(m.data.totalIncome)}</td>
                            <td className="py-2 px-2 text-right text-status-critical font-mono">{formatCurrency(m.data.totalExpenses)}</td>
                            <td className="py-2 px-2 text-right text-primary font-mono font-semibold">{formatCurrency(m.data.ebitda)}</td>
                            <td className="py-2 px-2 text-right">{formatPercent(m.data.ebitdaPercent)}</td>
                            <td className={`py-2 px-2 text-right font-mono font-semibold ${m.data.netProfit >= 0 ? 'text-status-success' : 'text-status-critical'}`}>
                              {formatCurrency(m.data.netProfit)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {formatPercent(m.data.totalIncome > 0 ? (m.data.fba.totalRevenue / m.data.totalIncome) * 100 : 0)}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="border-t-2 border-primary/50 bg-primary/10 font-bold">
                          <td className="py-2 px-2">TOTAL</td>
                          <td className="py-2 px-2 text-right text-status-success font-mono">{formatCurrency(metrics.totalIncome)}</td>
                          <td className="py-2 px-2 text-right text-status-critical font-mono">{formatCurrency(metrics.totalExpenses)}</td>
                          <td className="py-2 px-2 text-right text-primary font-mono">{formatCurrency(metrics.ebitda)}</td>
                          <td className="py-2 px-2 text-right">{formatPercent(metrics.ebitdaPercent)}</td>
                          <td className={`py-2 px-2 text-right font-mono ${metrics.netProfit >= 0 ? 'text-status-success' : 'text-status-critical'}`}>
                            {formatCurrency(metrics.netProfit)}
                          </td>
                          <td className="py-2 px-2 text-right">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="detail">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">P&L Completo - Estilo Bluco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              {/* Full P&L in Bluco format */}
              <PLRow label="TOTAL INCOME" value={metrics.totalIncome} isHeader highlight />
              <PLRow label="EXCLUDING TAXES" value={metrics.excludingTaxes} />
              
              <div className="border-t border-border/50 my-3" />
              <p className="font-bold text-primary">TOTAL SALES REVENUE</p>
              
              <p className="font-semibold mt-2">FBM Sales</p>
              <PLRow label="Total Revenue" value={metrics.fbm.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={metrics.fbm.taxableIncome} indent={2} />
              <PLRow label="Tax Income" value={metrics.fbm.taxIncome} indent={2} />
              <PLRow label="Refunds" value={-metrics.fbm.refunds} indent={1} isExpense />
              <PLRow label="% Total Revenue" value={formatPercent(metrics.fbm.percentOfTotal)} indent={1} />
              
              <p className="font-semibold mt-2">FBA Sales</p>
              <PLRow label="Total Revenue" value={metrics.fba.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={metrics.fba.taxableIncome} indent={2} />
              <PLRow label="Tax Income" value={metrics.fba.taxIncome} indent={2} />
              <PLRow label="Refunds" value={-metrics.fba.refunds} indent={1} isExpense />
              <PLRow label="% of refunds on sales" value={formatPercent(metrics.fba.refundRate)} indent={1} />
              
              <p className="font-semibold mt-2">OTHER INCOME FROM SALES</p>
              <PLRow label="Shipping Credits" value={metrics.otherIncome.shippingCredits} indent={1} />
              <PLRow label="Gift Wrap Credits" value={metrics.otherIncome.giftWrapCredits} indent={1} />
              <PLRow label="Regulatory Fee" value={metrics.otherIncome.regulatoryFee} indent={1} />
              <PLRow label="Marketplace Withheld Tax" value={metrics.otherIncome.marketplaceWithheldTax} indent={1} />
              <PLRow label="Promotional Rebates" value={-metrics.otherIncome.promotionalRebates} indent={1} isExpense />
              <PLRow label="FBA Reimbursements Total" value={metrics.otherIncome.reimbursements.total} indent={1} />
              
              <div className="border-t border-border/50 my-3" />
              <PLRow label="TOTAL EXPENSES" value={-metrics.totalExpenses} isHeader isExpense highlight />
              <PLRow label="TOTAL EXPENSES PER SALE" value={-metrics.expensesPerSale} isExpense />
              
              <p className="font-semibold mt-2">Sales Commissions ({formatPercent(metrics.salesCommissions.percentOfIncome)})</p>
              <PLRow label="FBM Sales Commission" value={-metrics.salesCommissions.fbm} indent={1} isExpense />
              <PLRow label="FBA Sales Commission" value={-metrics.salesCommissions.fba} indent={1} isExpense />
              <PLRow label="Refund Commissions" value={metrics.salesCommissions.refundCommissions} indent={1} />
              
              <p className="font-semibold mt-2">FBA Commissions</p>
              <PLRow label="FBA Shipping Commission" value={-metrics.fbaCommissions.shipping} indent={1} isExpense />
              <PLRow label="FBA Shipping Credits" value={metrics.fbaCommissions.shippingCredits} indent={1} />
              
              <p className="font-semibold mt-2">Other Expenses</p>
              <PLRow label="Subscription" value={-metrics.otherExpenses.subscription} indent={1} isExpense />
              <PLRow label="Advertising" value={-metrics.otherExpenses.advertising} indent={1} isExpense />
              <PLRow label="Inventory Storage" value={-metrics.otherExpenses.inventoryStorage} indent={1} isExpense />
              <PLRow label="Inbound Placement" value={-metrics.otherExpenses.inboundPlacement} indent={1} isExpense />
              <PLRow label="Others" value={-metrics.otherExpenses.others} indent={1} isExpense />
              
              <div className="border-t border-border/50 my-3" />
              <div className="bg-primary/10 p-3 rounded-lg">
                <PLRow label="EBITDA" value={metrics.ebitda} isHeader />
                <PLRow label="% of Income" value={formatPercent(metrics.ebitdaPercent)} />
              </div>
              
              <PLRow label="Taxes" value={-metrics.taxes} isExpense />
              
              <div className={`p-3 rounded-lg mt-2 ${metrics.netProfit >= 0 ? 'bg-status-success/10' : 'bg-status-critical/10'}`}>
                <PLRow label="NET PROFIT" value={metrics.netProfit} isHeader />
                <PLRow label="% of Income" value={formatPercent(metrics.netProfitPercent)} />
              </div>
              
              <div className="border-t border-border/50 my-3" />
              <PLRow label="Transfer" value={metrics.transfer} />
              <PLRow label="Debt" value={metrics.debt} />
              
              {Math.abs(metrics.mistake) > 1 && (
                <div className="bg-status-warning/10 p-3 rounded-lg mt-3">
                  <PLRow label="Calculated Total" value={metrics.calculatedTotal} />
                  <PLRow label="Actual Total" value={metrics.actualTotal} />
                  <PLRow label="MISTAKE" value={metrics.mistake} isHeader />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PLDashboard;
