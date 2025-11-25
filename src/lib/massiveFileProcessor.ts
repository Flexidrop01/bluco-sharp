import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  MARKETPLACE_COUNTRY_MAP,
  EXCHANGE_RATES,
  shouldSkipRow,
  isHeaderRow,
  findStandardColumn,
  parseNumericValue,
  parseDateValue
} from './massiveColumnMappings';

// Chunk size for processing large files
const CHUNK_SIZE = 5000;

// Aggregated metrics structure
export interface AggregatedMetrics {
  // Global totals
  totalRows: number;
  validTransactions: number;
  skippedRows: number;
  
  // Revenue - EXACT COLUMNS FROM AMAZON
  grossSales: number;
  grossSalesUSD: number;
  productSales: number;              // ventas de productos
  productSalesTax: number;           // impuesto de ventas de productos
  shippingCredits: number;           // abonos de envío
  shippingCreditsTax: number;        // impuestos por abonos de envío
  giftwrapCredits: number;           // abonos de envoltorio para regalo
  giftwrapCreditsTax: number;        // impuestos por abonos de envoltorio para regalo
  promotionalRebates: number;        // devoluciones promocionales
  promotionalRebatesTax: number;     // impuestos de descuentos por promociones
  taxCollected: number;              // impuesto retenido en el sitio web
  
  // Fees - EXACT COLUMNS FROM AMAZON (already negative)
  totalFees: number;
  sellingFees: number;               // tarifas de venta
  fbaFees: number;                   // tarifas de Logística de Amazon
  otherTransactionFees: number;      // tarifas de otras transacciones
  otherFees: number;                 // otro
  storageFees: number;
  inboundFees: number;
  regulatoryFees: number;
  advertisingFees: number;
  
  // Refunds & Reimbursements
  totalRefunds: number;
  refundCount: number;
  totalReimbursements: number;
  reimbursementLost: number;
  reimbursementDamaged: number;
  reimbursementOther: number;
  
  // Calculated
  netSales: number;
  netSalesUSD: number;
  ebitda: number;
  feePercent: number;
  refundRate: number;
  
  // Breakdowns - USE MARKETPLACE AS KEY, NOT COUNTRY
  byCountry: Map<string, CountryAggregates>;
  byMonth: Map<string, MonthAggregates>;
  bySKU: Map<string, SKUAggregates>;
  byFeeType: Map<string, number>;
  byFulfillment: Map<string, FulfillmentAggregates>;
  byCity: Map<string, CityAggregates>;
  byRegion: Map<string, RegionAggregates>;
  byTransactionType: Map<string, TransactionTypeAggregates>;
  
  // Errors
  calculatedTotal: number;
  actualTotal: number;
  discrepancies: DiscrepancyRecord[];
  
  // Metadata
  currencies: Set<string>;
  marketplaces: Set<string>;
  dateRange: { min: Date | null; max: Date | null };
  detectedColumns: Map<string, string>;
  uniqueSKUs: Set<string>;
}

export interface CountryAggregates {
  country: string;
  marketplace: string;
  currency: string;
  grossSales: number;
  grossSalesUSD: number;
  fees: number;
  feePercent: number;
  refunds: number;
  refundRate: number;
  reimbursements: number;
  netSales: number;
  ebitda: number;
  transactionCount: number;
  topCities: Map<string, number>;
}

export interface MonthAggregates {
  month: string;
  grossSales: number;
  fees: number;
  refunds: number;
  netSales: number;
  transactionCount: number;
}

export interface SKUAggregates {
  sku: string;
  description: string;
  asin?: string;
  grossSales: number;
  fees: number;
  feePercent: number;
  refunds: number;
  refundRate: number;
  quantity: number;
  transactionCount: number;
  countries: Set<string>;
  cities: Set<string>;
  fulfillment: string;
}

export interface FulfillmentAggregates {
  model: string;
  grossSales: number;
  fees: number;
  refunds: number;
  transactionCount: number;
}

