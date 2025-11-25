import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  COLUMN_MAPPINGS, 
  MARKETPLACE_PATTERNS, 
  REPORT_TYPE_PATTERNS,
  FULFILLMENT_PATTERNS,
  EXCHANGE_RATES_TO_USD 
} from './columnMappings';
import { 
  FileInfo, 
  NormalizedTransaction, 
  ReportType, 
  FulfillmentModel 
} from '@/types/multiTransaction';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Find matching column name
const findColumn = (headers: string[], patterns: string[]): string | null => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const index = normalizedHeaders.findIndex(h => 
      h === pattern.toLowerCase() || h.includes(pattern.toLowerCase())
    );
    if (index !== -1) return headers[index];
  }
  return null;
};

// Detect marketplace from various sources
const detectMarketplace = (row: Record<string, unknown>, headers: string[], fileName: string): {
  marketplace: string;
  country: string;
  currency: string;
  region: string;
} => {
  // Try to find marketplace column
  const marketplaceCol = findColumn(headers, COLUMN_MAPPINGS.marketplace);
  if (marketplaceCol && row[marketplaceCol]) {
    const value = String(row[marketplaceCol]).toLowerCase();
    for (const [domain, info] of Object.entries(MARKETPLACE_PATTERNS)) {
      if (value.includes(domain) || value.includes(info.country.toLowerCase())) {
        return { marketplace: domain, ...info };
      }
    }
  }

  // Try currency column
  const currencyCol = findColumn(headers, COLUMN_MAPPINGS.currency);
  if (currencyCol && row[currencyCol]) {
    const currency = String(row[currencyCol]).toUpperCase();
    for (const [domain, info] of Object.entries(MARKETPLACE_PATTERNS)) {
      if (info.currency === currency) {
        return { marketplace: domain, ...info };
      }
    }
  }

  // Try to infer from filename
  const fileNameLower = fileName.toLowerCase();
  for (const [domain, info] of Object.entries(MARKETPLACE_PATTERNS)) {
    if (fileNameLower.includes(info.country.toLowerCase()) || 
        fileNameLower.includes(domain.replace('amazon.', ''))) {
      return { marketplace: domain, ...info };
    }
  }

  // Default to USA
  return { marketplace: 'amazon.com', country: 'USA', currency: 'USD', region: 'NA' };
};

// Detect report type
const detectReportType = (headers: string[], fileName: string): ReportType => {
  const combinedText = [...headers, fileName].join(' ').toLowerCase();
  
  for (const [type, patterns] of Object.entries(REPORT_TYPE_PATTERNS)) {
    if (patterns.some(p => combinedText.includes(p))) {
      return type as ReportType;
    }
  }
  
  return 'transaction';
};

// Detect fulfillment model
const detectFulfillmentModel = (row: Record<string, unknown>, headers: string[]): FulfillmentModel => {
  const combinedText = Object.values(row).join(' ').toLowerCase();
  
  if (FULFILLMENT_PATTERNS.awd.some(p => combinedText.includes(p))) return 'AWD';
  if (FULFILLMENT_PATTERNS.fba.some(p => combinedText.includes(p))) return 'FBA';
  if (FULFILLMENT_PATTERNS.fbm.some(p => combinedText.includes(p))) return 'FBM';
  
  // Check for FBA-specific fees
  const fbaFeeCol = findColumn(headers, COLUMN_MAPPINGS.fbaFee);
  if (fbaFeeCol && row[fbaFeeCol] && Number(row[fbaFeeCol]) !== 0) return 'FBA';
  
  return 'Unknown';
};

// Categorize transaction
const categorizeTransaction = (row: Record<string, unknown>, headers: string[]): {
  category: 'revenue' | 'refund' | 'fee' | 'reimbursement' | 'other';
  subcategory: string;
} => {
  const typeCol = findColumn(headers, COLUMN_MAPPINGS.transactionType);
  const amountTypeCol = findColumn(headers, COLUMN_MAPPINGS.amountType);
  const descCol = findColumn(headers, COLUMN_MAPPINGS.description);
  
  const typeValue = typeCol ? String(row[typeCol] || '').toLowerCase() : '';
  const amountTypeValue = amountTypeCol ? String(row[amountTypeCol] || '').toLowerCase() : '';
  const descValue = descCol ? String(row[descCol] || '').toLowerCase() : '';
  
  const combined = `${typeValue} ${amountTypeValue} ${descValue}`;
  
  // Reimbursements
  if (combined.includes('reimbursement') || combined.includes('compensation')) {
    if (combined.includes('lost')) return { category: 'reimbursement', subcategory: 'lost' };
    if (combined.includes('damaged')) return { category: 'reimbursement', subcategory: 'damaged' };
    if (combined.includes('customer')) return { category: 'reimbursement', subcategory: 'customer_service' };
    return { category: 'reimbursement', subcategory: 'other' };
  }
  
  // Refunds
  if (combined.includes('refund') || combined.includes('return') || combined.includes('chargeback')) {
    return { category: 'refund', subcategory: 'refund' };
  }
  
  // Fees
  if (combined.includes('fee') || combined.includes('commission')) {
    if (combined.includes('referral') || combined.includes('selling')) return { category: 'fee', subcategory: 'referral' };
    if (combined.includes('fba') || combined.includes('fulfillment')) return { category: 'fee', subcategory: 'fba' };
    if (combined.includes('storage')) return { category: 'fee', subcategory: 'storage' };
    if (combined.includes('advertising') || combined.includes('ad ')) return { category: 'fee', subcategory: 'advertising' };
    if (combined.includes('inbound') || combined.includes('placement')) return { category: 'fee', subcategory: 'inbound_placement' };
    if (combined.includes('regulatory')) return { category: 'fee', subcategory: 'regulatory' };
    if (combined.includes('subscription')) return { category: 'fee', subcategory: 'subscription' };
    if (combined.includes('removal') || combined.includes('disposal')) return { category: 'fee', subcategory: 'removal' };
    if (combined.includes('liquidation')) return { category: 'fee', subcategory: 'liquidation' };
    return { category: 'fee', subcategory: 'other' };
  }
  
  // Revenue
  if (combined.includes('order') || combined.includes('shipment') || combined.includes('sale') ||
      combined.includes('product') || combined.includes('principal')) {
    return { category: 'revenue', subcategory: 'sales' };
  }
  
  return { category: 'other', subcategory: 'unknown' };
};

