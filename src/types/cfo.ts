// CFO Brain Types - Fiscal & VAT Analysis for EU Amazon Sellers/Vendors

export type TransactionType = 
  | 'SALE'
  | 'REFUND'
  | 'FC_TRANSFER'
  | 'INBOUND'
  | 'RETURN'
  | 'COMMINGLING'
  | 'ADJUSTMENT'
  | 'MOVEMENT'
  | 'UNKNOWN';

export type FiscalClassification =
  | 'domestic_supply'
  | 'intra_eu_supply_b2b'
  | 'intra_eu_supply_b2c'
  | 'intra_eu_acquisition'
  | 'export_outside_eu'
  | 'movement_of_goods'
  | 'distance_sales'
  | 'cross_border_fba'
  | 'oss_sale'
  | 'ioss_sale'
  | 'reverse_charge'
  | 'unknown';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ActionUrgency = 'urgent_24h' | 'high_48_72h' | 'medium_term' | 'optional';

export interface VATTransaction {
  id: string;
  activityPeriod: string;
  transactionType: TransactionType;
  taxCalculationDate: string;
  sellerSku: string;
  asin: string;
  countryOfManufacture: string;
  departureCountry: string;
  arrivalCountry: string;
  taxableJurisdiction: string;
  priceExclVat: number;
  vatRate: number;
  vatAmount: number;
  totalInclVat: number;
  buyerVatNumber: string | null;
  vatInvoiceNumber: string | null;
  exchangeRate: number;
  exportOutsideEu: boolean;
  productTaxCode: string;
  transportationMode: string;
  commodityCode: string;
  supplementaryUnit: string;
  fiscalClassification: FiscalClassification;
  currency: string;
}

export interface CountryVATSummary {
  country: string;
  countryCode: string;
  totalSales: number;
  totalVatCollected: number;
  totalVatDue: number;
  vatInconsistencies: number;
  domesticSales: number;
  intraEuB2B: number;
  intraEuB2C: number;
  exports: number;
  ossApplicable: boolean;
  registrationRequired: boolean;
  declarationRequired: boolean;
  transactionCount: number;
}

export interface FiscalError {
  id: string;
  severity: ErrorSeverity;
  category: string;
  description: string;
  affectedTransactions: number;
  country: string;
  vatImpact: number;
  recommendation: string;
}

export interface FBAMovement {
  id: string;
  departureCountry: string;
  arrivalCountry: string;
  date: string;
  quantity: number;
  valueExclVat: number;
  vatDue: number;
  intrastatRequired: boolean;
  declared: boolean;
}

export interface RegularizationItem {
  id: string;
  type: 'vat_correction' | 'registration' | 'invoice_rectification' | 'export_adjustment' | 'oss_ioss_adjustment';
  country: string;
  description: string;
  amount: number;
  urgency: ActionUrgency;
  deadline: string | null;
}

export interface ActionItem {
  id: string;
  urgency: ActionUrgency;
  title: string;
  description: string;
  country: string | null;
  estimatedImpact: number;
  completed: boolean;
}

export interface CFOExecutiveSummary {
  overallStatus: 'critical' | 'warning' | 'good';
  totalTransactions: number;
  totalSalesExclVat: number;
  totalVatCollected: number;
  totalVatDue: number;
  vatDiscrepancy: number;
  countriesWithObligations: number;
  criticalIssues: number;
  highPriorityIssues: number;
  mainRisks: string[];
  urgentCorrections: string[];
}

export interface CFOAnalysisResult {
  fileName: string;
  reportType: string;
  processedAt: string;
  period: string;
  
  executiveSummary: CFOExecutiveSummary;
  
  countryObligations: CountryVATSummary[];
  
  vatAnalysis: {
    totalVatCollected: number;
    totalVatDue: number;
    vatInconsistent: number;
    rateErrors: number;
    reverseChargeErrors: number;
    byRate: { rate: number; amount: number; count: number }[];
  };
  
  exports: {
    totalExportsOutsideEu: number;
    withProofOfExport: number;
    missingProof: number;
    misclassified: number;
  };
  
  intraEu: {
    b2bTotal: number;
    b2cTotal: number;
    invalidVatNumbers: number;
    missingVatNumbers: number;
    classificationErrors: number;
  };
  
  fbaMovements: FBAMovement[];
  
  errors: FiscalError[];
  
  regularizations: RegularizationItem[];
  
  actionPlan: ActionItem[];
  
  rawMetrics: {
    totalRows: number;
    validTransactions: number;
    skippedRows: number;
    uniqueCountries: string[];
    uniqueSkus: number;
    dateRange: { from: string; to: string };
  };
}