export interface TransactionTypeAggregates {
  type: string;
  count: number;
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
  descriptions: Map<string, { count: number; amount: number }>;
}

export interface CityAggregates {
  city: string;
  region: string;
  postalCode: string;
  country: string;
  grossSales: number;
  transactionCount: number;
  topSKUs: Map<string, number>;
}

export interface RegionAggregates {
  region: string;
  country: string;
  grossSales: number;
  transactionCount: number;
  cities: Set<string>;
}

export interface DiscrepancyRecord {
  row: number;
  calculated: number;
  actual: number;
  difference: number;
  description: string;
}

// Initialize empty metrics
const createEmptyMetrics = (): AggregatedMetrics => ({
  totalRows: 0,
  validTransactions: 0,
  skippedRows: 0,
  grossSales: 0,
  grossSalesUSD: 0,
  productSales: 0,
  productSalesTax: 0,
  shippingCredits: 0,
  shippingCreditsTax: 0,
  giftwrapCredits: 0,
  giftwrapCreditsTax: 0,
  promotionalRebates: 0,
  promotionalRebatesTax: 0,
  taxCollected: 0,
  totalFees: 0,
  sellingFees: 0,
  fbaFees: 0,
  otherTransactionFees: 0,
  otherFees: 0,
  storageFees: 0,
  inboundFees: 0,
  regulatoryFees: 0,
  advertisingFees: 0,
  totalRefunds: 0,
  refundCount: 0,
  totalReimbursements: 0,
  reimbursementLost: 0,
  reimbursementDamaged: 0,
  reimbursementOther: 0,
  netSales: 0,
  netSalesUSD: 0,
  ebitda: 0,
  feePercent: 0,
  refundRate: 0,
  byCountry: new Map(),
  byMonth: new Map(),
  bySKU: new Map(),
  byFeeType: new Map(),
  byFulfillment: new Map(),
  byCity: new Map(),
  byRegion: new Map(),
  byTransactionType: new Map(),
  calculatedTotal: 0,
  actualTotal: 0,
  discrepancies: [],
  currencies: new Set(),
  marketplaces: new Set(),
  dateRange: { min: null, max: null },
  detectedColumns: new Map(),
  uniqueSKUs: new Set()
});

// Detect fulfillment model from Spanish values: "Vendedor" = FBM, "Amazon" = FBA
const detectFulfillmentModel = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  // EXACT Spanish values from Amazon file
  if (normalized === 'amazon' || normalized === 'amazon.es') {
    return 'FBA';
  }
  if (normalized === 'vendedor') {
    return 'FBM';
  }
  
  // Fallback patterns
  if (normalized.includes('amazon') || normalized.includes('fba') || normalized.includes('logística')) {
    return 'FBA';
  }
  if (normalized.includes('vendedor') || normalized.includes('merchant') || normalized.includes('fbm') || normalized.includes('mfn')) {
    return 'FBM';
  }
  
  return 'Unknown';
};

// Detect marketplace from "web de Amazon" column - RETURN THE EXACT VALUE
const detectMarketplaceExact = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  // Direct domain matching
  for (const domain of Object.keys(MARKETPLACE_COUNTRY_MAP)) {
    if (normalized === domain || normalized.includes(domain)) {
      return domain;
    }
  }
  
  // If it looks like amazon.XX, return it
  if (normalized.startsWith('amazon.')) {
    return normalized;
  }
  
  return normalized || 'unknown';
};

