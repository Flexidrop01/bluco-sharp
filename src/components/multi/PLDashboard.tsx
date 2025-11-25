import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, Truck, 
  RotateCcw, CreditCard, Building2, Calculator, AlertTriangle, Download, Calendar, Filter
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
  // Date filter state
  const [startMonth, setStartMonth] = useState<string>('all');
  const [endMonth, setEndMonth] = useState<string>('all');

  // Filter monthly data based on selection
  const filteredMonthlyData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];
    
    let filtered = [...monthlyData];
    
    if (startMonth !== 'all') {
      filtered = filtered.filter(m => m.month >= startMonth);
    }
    if (endMonth !== 'all') {
      filtered = filtered.filter(m => m.month <= endMonth);
    }
    
    return filtered;
  }, [monthlyData, startMonth, endMonth]);

  // Calculate filtered totals
  const filteredMetrics = useMemo(() => {
    if (filteredMonthlyData.length === 0 || (startMonth === 'all' && endMonth === 'all')) {
      return metrics;
    }
    
    // Aggregate filtered months
    const aggregated: PLMetrics = {
      totalIncome: 0,
      excludingTaxes: 0,
      fbm: { totalRevenue: 0, taxableIncome: 0, taxIncome: 0, refunds: 0, taxableRefunds: 0, refundTax: 0, percentOfTotal: 0 },
      fba: { totalRevenue: 0, taxableIncome: 0, taxIncome: 0, refunds: 0, taxableRefunds: 0, refundTax: 0, refundRate: 0 },
      otherIncome: {
        shippingCredits: 0, shippingCreditsTax: 0, giftWrapCredits: 0, giftWrapCreditsTax: 0,
        regulatoryFee: 0, regulatoryFeeTax: 0, marketplaceWithheldTax: 0, promotionalRebates: 0, promotionalRebatesTax: 0,
        reimbursements: { lostWarehouse: 0, customerReturn: 0, damagedWarehouse: 0, customerServiceIssue: 0, lostInbound: 0, total: 0 }
      },
      otherAmazonIncome: { fbaInventoryFee: 0, liquidations: 0, fbaCustomerReturnFee: 0, orderRetrocharge: 0, several: 0, total: 0 },
      totalExpenses: 0,
      expensesPerSale: 0,
      salesCommissions: { fbm: 0, fba: 0, refundCommissions: 0, percentOfIncome: 0, total: 0 },
      fbaCommissions: { shipping: 0, shippingCredits: 0, total: 0 },
      otherExpenses: {
        subscription: 0, advertising: 0, partnerCarrierShipment: 0, inventoryStorage: 0, generalAdjustment: 0,
        returnPostageBilling: 0, discounts: 0, inboundPlacement: 0, vineEnrollment: 0, awdProcessing: 0,
        awdTransportation: 0, awdStorage: 0, fbaStorageFee: 0, longTermStorage: 0, prepLabeling: 0,
        removalReturn: 0, removalDisposal: 0, others: 0, total: 0
      },
      ebitda: 0, ebitdaPercent: 0,
      taxes: 0, netProfit: 0, netProfitPercent: 0,
      transfer: 0, debt: 0,
      calculatedTotal: 0, actualTotal: 0, mistake: 0
    };
    
    for (const m of filteredMonthlyData) {
      aggregated.totalIncome += m.data.totalIncome;
      aggregated.excludingTaxes += m.data.excludingTaxes;
      aggregated.totalExpenses += m.data.totalExpenses;
      aggregated.ebitda += m.data.ebitda;
      aggregated.taxes += m.data.taxes;
      aggregated.netProfit += m.data.netProfit;
      aggregated.fba.totalRevenue += m.data.fba.totalRevenue;
      aggregated.fba.refunds += m.data.fba.refunds;
      aggregated.fbm.totalRevenue += m.data.fbm.totalRevenue;
      aggregated.fbm.refunds += m.data.fbm.refunds;
      aggregated.salesCommissions.total += m.data.salesCommissions.total;
      aggregated.salesCommissions.fba += m.data.salesCommissions.fba;
      aggregated.salesCommissions.fbm += m.data.salesCommissions.fbm;
      aggregated.fbaCommissions.total += m.data.fbaCommissions.total;
      aggregated.otherExpenses.total += m.data.otherExpenses.total;
      aggregated.otherIncome.reimbursements.total += m.data.otherIncome.reimbursements.total;
    }
    
    // Calculate percentages
    aggregated.ebitdaPercent = aggregated.totalIncome > 0 ? (aggregated.ebitda / aggregated.totalIncome) * 100 : 0;
    aggregated.netProfitPercent = aggregated.totalIncome > 0 ? (aggregated.netProfit / aggregated.totalIncome) * 100 : 0;
    aggregated.fba.refundRate = aggregated.fba.totalRevenue > 0 ? (aggregated.fba.refunds / aggregated.fba.totalRevenue) * 100 : 0;
    aggregated.fbm.percentOfTotal = aggregated.totalIncome > 0 ? (aggregated.fbm.totalRevenue / aggregated.totalIncome) * 100 : 0;
    
    return aggregated;
  }, [filteredMonthlyData, metrics, startMonth, endMonth]);

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

  const handleExportPDF = async () => {
    await exportPLToPDF({
      total: filteredMetrics,
      monthly: filteredMonthlyData,
      currency,
      period,
      accountName: 'Amazon Seller Account'
    });
  };

  // Prepare chart data
  const monthlyChartData = filteredMonthlyData.map(m => ({
    name: m.monthLabel,
    income: m.data.totalIncome,
    expenses: m.data.totalExpenses,
    ebitda: m.data.ebitda,
    netProfit: m.data.netProfit
  }));

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

  const isFiltered = startMonth !== 'all' || endMonth !== 'all';

  return (
    <div className="space-y-6">
      {/* Header with Export and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">P&L Dashboard</h2>
          <Badge variant="outline">{currency}</Badge>
          {isFiltered && (
            <Badge className="bg-primary/20 text-primary">Filtrado</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filters */}
          {monthlyData && monthlyData.length > 1 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Desde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Desde inicio</SelectItem>
                  {monthlyData.map(m => (
                    <SelectItem key={`start-${m.month}`} value={m.month}>{m.monthLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-xs">→</span>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Hasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hasta final</SelectItem>
                  {monthlyData.map(m => (
                    <SelectItem key={`end-${m.month}`} value={m.month}>{m.monthLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFiltered && (
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setStartMonth('all'); setEndMonth('all'); }}>
                  Limpiar
                </Button>
              )}
            </div>
          )}
          <Button onClick={handleExportPDF} className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-status-success/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-status-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-status-success">{formatCurrency(filteredMetrics.totalIncome)}</p>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-status-critical/30">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 text-status-critical mx-auto mb-2" />
            <p className="text-2xl font-bold text-status-critical">{formatCurrency(filteredMetrics.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4 text-center">
            <Calculator className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{formatCurrency(filteredMetrics.ebitda)}</p>
            <p className="text-xs text-muted-foreground">EBITDA ({formatPercent(filteredMetrics.ebitdaPercent)})</p>
          </CardContent>
        </Card>
        <Card className={`glass-card ${filteredMetrics.netProfit > 0 ? 'border-status-success/30' : 'border-status-critical/30'}`}>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amazon-orange mx-auto mb-2" />
            <p className={`text-2xl font-bold ${filteredMetrics.netProfit > 0 ? 'text-status-success' : 'text-status-critical'}`}>
              {formatCurrency(filteredMetrics.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">Net Profit ({formatPercent(filteredMetrics.netProfitPercent)})</p>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancy Alert */}
      {Math.abs(filteredMetrics.mistake) > 1 && (
        <Card className="glass-card border-status-warning/50 bg-status-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-status-warning flex-shrink-0" />
            <div>
              <p className="font-semibold text-status-warning">Discrepancia Detectada</p>
              <p className="text-sm text-muted-foreground">
                Diferencia de {formatCurrency(filteredMetrics.mistake)} entre total calculado ({formatCurrency(filteredMetrics.calculatedTotal)}) y total real ({formatCurrency(filteredMetrics.actualTotal)})
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
          {filteredMonthlyData.length > 0 && (
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Mensual ({filteredMonthlyData.length})
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
                <PLRow label="TOTAL INCOME" value={filteredMetrics.totalIncome} isHeader highlight />
                <PLRow label="Excluding Taxes" value={filteredMetrics.excludingTaxes} />
                <div className="border-t border-border/30 my-2" />
                <PLRow label="FBA Sales" value={filteredMetrics.fba.totalRevenue} />
                <PLRow label="FBM Sales" value={filteredMetrics.fbm.totalRevenue} />
                <PLRow label="Other Income" value={filteredMetrics.otherIncome.shippingCredits + filteredMetrics.otherIncome.giftWrapCredits + filteredMetrics.otherIncome.reimbursements.total} />
                <PLRow label="Reimbursements" value={filteredMetrics.otherIncome.reimbursements.total} />
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
                <PLRow label="TOTAL EXPENSES" value={-filteredMetrics.totalExpenses} isHeader isExpense highlight />
                <PLRow label="Expenses per Sale" value={-filteredMetrics.expensesPerSale} isExpense />
                <div className="border-t border-border/30 my-2" />
                <PLRow label="Sales Commissions" value={-filteredMetrics.salesCommissions.total} isExpense />
                <PLRow label="FBA Commissions" value={-filteredMetrics.fbaCommissions.total} isExpense />
                <PLRow label="Other Expenses" value={-filteredMetrics.otherExpenses.total} isExpense />
                <PLRow label="Refunds" value={-(filteredMetrics.fba.refunds + filteredMetrics.fbm.refunds)} isExpense />
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
                <PLRow label="Total Revenue" value={filteredMetrics.fba.totalRevenue} />
                <PLRow label="B. Taxable Income" value={filteredMetrics.fba.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={filteredMetrics.fba.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-filteredMetrics.fba.refunds} isExpense />
                <PLRow label="Refund Rate" value={formatPercent(filteredMetrics.fba.refundRate)} />
                <PLRow label="Commission" value={-filteredMetrics.salesCommissions.fba} isExpense />
                <PLRow label="FBA Fees" value={-filteredMetrics.fbaCommissions.total} isExpense />
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
                <PLRow label="Total Revenue" value={filteredMetrics.fbm.totalRevenue} />
                <PLRow label="B. Taxable Income" value={filteredMetrics.fbm.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={filteredMetrics.fbm.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-filteredMetrics.fbm.refunds} isExpense />
                <PLRow label="% Total Revenue" value={formatPercent(filteredMetrics.fbm.percentOfTotal)} />
                <PLRow label="Commission" value={-filteredMetrics.salesCommissions.fbm} isExpense />
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
              <SectionHeader icon={<DollarSign className="w-4 h-4 text-status-success" />} title="TOTAL SALES REVENUE" total={filteredMetrics.totalIncome} color="bg-status-success/10" />
              
              {/* FBM Section */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amazon-orange" /> FBM Sales
                </p>
                <PLRow label="Total Revenue" value={filteredMetrics.fbm.totalRevenue} />
                <PLRow label="B. Taxable Income" value={filteredMetrics.fbm.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={filteredMetrics.fbm.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-filteredMetrics.fbm.refunds} isExpense />
                <PLRow label="B. Taxable Refunds" value={-filteredMetrics.fbm.taxableRefunds} indent={1} isExpense />
                <PLRow label="Refund Tax" value={-filteredMetrics.fbm.refundTax} indent={1} isExpense />
                <PLRow label="% Total Revenue" value={formatPercent(filteredMetrics.fbm.percentOfTotal)} />
              </div>

              {/* FBA Section */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> FBA Sales
                </p>
                <PLRow label="Total Revenue" value={filteredMetrics.fba.totalRevenue} />
                <PLRow label="B. Taxable Income" value={filteredMetrics.fba.taxableIncome} indent={1} />
                <PLRow label="Tax Income" value={filteredMetrics.fba.taxIncome} indent={1} />
                <PLRow label="Refunds" value={-filteredMetrics.fba.refunds} isExpense />
                <PLRow label="B. Taxable Refunds" value={-filteredMetrics.fba.taxableRefunds} indent={1} isExpense />
                <PLRow label="Refund Tax" value={-filteredMetrics.fba.refundTax} indent={1} isExpense />
                <PLRow label="% of Refunds on Sales" value={formatPercent(filteredMetrics.fba.refundRate)} />
              </div>

              {/* Other Income */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-multi" /> Other Income from Sales
                </p>
                <PLRow label="Shipping Credits" value={filteredMetrics.otherIncome.shippingCredits} />
                <PLRow label="Shipping Credits Tax" value={filteredMetrics.otherIncome.shippingCreditsTax} indent={1} />
                <PLRow label="Gift Wrap Credits" value={filteredMetrics.otherIncome.giftWrapCredits} />
                <PLRow label="Gift Wrap Credits Tax" value={filteredMetrics.otherIncome.giftWrapCreditsTax} indent={1} />
                <PLRow label="Regulatory Fee" value={filteredMetrics.otherIncome.regulatoryFee} />
                <PLRow label="Marketplace Withheld Tax" value={filteredMetrics.otherIncome.marketplaceWithheldTax} />
                <PLRow label="Promotional Rebates" value={-filteredMetrics.otherIncome.promotionalRebates} isExpense />
              </div>

              {/* Reimbursements */}
              <div className="border rounded-lg p-3 border-status-success/30 bg-status-success/5">
                <p className="font-semibold mb-2 flex items-center gap-2 text-status-success">
                  <RotateCcw className="w-4 h-4" /> FBA Inventory Reimbursements
                </p>
                <PLRow label="Lost: Warehouse" value={filteredMetrics.otherIncome.reimbursements.lostWarehouse} />
                <PLRow label="Customer Return" value={filteredMetrics.otherIncome.reimbursements.customerReturn} />
                <PLRow label="Damaged: Warehouse" value={filteredMetrics.otherIncome.reimbursements.damagedWarehouse} />
                <PLRow label="Customer Service Issue" value={filteredMetrics.otherIncome.reimbursements.customerServiceIssue} />
                <PLRow label="Lost: Inbound" value={filteredMetrics.otherIncome.reimbursements.lostInbound} />
                <PLRow label="TOTAL REIMBURSEMENTS" value={filteredMetrics.otherIncome.reimbursements.total} isHeader highlight />
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
              <SectionHeader icon={<TrendingDown className="w-4 h-4 text-status-critical" />} title="TOTAL EXPENSES" total={-filteredMetrics.totalExpenses} color="bg-status-critical/10" />
              
              {/* Sales Commissions */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2">Sales Commissions ({formatPercent(filteredMetrics.salesCommissions.percentOfIncome)})</p>
                <PLRow label="FBM Sales Commission" value={-filteredMetrics.salesCommissions.fbm} isExpense />
                <PLRow label="FBA Sales Commission" value={-filteredMetrics.salesCommissions.fba} isExpense />
                <PLRow label="Refund Commission Credit" value={filteredMetrics.salesCommissions.refundCommissions} />
                <PLRow label="TOTAL COMMISSIONS" value={-filteredMetrics.salesCommissions.total} isHeader isExpense />
              </div>

              {/* FBA Commissions */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> FBA Commissions
                </p>
                <PLRow label="FBA Shipping Commission" value={-filteredMetrics.fbaCommissions.shipping} isExpense />
                <PLRow label="FBA Shipping Credits" value={filteredMetrics.fbaCommissions.shippingCredits} />
                <PLRow label="TOTAL FBA" value={-filteredMetrics.fbaCommissions.total} isHeader isExpense />
              </div>

              {/* Other Expenses */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" /> Other Expenses
                </p>
                <PLRow label="Subscription" value={-filteredMetrics.otherExpenses.subscription} isExpense />
                <PLRow label="Advertising" value={-filteredMetrics.otherExpenses.advertising} isExpense />
                <PLRow label="Partner Carrier Shipment" value={-filteredMetrics.otherExpenses.partnerCarrierShipment} isExpense />
                <PLRow label="Inventory Storage" value={-filteredMetrics.otherExpenses.inventoryStorage} isExpense />
                <PLRow label="General Adjustment" value={-filteredMetrics.otherExpenses.generalAdjustment} isExpense />
                <PLRow label="Return Postage Billing" value={-filteredMetrics.otherExpenses.returnPostageBilling} isExpense />
                <PLRow label="Discounts" value={-filteredMetrics.otherExpenses.discounts} isExpense />
                <PLRow label="Inbound Placement" value={-filteredMetrics.otherExpenses.inboundPlacement} isExpense />
                <PLRow label="Vine Enrollment" value={-filteredMetrics.otherExpenses.vineEnrollment} isExpense />
                <PLRow label="AWD Processing" value={-filteredMetrics.otherExpenses.awdProcessing} isExpense />
                <PLRow label="AWD Transportation" value={-filteredMetrics.otherExpenses.awdTransportation} isExpense />
                <PLRow label="AWD Storage" value={-filteredMetrics.otherExpenses.awdStorage} isExpense />
                <PLRow label="FBA Storage Fee" value={-filteredMetrics.otherExpenses.fbaStorageFee} isExpense />
                <PLRow label="Long-Term Storage" value={-filteredMetrics.otherExpenses.longTermStorage} isExpense />
                <PLRow label="Prep/Labeling" value={-filteredMetrics.otherExpenses.prepLabeling} isExpense />
                <PLRow label="Removal: Return" value={-filteredMetrics.otherExpenses.removalReturn} isExpense />
                <PLRow label="Removal: Disposal" value={-filteredMetrics.otherExpenses.removalDisposal} isExpense />
                <PLRow label="Others" value={-filteredMetrics.otherExpenses.others} isExpense />
                <PLRow label="TOTAL OTHER" value={-filteredMetrics.otherExpenses.total} isHeader isExpense />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {filteredMonthlyData.length > 0 && (
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
                        <Bar dataKey="income" name="Ingresos" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="Gastos" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
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
                        <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ fill: 'hsl(221, 83%, 53%)' }} />
                        <Line type="monotone" dataKey="netProfit" name="Beneficio Neto" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ fill: 'hsl(25, 95%, 53%)' }} />
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
                        {filteredMonthlyData.map((m, idx) => (
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
                          <td className="py-2 px-2 text-right text-status-success font-mono">{formatCurrency(filteredMetrics.totalIncome)}</td>
                          <td className="py-2 px-2 text-right text-status-critical font-mono">{formatCurrency(filteredMetrics.totalExpenses)}</td>
                          <td className="py-2 px-2 text-right text-primary font-mono">{formatCurrency(filteredMetrics.ebitda)}</td>
                          <td className="py-2 px-2 text-right">{formatPercent(filteredMetrics.ebitdaPercent)}</td>
                          <td className={`py-2 px-2 text-right font-mono ${filteredMetrics.netProfit >= 0 ? 'text-status-success' : 'text-status-critical'}`}>
                            {formatCurrency(filteredMetrics.netProfit)}
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
              <PLRow label="TOTAL INCOME" value={filteredMetrics.totalIncome} isHeader highlight />
              <PLRow label="EXCLUDING TAXES" value={filteredMetrics.excludingTaxes} />
              
              <div className="border-t border-border/50 my-3" />
              <p className="font-bold text-primary">TOTAL SALES REVENUE</p>
              
              <p className="font-semibold mt-2">FBM Sales</p>
              <PLRow label="Total Revenue" value={filteredMetrics.fbm.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={filteredMetrics.fbm.taxableIncome} indent={2} />
              <PLRow label="Tax Income" value={filteredMetrics.fbm.taxIncome} indent={2} />
              <PLRow label="Refunds" value={-filteredMetrics.fbm.refunds} indent={1} isExpense />
              <PLRow label="% Total Revenue" value={formatPercent(filteredMetrics.fbm.percentOfTotal)} indent={1} />
              
              <p className="font-semibold mt-2">FBA Sales</p>
              <PLRow label="Total Revenue" value={filteredMetrics.fba.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={filteredMetrics.fba.taxableIncome} indent={2} />
              <PLRow label="Tax Income" value={filteredMetrics.fba.taxIncome} indent={2} />
              <PLRow label="Refunds" value={-filteredMetrics.fba.refunds} indent={1} isExpense />
              <PLRow label="% of refunds on sales" value={formatPercent(filteredMetrics.fba.refundRate)} indent={1} />
              
              <p className="font-semibold mt-2">OTHER INCOME FROM SALES</p>
              <PLRow label="Shipping Credits" value={filteredMetrics.otherIncome.shippingCredits} indent={1} />
              <PLRow label="Gift Wrap Credits" value={filteredMetrics.otherIncome.giftWrapCredits} indent={1} />
              <PLRow label="Regulatory Fee" value={filteredMetrics.otherIncome.regulatoryFee} indent={1} />
              <PLRow label="Marketplace Withheld Tax" value={filteredMetrics.otherIncome.marketplaceWithheldTax} indent={1} />
              <PLRow label="Promotional Rebates" value={-filteredMetrics.otherIncome.promotionalRebates} indent={1} isExpense />
              <PLRow label="FBA Reimbursements Total" value={filteredMetrics.otherIncome.reimbursements.total} indent={1} />
              
              <div className="border-t border-border/50 my-3" />
              <PLRow label="TOTAL EXPENSES" value={-filteredMetrics.totalExpenses} isHeader isExpense highlight />
              <PLRow label="TOTAL EXPENSES PER SALE" value={-filteredMetrics.expensesPerSale} isExpense />
              
              <p className="font-semibold mt-2">Sales Commissions ({formatPercent(filteredMetrics.salesCommissions.percentOfIncome)})</p>
              <PLRow label="FBM Sales Commission" value={-filteredMetrics.salesCommissions.fbm} indent={1} isExpense />
              <PLRow label="FBA Sales Commission" value={-filteredMetrics.salesCommissions.fba} indent={1} isExpense />
              <PLRow label="Refund Commissions" value={filteredMetrics.salesCommissions.refundCommissions} indent={1} />
              
              <p className="font-semibold mt-2">FBA Commissions</p>
              <PLRow label="FBA Shipping Commission" value={-filteredMetrics.fbaCommissions.shipping} indent={1} isExpense />
              <PLRow label="FBA Shipping Credits" value={filteredMetrics.fbaCommissions.shippingCredits} indent={1} />
              
              <p className="font-semibold mt-2">Other Expenses</p>
              <PLRow label="Subscription" value={-filteredMetrics.otherExpenses.subscription} indent={1} isExpense />
              <PLRow label="Advertising" value={-filteredMetrics.otherExpenses.advertising} indent={1} isExpense />
              <PLRow label="Inventory Storage" value={-filteredMetrics.otherExpenses.inventoryStorage} indent={1} isExpense />
              <PLRow label="Inbound Placement" value={-filteredMetrics.otherExpenses.inboundPlacement} indent={1} isExpense />
              <PLRow label="Others" value={-filteredMetrics.otherExpenses.others} indent={1} isExpense />
              
              <div className="border-t border-border/50 my-3" />
              <div className="bg-primary/10 p-3 rounded-lg">
                <PLRow label="EBITDA" value={filteredMetrics.ebitda} isHeader />
                <PLRow label="% of Income" value={formatPercent(filteredMetrics.ebitdaPercent)} />
              </div>
              
              <PLRow label="Taxes" value={-filteredMetrics.taxes} isExpense />
              
              <div className={`p-3 rounded-lg mt-2 ${filteredMetrics.netProfit >= 0 ? 'bg-status-success/10' : 'bg-status-critical/10'}`}>
                <PLRow label="NET PROFIT" value={filteredMetrics.netProfit} isHeader />
                <PLRow label="% of Income" value={formatPercent(filteredMetrics.netProfitPercent)} />
              </div>
              
              <div className="border-t border-border/50 my-3" />
              <PLRow label="Transfer" value={filteredMetrics.transfer} />
              <PLRow label="Debt" value={filteredMetrics.debt} />
              
              {Math.abs(filteredMetrics.mistake) > 1 && (
                <div className="bg-status-warning/10 p-3 rounded-lg mt-3">
                  <PLRow label="Calculated Total" value={filteredMetrics.calculatedTotal} />
                  <PLRow label="Actual Total" value={filteredMetrics.actualTotal} />
                  <PLRow label="MISTAKE" value={filteredMetrics.mistake} isHeader />
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
