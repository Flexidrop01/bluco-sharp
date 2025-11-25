export type ReportType = 'pay' | 'transaction' | 'settlement' | 'refund' | 'ads' | 'reimbursement' | 'awd' | 'logistics' | 'unknown';
export type FulfillmentModel = 'FBA' | 'FBM' | 'AWD' | 'SWA' | 'Unknown';

export interface FileInfo {
  id: string;
  fileName: string;
  marketplace: string;
  country: string;
  currency: string;
  region: string;
  reportType: ReportType;
  dateRange?: { start: Date; end: Date };
  rowCount: number;
  detectedColumns: string[];
}

export interface NormalizedTransaction {
  fileId: string;
  orderId?: string;
  sku?: string;
  asin?: string;
  marketplace: string;
  country: string;
  currency: string;
  date?: Date;
  transactionType: string;
  category: 'revenue' | 'refund' | 'fee' | 'reimbursement' | 'other';
  subcategory: string;
  fulfillmentModel: FulfillmentModel;
  amount: number;
  amountUSD: number;
  description?: string;
  rawData: Record<string, unknown>;
}

export interface CountryMetrics {
  country: string;
  marketplace: string;
  currency: string;
  
  // Revenue
  grossSales: number;
  grossSalesUSD: number;
  shippingCredits: number;
  giftwrapCredits: number;
  promotionalRebates: number;
  taxCollected: number;
  
  // Refunds
  totalRefunds: number;
  refundCount: number;
  refundRate: number;
  
  // Fees breakdown
  fees: {
    referral: number;
    fba: number;
    storage: number;
    inboundPlacement: number;
    advertising: number;
    regulatory: number;
    subscription: number;
    removal: number;
    liquidation: number;
    other: number;
    total: number;
  };
  feePercent: number;
  
  // Reimbursements
  reimbursements: {
    lost: number;
    damaged: number;
    customerService: number;
    other: number;
    total: number;
  };
  
  // Model breakdown
  modelBreakdown: {
    fba: { sales: number; fees: number; refunds: number };
    fbm: { sales: number; fees: number; refunds: number };
    awd: { sales: number; fees: number; refunds: number };
  };
  
  // Calculations
  netSales: number;
  netSalesUSD: number;
  totalExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  
  // Errors
  calculatedTotal: number;
  actualTotal: number;
  discrepancy: number;
  hasError: boolean;
}

export interface ModelMetrics {
  model: FulfillmentModel;
  totalSales: number;
  totalSalesUSD: number;
  totalFees: number;
  feePercent: number;
  totalRefunds: number;
  refundRate: number;
  countries: string[];
  transactionCount: number;
}

export interface FeeTypeMetrics {
  feeType: string;
  totalAmount: number;
  totalAmountUSD: number;
  percentOfTotal: number;
  byCountry: { country: string; amount: number }[];
  trend?: 'up' | 'down' | 'stable';
}

export interface SKUMetrics {
  sku: string;
  asin?: string;
  totalSales: number;
  totalFees: number;
  feePercent: number;
  totalRefunds: number;
  refundRate: number;
  countries: string[];
  fulfillmentModel: FulfillmentModel;
  profit: number;
  profitMargin: number;
}

export interface DiscrepancyAlert {
  type: 'calculation_error' | 'missing_data' | 'unusual_fee' | 'high_refund' | 'negative_balance';
  severity: 'critical' | 'warning' | 'info';
  country?: string;
  description: string;
  expectedValue?: number;
  actualValue?: number;
  difference?: number;
  recommendation: string;
}

export interface MultiAnalysisResult {
  analyzedAt: Date;
  fileCount: number;
  files: FileInfo[];
  
  // Global metrics
  global: {
    totalSalesUSD: number;
    totalFeesUSD: number;
    totalRefundsUSD: number;
    totalReimbursementsUSD: number;
    globalFeePercent: number;
    globalRefundRate: number;
    netProfitUSD: number;
    profitMargin: number;
    transactionCount: number;
    skuCount: number;
    countriesCount: number;
  };
  
  // Breakdowns
  byCountry: CountryMetrics[];
  byModel: ModelMetrics[];
  byFeeType: FeeTypeMetrics[];
  topSKUs: SKUMetrics[];
  bottomSKUs: SKUMetrics[];
  
  // Alerts
  alerts: DiscrepancyAlert[];
  
  // Executive summary
  executiveSummary: string;
  
  // Recommendations
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    impact: string;
    country?: string;
  }[];
}