// Process a single row and update metrics
const processRow = (
  row: Record<string, unknown>,
  columnMap: Map<string, string>,
  metrics: AggregatedMetrics,
  rowIndex: number
): void => {
  metrics.totalRows++;
  
  // Skip invalid rows
  if (shouldSkipRow(row)) {
    metrics.skippedRows++;
    return;
  }
  
  metrics.validTransactions++;
  
  // Get mapped values
  const getValue = (standardKey: string): unknown => {
    const originalCol = columnMap.get(standardKey);
    return originalCol ? row[originalCol] : undefined;
  };
  
  const getNumeric = (standardKey: string): number => {
    return parseNumericValue(getValue(standardKey));
  };
  
  const getString = (standardKey: string): string => {
    const val = getValue(standardKey);
    return val ? String(val).trim() : '';
  };
  
  // === EXTRACT EXACT VALUES FROM FILE ===
  
  // Marketplace - USE THE EXACT VALUE (amazon.es, not Spain)
  const marketplaceRaw = getString('marketplace');
  const marketplace = detectMarketplaceExact(marketplaceRaw);
  const marketplaceInfo = MARKETPLACE_COUNTRY_MAP[marketplace] || { currency: 'EUR', country: marketplace };
  const currency = marketplaceInfo.currency;
  const exchangeRate = EXCHANGE_RATES[currency] || 1;
  
  // Fulfillment - "gestión logística": Vendedor = FBM, Amazon = FBA
  const fulfillmentRaw = getString('fulfillment');
  const fulfillmentModel = detectFulfillmentModel(fulfillmentRaw);
  
  // Transaction type - "tipo": Pedido, Reembolso, Tarifa, etc.
  const transactionType = getString('type') || 'Unknown';
  
  // Description - used to categorize non-order fees
  const description = getString('description');
  
  // Extract key fields
  const date = parseDateValue(getValue('date'));
  const sku = getString('sku');
  const quantity = Math.max(0, getNumeric('quantity'));
  
  // Demographic data
  const city = getString('city');
  const region = getString('region');
  const postalCode = getString('postalCode');
  
  // === INCOME COLUMNS (positive values) ===
  const productSales = getNumeric('productSales');
  const productSalesTax = getNumeric('productSalesTax');
  const shippingCredits = getNumeric('shippingCredits');
  const shippingCreditsTax = getNumeric('shippingCreditsTax');
  const giftwrapCredits = getNumeric('giftwrapCredits');
  const giftwrapCreditsTax = getNumeric('giftwrapCreditsTax');
  const promotionalRebates = getNumeric('promotionalRebates'); // Usually negative
  const promotionalRebatesTax = getNumeric('promotionalRebatesTax');
  const marketplaceWithheldTax = getNumeric('marketplaceWithheldTax');
  
  // Total income = sum of all income columns
  const rowIncome = productSales + productSalesTax + shippingCredits + shippingCreditsTax + 
                    giftwrapCredits + giftwrapCreditsTax + promotionalRebates + 
                    promotionalRebatesTax + marketplaceWithheldTax;
  
  // === EXPENSE COLUMNS (already negative in file) ===
  const sellingFees = getNumeric('sellingFees');        // Negative
  const fbaFees = getNumeric('fbaFees');                // Negative
  const otherTransactionFees = getNumeric('otherTransactionFees'); // Negative
  const otherFees = getNumeric('other');                // Negative
  
  // Total expenses = sum of all expense columns (negative sum)
  const rowExpenses = sellingFees + fbaFees + otherTransactionFees + otherFees;
  
  // Total from file
  const rowTotal = getNumeric('total');
  
  // === UPDATE GLOBAL METRICS ===
  
  // Income (only positive values)
  if (productSales > 0) metrics.productSales += productSales;
  if (productSalesTax > 0) metrics.productSalesTax += productSalesTax;
  if (shippingCredits > 0) metrics.shippingCredits += shippingCredits;
  if (shippingCreditsTax > 0) metrics.shippingCreditsTax += shippingCreditsTax;
  if (giftwrapCredits > 0) metrics.giftwrapCredits += giftwrapCredits;
  if (giftwrapCreditsTax > 0) metrics.giftwrapCreditsTax += giftwrapCreditsTax;
  if (marketplaceWithheldTax > 0) metrics.taxCollected += marketplaceWithheldTax;
  
  // Promotional rebates (usually negative = discount)
  metrics.promotionalRebates += promotionalRebates;
  metrics.promotionalRebatesTax += promotionalRebatesTax;
  
  // Expenses (keep negative values)
  metrics.sellingFees += sellingFees;
  metrics.fbaFees += fbaFees;
  metrics.otherTransactionFees += otherTransactionFees;
  metrics.otherFees += otherFees;
  
  // Check if this is a refund row (type = Reembolso or negative product sales)
  const isRefund = transactionType.toLowerCase().includes('reembolso') || 
                   transactionType.toLowerCase().includes('refund');
  
  if (isRefund) {
    metrics.refundCount++;
    // Refunds have negative product sales, take absolute value
    metrics.totalRefunds += Math.abs(productSales);
  }
  
  // Track total
  metrics.actualTotal += rowTotal;
  
  // === UPDATE METADATA ===
  metrics.currencies.add(currency);
  if (marketplace && marketplace !== 'unknown') {
    metrics.marketplaces.add(marketplace);
  }
  if (sku) metrics.uniqueSKUs.add(sku);
  
  if (date) {
    if (!metrics.dateRange.min || date < metrics.dateRange.min) metrics.dateRange.min = date;
    if (!metrics.dateRange.max || date > metrics.dateRange.max) metrics.dateRange.max = date;
  }
  
  // === UPDATE TRANSACTION TYPE BREAKDOWN (PIVOT TABLE) ===
  if (!metrics.byTransactionType.has(transactionType)) {
    metrics.byTransactionType.set(transactionType, {
      type: transactionType,
      count: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalNet: 0,
      descriptions: new Map()
    });
  }
  const txTypeData = metrics.byTransactionType.get(transactionType)!;
  txTypeData.count++;
  txTypeData.totalIncome += Math.max(0, rowIncome);
  txTypeData.totalExpenses += Math.min(0, rowExpenses);
  txTypeData.totalNet += rowTotal;
  
  // Track descriptions within transaction type (for fees categorization)
  if (description && !transactionType.toLowerCase().includes('pedido')) {
    const descKey = description.substring(0, 50); // Truncate long descriptions
    if (!txTypeData.descriptions.has(descKey)) {
      txTypeData.descriptions.set(descKey, { count: 0, amount: 0 });
    }
    const descData = txTypeData.descriptions.get(descKey)!;
    descData.count++;
    descData.amount += rowTotal;
  }
  
  // === UPDATE MARKETPLACE BREAKDOWN (use marketplace as key, NOT country) ===
  if (marketplace && marketplace !== 'unknown') {
    if (!metrics.byCountry.has(marketplace)) {
      metrics.byCountry.set(marketplace, {
        country: marketplaceInfo.country || marketplace,
        marketplace: marketplace,
        currency: currency,
        grossSales: 0,
        grossSalesUSD: 0,
        fees: 0,
        feePercent: 0,
        refunds: 0,
        refundRate: 0,
        reimbursements: 0,
        netSales: 0,
        ebitda: 0,
        transactionCount: 0,
        topCities: new Map()
      });
    }
    const marketplaceData = metrics.byCountry.get(marketplace)!;
    if (!isRefund && productSales > 0) {
      marketplaceData.grossSales += productSales;
      marketplaceData.grossSalesUSD += productSales * exchangeRate;
    }
    marketplaceData.fees += rowExpenses; // Already negative
    if (isRefund) marketplaceData.refunds += Math.abs(productSales);
    marketplaceData.transactionCount++;
    if (city) {
      marketplaceData.topCities.set(city, (marketplaceData.topCities.get(city) || 0) + Math.max(0, productSales));
    }
  }
  
  // === UPDATE MONTH BREAKDOWN ===
  if (date) {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!metrics.byMonth.has(monthKey)) {
      metrics.byMonth.set(monthKey, {
        month: monthKey,
        grossSales: 0,
        fees: 0,
        refunds: 0,
        netSales: 0,
        transactionCount: 0
      });
    }
    const monthData = metrics.byMonth.get(monthKey)!;
    if (!isRefund && productSales > 0) monthData.grossSales += productSales;
    monthData.fees += rowExpenses;
    if (isRefund) monthData.refunds += Math.abs(productSales);
    monthData.transactionCount++;
  }
  
  // === UPDATE SKU BREAKDOWN ===
  if (sku) {
    if (!metrics.bySKU.has(sku)) {
      metrics.bySKU.set(sku, {
        sku,
        description: description || sku,
        asin: getString('asin') || '',
        grossSales: 0,
        fees: 0,
        feePercent: 0,
        refunds: 0,
        refundRate: 0,
        quantity: 0,
        transactionCount: 0,
        countries: new Set(),
        cities: new Set(),
        fulfillment: fulfillmentModel
      });
    }
    const skuData = metrics.bySKU.get(sku)!;
    if (!isRefund && productSales > 0) {
      skuData.grossSales += productSales;
      skuData.quantity += quantity;
    }
    skuData.fees += rowExpenses;
    if (isRefund) skuData.refunds += Math.abs(productSales);
    skuData.transactionCount++;
    if (marketplace) skuData.countries.add(marketplace);
    if (city) skuData.cities.add(city);
    // Update description if we get a better one
    if (description && description.length > skuData.description.length) {
      skuData.description = description;
    }
    // Update fulfillment if we get a valid one
    if (fulfillmentModel !== 'Unknown') {
      skuData.fulfillment = fulfillmentModel;
    }
  }
  
  // === UPDATE FULFILLMENT BREAKDOWN ===
  if (fulfillmentModel && fulfillmentModel !== 'Unknown') {
    if (!metrics.byFulfillment.has(fulfillmentModel)) {
      metrics.byFulfillment.set(fulfillmentModel, {
        model: fulfillmentModel,
        grossSales: 0,
        fees: 0,
        refunds: 0,
        transactionCount: 0
      });
    }
    const fulfillmentData = metrics.byFulfillment.get(fulfillmentModel)!;
    if (!isRefund && productSales > 0) fulfillmentData.grossSales += productSales;
    fulfillmentData.fees += rowExpenses;
    if (isRefund) fulfillmentData.refunds += Math.abs(productSales);
    fulfillmentData.transactionCount++;
  }
  
  // === UPDATE CITY BREAKDOWN ===
  if (city) {
    const cityKey = `${city}|${region}|${marketplace}`;
    if (!metrics.byCity.has(cityKey)) {
      metrics.byCity.set(cityKey, {
        city,
        region: region || '',
        postalCode: postalCode || '',
        country: marketplace,
        grossSales: 0,
        transactionCount: 0,
        topSKUs: new Map()
      });
    }
    const cityData = metrics.byCity.get(cityKey)!;
    if (!isRefund && productSales > 0) cityData.grossSales += productSales;
    cityData.transactionCount++;
    if (sku) {
      cityData.topSKUs.set(sku, (cityData.topSKUs.get(sku) || 0) + Math.max(0, productSales));
    }
  }
  
  // === UPDATE REGION BREAKDOWN ===
  if (region) {
    const regionKey = `${region}|${marketplace}`;
    if (!metrics.byRegion.has(regionKey)) {
      metrics.byRegion.set(regionKey, {
        region,
        country: marketplace,
        grossSales: 0,
        transactionCount: 0,
        cities: new Set()
      });
    }
    const regionData = metrics.byRegion.get(regionKey)!;
    if (!isRefund && productSales > 0) regionData.grossSales += productSales;
    regionData.transactionCount++;
    if (city) regionData.cities.add(city);
  }
  
  // === UPDATE FEE TYPE BREAKDOWN ===
  if (sellingFees < 0) metrics.byFeeType.set('Tarifas de venta', (metrics.byFeeType.get('Tarifas de venta') || 0) + Math.abs(sellingFees));
  if (fbaFees < 0) metrics.byFeeType.set('Logística de Amazon', (metrics.byFeeType.get('Logística de Amazon') || 0) + Math.abs(fbaFees));
  if (otherTransactionFees < 0) metrics.byFeeType.set('Otras transacciones', (metrics.byFeeType.get('Otras transacciones') || 0) + Math.abs(otherTransactionFees));
  if (otherFees < 0) metrics.byFeeType.set('Otro', (metrics.byFeeType.get('Otro') || 0) + Math.abs(otherFees));
};