// Parse amount value
const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

// Convert to USD
const convertToUSD = (amount: number, currency: string): number => {
  const rate = EXCHANGE_RATES_TO_USD[currency] || 1;
  return amount * rate;
};

// Parse date
const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const dateStr = String(value);
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

// Normalize a single row
const normalizeRow = (
  row: Record<string, unknown>,
  headers: string[],
  fileId: string,
  fileName: string
): NormalizedTransaction => {
  const marketplaceInfo = detectMarketplace(row, headers, fileName);
  const { category, subcategory } = categorizeTransaction(row, headers);
  
  // Get amount
  const amountCol = findColumn(headers, COLUMN_MAPPINGS.amount);
  const amount = amountCol ? parseAmount(row[amountCol]) : 0;
  
  // Get identifiers
  const orderIdCol = findColumn(headers, COLUMN_MAPPINGS.orderId);
  const skuCol = findColumn(headers, COLUMN_MAPPINGS.sku);
  const asinCol = findColumn(headers, COLUMN_MAPPINGS.asin);
  const dateCol = findColumn(headers, COLUMN_MAPPINGS.date);
  const typeCol = findColumn(headers, COLUMN_MAPPINGS.transactionType);
  const descCol = findColumn(headers, COLUMN_MAPPINGS.description);
  
  return {
    fileId,
    orderId: orderIdCol ? String(row[orderIdCol] || '') : undefined,
    sku: skuCol ? String(row[skuCol] || '') : undefined,
    asin: asinCol ? String(row[asinCol] || '') : undefined,
    marketplace: marketplaceInfo.marketplace,
    country: marketplaceInfo.country,
    currency: marketplaceInfo.currency,
    date: dateCol ? parseDate(row[dateCol]) : undefined,
    transactionType: typeCol ? String(row[typeCol] || '') : 'unknown',
    category,
    subcategory,
    fulfillmentModel: detectFulfillmentModel(row, headers),
    amount,
    amountUSD: convertToUSD(amount, marketplaceInfo.currency),
    description: descCol ? String(row[descCol] || '') : undefined,
    rawData: row
  };
};

// Parse CSV file
const parseCSV = (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve({ headers: results.meta.fields || [], data: results.data as Record<string, unknown>[] });
      },
      error: reject
    });
  });
};

// Parse Excel file
const parseExcel = async (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Empty file'));
          return;
        }
        
        const headers = (jsonData[0] as string[]).map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown[])[index];
          });
          return obj;
        });
        
        resolve({ headers, data: rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

// Main function to parse multiple files
export const parseMultipleFiles = async (files: File[]): Promise<{
  filesInfo: FileInfo[];
  transactions: NormalizedTransaction[];
}> => {
  const filesInfo: FileInfo[] = [];
  const transactions: NormalizedTransaction[] = [];
  
  for (const file of files) {
    const fileId = generateId();
    const fileName = file.name.toLowerCase();
    
    let result: { headers: string[]; data: Record<string, unknown>[] };
    
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      result = await parseCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      result = await parseExcel(file);
    } else {
      continue; // Skip unsupported files
    }
    
    const { headers, data } = result;
    
    // Detect marketplace from first data row
    const sampleRow = data[0] || {};
    const marketplaceInfo = detectMarketplace(sampleRow, headers, file.name);
    const reportType = detectReportType(headers, file.name);
    
    // Extract date range
    const dateCol = findColumn(headers, COLUMN_MAPPINGS.date);
    let dateRange: { start: Date; end: Date } | undefined;
    if (dateCol) {
      const dates = data
        .map(row => parseDate(row[dateCol]))
        .filter((d): d is Date => d !== undefined)
        .sort((a, b) => a.getTime() - b.getTime());
      if (dates.length > 0) {
        dateRange = { start: dates[0], end: dates[dates.length - 1] };
      }
    }
    
    // Create file info
    filesInfo.push({
      id: fileId,
      fileName: file.name,
      marketplace: marketplaceInfo.marketplace,
      country: marketplaceInfo.country,
      currency: marketplaceInfo.currency,
      region: marketplaceInfo.region,
      reportType,
      dateRange,
      rowCount: data.length,
      detectedColumns: headers
    });
    
    // Normalize all rows
    for (const row of data) {
      const normalized = normalizeRow(row, headers, fileId, file.name);
      transactions.push(normalized);
    }
  }
  
  return { filesInfo, transactions };
};
