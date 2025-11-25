import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  MARKETPLACE_COUNTRY_MAP,
  EXCHANGE_RATES,
  shouldSkipRow,
  isHeaderRow,
  findStandardColumn,
  detectMarketplace,
  parseNumericValue,
  parseDateValue,
  classifyTransactionType
} from './massiveColumnMappings';

// Chunk size for processing large files
const CHUNK_SIZE = 5000;

// Aggregated metrics structure
export interface AggregatedMetrics {
  // Global totals
  totalRows: number;
  validTransactions: number;
  skippedRows: number;
  
  // Revenue
  grossSales: number;
  grossSalesUSD: number;
  productSales: number;
  shippingCredits: number;
  giftwrapCredits: number;
  promotionalRebates: number;
  taxCollected: number;
  
  // Fees
  totalFees: number;
  sellingFees: number;
  fbaFees: number;
  otherFees: number;
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
  
  // Breakdowns
  byCountry: Map<string, CountryAggregates>;
  byMonth: Map<string, MonthAggregates>;
  bySKU: Map<string, SKUAggregates>;
  byFeeType: Map<string, number>;
  byFulfillment: Map<string, FulfillmentAggregates>;
  byCity: Map<string, CityAggregates>;
  byRegion: Map<string, RegionAggregates>;
  byTransactionType: Map<string, number>;
  
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
}

export interface FulfillmentAggregates {
  model: string;
  grossSales: number;
  fees: number;
  refunds: number;
  transactionCount: number;
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
  shippingCredits: 0,
  giftwrapCredits: 0,
  promotionalRebates: 0,
  taxCollected: 0,
  totalFees: 0,
  sellingFees: 0,
  fbaFees: 0,
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

// Detect fulfillment model from Spanish or English values
const detectFulfillmentModel = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  
  // Spanish detection
  if (normalized === 'amazon' || normalized.includes('logística de amazon') || normalized.includes('fba')) {
    return 'FBA';
  }
  if (normalized === 'vendedor' || normalized.includes('merchant') || normalized.includes('fbm') || normalized.includes('mfn')) {
    return 'FBM';
  }
  if (normalized.includes('awd') || normalized.includes('warehouse')) {
    return 'AWD';
  }
  
  // Default based on content
  if (normalized.includes('amazon')) return 'FBA';
  return 'FBM';
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
  
  // Extract marketplace from "web de Amazon" column
  const marketplaceRaw = getString('marketplace');
  const marketplace = detectMarketplace(marketplaceRaw);
  const marketplaceInfo = MARKETPLACE_COUNTRY_MAP[marketplace] || MARKETPLACE_COUNTRY_MAP['amazon.com'];
  const currency = getString('currency') || marketplaceInfo.currency;
  const exchangeRate = EXCHANGE_RATES[currency] || 1;
  
  // Extract key fields
  const date = parseDateValue(getValue('date'));
  const sku = getString('sku');
  const description = getString('description');
  const quantity = Math.max(1, getNumeric('quantity'));
  const transactionType = classifyTransactionType(getString('type'));
  
  // Fulfillment - detect from Spanish values
  const fulfillmentRaw = getString('fulfillment');
  const fulfillmentModel = detectFulfillmentModel(fulfillmentRaw);
  
  // Demographic data
  const city = getString('city');
  const region = getString('region');
  const postalCode = getString('postalCode');
  
  // Revenue
  const productSales = getNumeric('productSales');
  const shippingCredits = getNumeric('shippingCredits');
  const giftwrapCredits = getNumeric('giftwrapCredits');
  const promotionalRebates = Math.abs(getNumeric('promotionalRebates'));
  const taxCollected = getNumeric('marketplaceWithheldTax') + getNumeric('productSalesTax');
  
  const rowGrossSales = productSales + shippingCredits + giftwrapCredits;
  
  // Fees (Spanish column names are already mapped)
  const sellingFees = Math.abs(getNumeric('sellingFees'));
  const fbaFees = Math.abs(getNumeric('fbaFees'));
  const otherFees = Math.abs(getNumeric('otherTransactionFees')) + Math.abs(getNumeric('other'));
  const storageFees = Math.abs(getNumeric('storageFee'));
  const inboundFees = Math.abs(getNumeric('fbaInboundPlacementFee'));
  const regulatoryFees = Math.abs(getNumeric('regulatoryFee'));
  const advertisingFees = Math.abs(getNumeric('advertisingFee'));
  
  const rowTotalFees = sellingFees + fbaFees + otherFees + storageFees + inboundFees + regulatoryFees + advertisingFees;
  