// Finalize metrics after all rows processed
const finalizeMetrics = (metrics: AggregatedMetrics): void => {
  // Calculate gross sales (sum of all positive income)
  metrics.grossSales = metrics.productSales + metrics.productSalesTax + 
                       metrics.shippingCredits + metrics.shippingCreditsTax +
                       metrics.giftwrapCredits + metrics.giftwrapCreditsTax +
                       metrics.taxCollected;
  
  // Total fees (sum of negative expenses, as absolute value)
  metrics.totalFees = Math.abs(metrics.sellingFees + metrics.fbaFees + 
                               metrics.otherTransactionFees + metrics.otherFees);
  
  // Net sales (gross - promotional rebates - refunds)
  metrics.netSales = metrics.grossSales + metrics.promotionalRebates - metrics.totalRefunds;
  
  // EBITDA
  metrics.ebitda = metrics.netSales - metrics.totalFees + metrics.totalReimbursements;
  
  // Calculate USD values
  const avgExchangeRate = EXCHANGE_RATES['EUR'] || 1;
  metrics.grossSalesUSD = metrics.grossSales * avgExchangeRate;
  metrics.netSalesUSD = metrics.netSales * avgExchangeRate;
  
  // Calculate percentages
  metrics.feePercent = metrics.netSales > 0 ? (metrics.totalFees / metrics.netSales) * 100 : 0;
  metrics.refundRate = metrics.grossSales > 0 ? (metrics.totalRefunds / metrics.grossSales) * 100 : 0;
  
  // Calculated total for discrepancy check
  metrics.calculatedTotal = metrics.grossSales + metrics.promotionalRebates - 
                            metrics.totalFees + metrics.totalReimbursements;
  
  // Finalize marketplace metrics
  for (const [, marketplaceData] of metrics.byCountry) {
    marketplaceData.netSales = marketplaceData.grossSales - marketplaceData.refunds;
    marketplaceData.fees = Math.abs(marketplaceData.fees);
    marketplaceData.ebitda = marketplaceData.netSales - marketplaceData.fees + marketplaceData.reimbursements;
    marketplaceData.feePercent = marketplaceData.netSales > 0 ? (marketplaceData.fees / marketplaceData.netSales) * 100 : 0;
    marketplaceData.refundRate = marketplaceData.grossSales > 0 ? (marketplaceData.refunds / marketplaceData.grossSales) * 100 : 0;
  }
  
  // Finalize month metrics
  for (const [, monthData] of metrics.byMonth) {
    monthData.fees = Math.abs(monthData.fees);
    monthData.netSales = monthData.grossSales - monthData.refunds - monthData.fees;
  }
  
  // Finalize SKU metrics
  for (const [, skuData] of metrics.bySKU) {
    skuData.fees = Math.abs(skuData.fees);
    skuData.feePercent = skuData.grossSales > 0 ? (skuData.fees / skuData.grossSales) * 100 : 0;
    skuData.refundRate = skuData.grossSales > 0 ? (skuData.refunds / skuData.grossSales) * 100 : 0;
  }
  
  // Finalize fulfillment metrics
  for (const [, fulfillmentData] of metrics.byFulfillment) {
    fulfillmentData.fees = Math.abs(fulfillmentData.fees);
  }
  
  console.log('[CEO Brain] Final metrics:', {
    grossSales: metrics.grossSales.toFixed(2),
    totalFees: metrics.totalFees.toFixed(2),
    netSales: metrics.netSales.toFixed(2),
    ebitda: metrics.ebitda.toFixed(2),
    actualTotal: metrics.actualTotal.toFixed(2),
    marketplaces: Array.from(metrics.marketplaces),
    transactionTypes: Array.from(metrics.byTransactionType.keys())
  });
};

