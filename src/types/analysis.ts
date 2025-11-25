export type ReportType = 'seller' | 'vendor' | 'unknown';

export interface MetricData {
  label: string;
  value: string | number;
  change?: number;
  status?: 'critical' | 'warning' | 'success' | 'neutral';
  description?: string;
}

export interface SKUData {
  sku: string;
  name: string;
  sales: number;
  fees: number;
  feePercent: number;
  refunds: number;
  refundRate: number;
  profit?: number;
  status: 'critical' | 'warning' | 'success';
}

export interface MarketplaceData {
  marketplace: string;
  sales: number;
  fees: number;
  feePercent: number;
  orders: number;
  status: 'critical' | 'warning' | 'success';
}

export interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  timeframe: string;
}

export interface MissingData {
  field: string;
  reason: string;
  impact: string;
}

export interface AnalysisResult {
  reportType: ReportType;
  fileName: string;
  analyzedAt: Date;
  
  // Section 1: Executive Summary
  executiveSummary: string;
  
  // Section 2: Numerical Diagnosis
  metrics: {
    grossSales: MetricData;
    netSales: MetricData;
    totalFees: MetricData;
    feePercent: MetricData;
    refunds: MetricData;
    refundRate: MetricData;
    profitEstimate?: MetricData;
  };
  skuPerformance: SKUData[];
  marketplaceBreakdown: MarketplaceData[];
  
  // Section 3: Strategic Analysis
  strategicAnalysis: {
    risks: string[];
    opportunities: string[];
    dependencies: string[];
    recommendations: string[];
  };
  
  // Section 4: Operational Analysis
  operationalAnalysis: {
    feeStructure: string;
    refundStructure: string;
    skuIssues: string[];
    pricingIssues: string[];
    logisticsIssues: string[];
    inventoryIssues: string[];
  };
  
  // Section 5: Action Plan
  actionPlan: ActionItem[];
  
  // Section 6: Missing Data
  missingData: MissingData[];
}

export interface FileUploadState {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}