  // Refunds & Reimbursements
  const isRefund = transactionType === 'Refund' || productSales < 0;
  const refund = isRefund ? Math.abs(productSales) : 0;
  const reimbursementLost = getNumeric('reimbursementLost');
  const reimbursementDamaged = getNumeric('reimbursementDamaged');
  const reimbursementTotal = getNumeric('reimbursementTotal');
  const reimbursementOther = Math.max(0, reimbursementTotal - reimbursementLost - reimbursementDamaged);
  const rowReimbursements = reimbursementLost + reimbursementDamaged + reimbursementOther;
  
  // Total from file
  const rowTotal = getNumeric('total');
  
  // Update global metrics
  if (!isRefund) {
    metrics.grossSales += rowGrossSales;
    metrics.grossSalesUSD += rowGrossSales * exchangeRate;
    metrics.productSales += productSales;
    metrics.shippingCredits += shippingCredits;
    metrics.giftwrapCredits += giftwrapCredits;
  }
  metrics.promotionalRebates += promotionalRebates;
  metrics.taxCollected += taxCollected;
  
  metrics.totalFees += rowTotalFees;
  metrics.sellingFees += sellingFees;
  metrics.fbaFees += fbaFees;
  metrics.otherFees += otherFees;
  metrics.storageFees += storageFees;
  metrics.inboundFees += inboundFees;
  metrics.regulatoryFees += regulatoryFees;
  metrics.advertisingFees += advertisingFees;
  
  if (refund > 0) {
    metrics.totalRefunds += refund;
    metrics.refundCount++;
  }
  
  metrics.totalReimbursements += rowReimbursements;
  metrics.reimbursementLost += reimbursementLost;
  metrics.reimbursementDamaged += reimbursementDamaged;
  metrics.reimbursementOther += reimbursementOther;
  
  // Track calculated vs actual
  const rowCalculated = rowGrossSales - promotionalRebates - rowTotalFees - refund + rowReimbursements;
  metrics.calculatedTotal += rowCalculated;
  metrics.actualTotal += rowTotal;
  
  // Check for discrepancies
  if (Math.abs(rowCalculated - rowTotal) > 1 && rowTotal !== 0) {
    metrics.discrepancies.push({
      row: rowIndex,
      calculated: rowCalculated,
      actual: rowTotal,
      difference: rowCalculated - rowTotal,
      description: `Row ${rowIndex}: Expected ${rowCalculated.toFixed(2)}, got ${rowTotal.toFixed(2)}`
    });
  }
  
  // Update metadata
  metrics.currencies.add(currency);
  metrics.marketplaces.add(marketplace);
  if (sku) metrics.uniqueSKUs.add(sku);
  
  if (date) {
    if (!metrics.dateRange.min || date < metrics.dateRange.min) metrics.dateRange.min = date;
    if (!metrics.dateRange.max || date > metrics.dateRange.max) metrics.dateRange.max = date;
  }
  
  // Track transaction types
  metrics.byTransactionType.set(transactionType, (metrics.byTransactionType.get(transactionType) || 0) + 1);
  
