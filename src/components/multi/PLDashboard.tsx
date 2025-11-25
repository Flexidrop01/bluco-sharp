import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, Truck, 
  RotateCcw, CreditCard, Building2, Calculator, AlertTriangle
} from 'lucide-react';

interface PLMetrics {
  // Sales Revenue
  totalIncome: number;
  excludingTaxes: number;
  
  // FBM
  fbm: {
    totalRevenue: number;
    taxableIncome: number;
    taxIncome: number;
    refunds: number;
    taxableRefunds: number;
    refundTax: number;
    percentOfTotal: number;
  };
  
  // FBA
  fba: {
    totalRevenue: number;
    taxableIncome: number;
    taxIncome: number;
    refunds: number;
    taxableRefunds: number;
    refundTax: number;
    refundRate: number;
  };
  
  // Other Income
  otherIncome: {
    shippingCredits: number;
    shippingCreditsTax: number;
    giftWrapCredits: number;
    giftWrapCreditsTax: number;
    regulatoryFee: number;
    regulatoryFeeTax: number;
    marketplaceWithheldTax: number;
    promotionalRebates: number;
    promotionalRebatesTax: number;
    reimbursements: {
      lostWarehouse: number;
      customerReturn: number;
      damagedWarehouse: number;
      customerServiceIssue: number;
      lostInbound: number;
      total: number;
    };
  };
  
  // Other Amazon Income
  otherAmazonIncome: {
    fbaInventoryFee: number;
    liquidations: number;
    fbaCustomerReturnFee: number;
    orderRetrocharge: number;
    several: number;
    total: number;
  };
  
  // Expenses
  totalExpenses: number;
  expensesPerSale: number;
  
  salesCommissions: {
    fbm: number;
    fba: number;
    refundCommissions: number;
    percentOfIncome: number;
    total: number;
  };
  
  fbaCommissions: {
    shipping: number;
    shippingCredits: number;
    total: number;
  };
  
  otherExpenses: {
    subscription: number;
    advertising: number;
    partnerCarrierShipment: number;
    inventoryStorage: number;
    generalAdjustment: number;
    returnPostageBilling: number;
    discounts: number;
    inboundPlacement: number;
    vineEnrollment: number;
    awdProcessing: number;
    awdTransportation: number;
    awdStorage: number;
    fbaStorageFee: number;
    longTermStorage: number;
    prepLabeling: number;
    removalReturn: number;
    removalDisposal: number;
    others: number;
    total: number;
  };
  
  // EBITDA
  ebitda: number;
  ebitdaPercent: number;
  
  // Final
  taxes: number;
  netProfit: number;
  netProfitPercent: number;
  
  // Transfers
  transfer: number;
  debt: number;
  
  // Calculated vs Actual
  calculatedTotal: number;
  actualTotal: number;
  mistake: number;
}

interface PLDashboardProps {
  metrics: PLMetrics;
  currency: string;
  period: string;
  monthlyData?: { month: string; data: PLMetrics }[];
}