// Build column map from headers
const buildColumnMap = (headers: string[]): Map<string, string> => {
  const columnMap = new Map<string, string>();
  
  for (const header of headers) {
    const standardKey = findStandardColumn(header);
    if (standardKey && !columnMap.has(standardKey)) {
      columnMap.set(standardKey, header);
    }
  }
  
  console.log('[CEO Brain] Detected columns:', Object.fromEntries(columnMap));
  
  return columnMap;
};

// Process CSV with streaming
export const processMassiveCSV = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  return new Promise((resolve, reject) => {
    const metrics = createEmptyMetrics();
    let headers: string[] = [];
    let columnMap: Map<string, string> = new Map();
    let headerFound = false;
    let rowIndex = 0;
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      chunk: (results, parser) => {
        const rows = results.data as string[][];
        
        for (const row of rows) {
          rowIndex++;
          
          // Find header row
          if (!headerFound) {
            if (isHeaderRow(row)) {
              headers = row;
              columnMap = buildColumnMap(headers);
              metrics.detectedColumns = columnMap;
              headerFound = true;
              console.log('[CEO Brain] Header found at row', rowIndex);
            }
            continue;
          }
          
          // Convert row array to object
          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            rowObj[h] = row[i];
          });
          
          processRow(rowObj, columnMap, metrics, rowIndex);
        }
        
        // Report progress
        if (onProgress && file.size > 0) {
          const progress = Math.min(100, (rowIndex / (file.size / 100)) * 100);
          onProgress(progress);
        }
      },
      complete: () => {
        finalizeMetrics(metrics);
        console.log('[CEO Brain] Processing complete:', {
          totalRows: metrics.totalRows,
          validTransactions: metrics.validTransactions,
          skippedRows: metrics.skippedRows,
          uniqueSKUs: metrics.uniqueSKUs.size,
          marketplaces: Array.from(metrics.marketplaces),
          cities: metrics.byCity.size
        });
        resolve(metrics);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Process Excel with chunking
export const processMassiveExcel = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get all data as array of arrays
        const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        const metrics = createEmptyMetrics();
        let headers: string[] = [];
        let columnMap: Map<string, string> = new Map();
        let headerFound = false;
        
        // Process in chunks
        const totalRows = allData.length;
        
        for (let i = 0; i < totalRows; i++) {
          const row = allData[i] as string[];
          
          // Find header row
          if (!headerFound) {
            if (isHeaderRow(row.map(String))) {
              headers = row.map(String);
              columnMap = buildColumnMap(headers);
              metrics.detectedColumns = columnMap;
              headerFound = true;
              console.log('[CEO Brain] Header found at row', i);
            }
            continue;
          }
          
          // Convert row array to object
          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = row[idx];
          });
          
          processRow(rowObj, columnMap, metrics, i);
          
          // Report progress every 1000 rows
          if (onProgress && i % 1000 === 0) {
            onProgress((i / totalRows) * 100);
          }
        }
        
        finalizeMetrics(metrics);
        console.log('[CEO Brain] Processing complete:', {
          totalRows: metrics.totalRows,
          validTransactions: metrics.validTransactions,
          uniqueSKUs: metrics.uniqueSKUs.size
        });
        resolve(metrics);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

// Main function to process any file
export const processMassiveFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<AggregatedMetrics> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    return processMassiveCSV(file, onProgress);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processMassiveExcel(file, onProgress);
  } else {
    throw new Error('Unsupported file format. Use CSV or Excel.');
  }
};