  // Update country breakdown
  const country = marketplaceInfo.country;
  if (!metrics.byCountry.has(country)) {
    metrics.byCountry.set(country, {
      country,
      marketplace,
      currency,
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
  const countryData = metrics.byCountry.get(country)!;
  if (!isRefund) {
    countryData.grossSales += rowGrossSales;
    countryData.grossSalesUSD += rowGrossSales * exchangeRate;
  }
  countryData.fees += rowTotalFees;
  countryData.refunds += refund;
  countryData.reimbursements += rowReimbursements;
  countryData.transactionCount++;
  if (city) {
    countryData.topCities.set(city, (countryData.topCities.get(city) || 0) + rowGrossSales);
  }
  
  // Update month breakdown
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
    if (!isRefund) monthData.grossSales += rowGrossSales;
    monthData.fees += rowTotalFees;
    monthData.refunds += refund;
    monthData.transactionCount++;
  }
  
  // Update SKU breakdown
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
        cities: new Set()
      });
    }
    const skuData = metrics.bySKU.get(sku)!;
    if (!isRefund) {
      skuData.grossSales += rowGrossSales;
      skuData.quantity += quantity;
    }
    skuData.fees += rowTotalFees;
    skuData.refunds += refund;
    skuData.transactionCount++;
    skuData.countries.add(country);
    if (city) skuData.cities.add(city);
    // Update description if we get a better one
    if (description && description.length > skuData.description.length) {
      skuData.description = description;
    }
  }
  
  // Update fulfillment breakdown
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
  if (!isRefund) fulfillmentData.grossSales += rowGrossSales;
  fulfillmentData.fees += rowTotalFees;
  fulfillmentData.refunds += refund;
  fulfillmentData.transactionCount++;
  
  // Update city breakdown (demographic data)
  if (city) {
    const cityKey = `${city}|${region}|${country}`;
    if (!metrics.byCity.has(cityKey)) {
      metrics.byCity.set(cityKey, {
        city,
        region: region || '',
        postalCode: postalCode || '',
        country,
        grossSales: 0,
        transactionCount: 0,
        topSKUs: new Map()
      });
    }
    const cityData = metrics.byCity.get(cityKey)!;
    if (!isRefund) cityData.grossSales += rowGrossSales;
    cityData.transactionCount++;
    if (sku) {
      cityData.topSKUs.set(sku, (cityData.topSKUs.get(sku) || 0) + rowGrossSales);
    }
  }
  
  // Update region breakdown
  if (region) {
    const regionKey = `${region}|${country}`;
    if (!metrics.byRegion.has(regionKey)) {
      metrics.byRegion.set(regionKey, {
        region,
        country,
        grossSales: 0,
        transactionCount: 0,
        cities: new Set()
      });
    }
    const regionData = metrics.byRegion.get(regionKey)!;
    if (!isRefund) regionData.grossSales += rowGrossSales;
    regionData.transactionCount++;
    if (city) regionData.cities.add(city);
  }
  
  // Update fee type breakdown
  if (sellingFees > 0) metrics.byFeeType.set('Referral', (metrics.byFeeType.get('Referral') || 0) + sellingFees);
  if (fbaFees > 0) metrics.byFeeType.set('FBA', (metrics.byFeeType.get('FBA') || 0) + fbaFees);
  if (storageFees > 0) metrics.byFeeType.set('Storage', (metrics.byFeeType.get('Storage') || 0) + storageFees);
  if (inboundFees > 0) metrics.byFeeType.set('Inbound', (metrics.byFeeType.get('Inbound') || 0) + inboundFees);
  if (regulatoryFees > 0) metrics.byFeeType.set('Regulatory', (metrics.byFeeType.get('Regulatory') || 0) + regulatoryFees);
  if (advertisingFees > 0) metrics.byFeeType.set('Advertising', (metrics.byFeeType.get('Advertising') || 0) + advertisingFees);
  if (otherFees > 0) metrics.byFeeType.set('Other', (metrics.byFeeType.get('Other') || 0) + otherFees);
};

// Finalize metrics after all rows processed
const finalizeMetrics = (metrics: AggregatedMetrics): void => {
  // Calculate net sales and EBITDA
  metrics.netSales = metrics.grossSales - metrics.promotionalRebates - metrics.totalRefunds;
  const avgExchangeRate = metrics.grossSales > 0 ? metrics.grossSalesUSD / metrics.grossSales : 1;
  metrics.netSalesUSD = metrics.netSales * avgExchangeRate;
  metrics.ebitda = metrics.netSales - metrics.totalFees + metrics.totalReimbursements;
  
  // Calculate percentages
  metrics.feePercent = metrics.netSales > 0 ? (metrics.totalFees / metrics.netSales) * 100 : 0;
  metrics.refundRate = metrics.grossSales > 0 ? (metrics.totalRefunds / metrics.grossSales) * 100 : 0;
  
  // Finalize country metrics
  for (const [, countryData] of metrics.byCountry) {
    countryData.netSales = countryData.grossSales - countryData.refunds;
    countryData.ebitda = countryData.netSales - countryData.fees + countryData.reimbursements;
    countryData.feePercent = countryData.netSales > 0 ? (countryData.fees / countryData.netSales) * 100 : 0;
    countryData.refundRate = countryData.grossSales > 0 ? (countryData.refunds / countryData.grossSales) * 100 : 0;
  }
  
  // Finalize month metrics
  for (const [, monthData] of metrics.byMonth) {
    monthData.netSales = monthData.grossSales - monthData.refunds;
  }
  
  // Finalize SKU metrics
  for (const [, skuData] of metrics.bySKU) {
    skuData.feePercent = skuData.grossSales > 0 ? (skuData.fees / skuData.grossSales) * 100 : 0;
    skuData.refundRate = skuData.grossSales > 0 ? (skuData.refunds / skuData.grossSales) * 100 : 0;
  }
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
          countries: Array.from(metrics.marketplaces),
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