const PLDashboard = ({ metrics, currency, period, monthlyData }: PLDashboardProps) => {
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
        <TabsList className="glass-card p-1">
          <TabsTrigger value="summary">Resumen P&L</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
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
                <PLRow label="Refund Commissions" value={metrics.salesCommissions.refundCommissions} />
                <PLRow label="% of Income" value={formatPercent(metrics.salesCommissions.percentOfIncome)} />
              </div>

              {/* FBA Commissions */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2">FBA Commissions</p>
                <PLRow label="FBA Shipping Commission" value={-metrics.fbaCommissions.shipping} isExpense />
                <PLRow label="FBA Shipping Commission Credits" value={metrics.fbaCommissions.shippingCredits} />
              </div>

              {/* Other Expenses */}
              <div className="border rounded-lg p-3">
                <p className="font-semibold mb-2">Other Expenses</p>
                <PLRow label="Subscription" value={-metrics.otherExpenses.subscription} isExpense />
                <PLRow label="Cost of Advertising" value={-metrics.otherExpenses.advertising} isExpense />
                <PLRow label="FBA Amazon-Partnered Carrier Shipment Fee" value={-metrics.otherExpenses.partnerCarrierShipment} isExpense />
                <PLRow label="FBA Inventory Storage Fee" value={-metrics.otherExpenses.inventoryStorage} isExpense />
                <PLRow label="FBA Inbound Placement Service Fee" value={-metrics.otherExpenses.inboundPlacement} isExpense />
                <PLRow label="Vine Enrollment Fee" value={-metrics.otherExpenses.vineEnrollment} isExpense />
                <PLRow label="AWD Processing Fee" value={-metrics.otherExpenses.awdProcessing} isExpense />
                <PLRow label="AWD Transportation Fee" value={-metrics.otherExpenses.awdTransportation} isExpense />
                <PLRow label="AWD Storage Fee" value={-metrics.otherExpenses.awdStorage} isExpense />
                <PLRow label="FBA Long-Term Storage Fee" value={-metrics.otherExpenses.longTermStorage} isExpense />
                <PLRow label="FBA Prep Fee: Labeling" value={-metrics.otherExpenses.prepLabeling} isExpense />
                <PLRow label="FBA Removal Order: Return Fee" value={-metrics.otherExpenses.removalReturn} isExpense />
                <PLRow label="FBA Removal Order: Disposal Fee" value={-metrics.otherExpenses.removalDisposal} isExpense />
                <PLRow label="Return Postage Billing" value={-metrics.otherExpenses.returnPostageBilling} isExpense />
                <PLRow label="Discounts" value={-metrics.otherExpenses.discounts} isExpense />
                <PLRow label="Others" value={-metrics.otherExpenses.others} isExpense />
                <PLRow label="TOTAL OTHER EXPENSES" value={-metrics.otherExpenses.total} isHeader isExpense highlight />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">P&L Completo - Estilo Bluco</CardTitle>
              <p className="text-xs text-muted-foreground">{period} | {currency}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              {/* Full P&L Statement */}
              <PLRow label="TOTAL INCOME" value={metrics.totalIncome} isHeader highlight />
              <PLRow label="EXCLUDING TAXES" value={metrics.excludingTaxes} isHeader />
              
              <div className="border-t border-border/50 my-3" />
              <PLRow label="TOTAL SALES REVENUE" value={metrics.fba.totalRevenue + metrics.fbm.totalRevenue} isHeader />
              
              <PLRow label="FBM Sales" value={metrics.fbm.totalRevenue} />
              <PLRow label="Total revenue" value={metrics.fbm.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={metrics.fbm.taxableIncome} indent={1} />
              <PLRow label="Tax Income" value={metrics.fbm.taxIncome} indent={1} />
              <PLRow label="Refunds" value={-metrics.fbm.refunds} indent={1} isExpense />
              <PLRow label="% Total Revenue" value={formatPercent(metrics.fbm.percentOfTotal)} indent={1} />

              <div className="border-t border-border/30 my-2" />
              <PLRow label="FBA Sales" value={metrics.fba.totalRevenue} />
              <PLRow label="Total revenue" value={metrics.fba.totalRevenue} indent={1} />
              <PLRow label="B.Taxable Income" value={metrics.fba.taxableIncome} indent={1} />
              <PLRow label="Tax Income" value={metrics.fba.taxIncome} indent={1} />
              <PLRow label="Refunds" value={-metrics.fba.refunds} indent={1} isExpense />
              <PLRow label="% of refunds on sales" value={formatPercent(metrics.fba.refundRate)} indent={1} />

              <div className="border-t border-border/30 my-2" />
              <PLRow label="OTHER INCOME FROM SALES" value={metrics.otherIncome.reimbursements.total + metrics.otherIncome.shippingCredits} />
              <PLRow label="FBA Inventory Reimbursements" value={metrics.otherIncome.reimbursements.total} indent={1} />
              <PLRow label="Promotional Rebates" value={-metrics.otherIncome.promotionalRebates} indent={1} isExpense />

              <div className="border-t border-border/50 my-3" />
              <PLRow label="TOTAL EXPENSES" value={-metrics.totalExpenses} isHeader isExpense highlight />
              <PLRow label="TOTAL EXPENSES PER SALE" value={-metrics.expensesPerSale} />
              
              <PLRow label="Sales Commissions" value={-metrics.salesCommissions.total} isExpense />
              <PLRow label="FBA Commissions" value={-metrics.fbaCommissions.total} isExpense />
              <PLRow label="Other Expenses" value={-metrics.otherExpenses.total} isExpense />

              <div className="border-t border-border/50 my-3" />
              <PLRow label="EBITDA (IT-GT)" value={metrics.ebitda} isHeader highlight />
              <PLRow label="% of Income" value={formatPercent(metrics.ebitdaPercent)} />

              <div className="border-t border-border/30 my-2" />
              <PLRow label="Taxes" value={-metrics.taxes} isExpense />
              <PLRow label="Net Profit" value={metrics.netProfit} isHeader highlight />
              <PLRow label="% of Income" value={formatPercent(metrics.netProfitPercent)} />

              <div className="border-t border-border/50 my-3" />
              <PLRow label="Marketplace Withheld Tax" value={-metrics.otherIncome.marketplaceWithheldTax} isExpense />
              <PLRow label="Transfer" value={-metrics.transfer} isExpense />
              <PLRow label="Debt" value={metrics.debt} />

              <div className="border-t border-border/50 my-3" />
              <PLRow label="TOTAL CALCULATED AMOUNT" value={metrics.calculatedTotal} isHeader />
              <PLRow label="ACTUAL TOTAL AMOUNT" value={metrics.actualTotal} isHeader />
              {Math.abs(metrics.mistake) > 0.01 && (
                <PLRow label="MISTAKE" value={metrics.mistake} isHeader highlight />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { PLDashboard, type PLMetrics };
export default PLDashboard;
