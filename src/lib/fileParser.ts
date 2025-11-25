import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ReportType } from '@/types/analysis';

// Column patterns for detection
const SELLER_COLUMNS = [
  'product charges', 'item price', 'promotional rebates', 'referral fee',
  'fba fee', 'fulfillment fee', 'storage fee', 'closing fee', 'refund',
  'chargeback', 'order-id', 'sku', 'marketplace'
];

const VENDOR_COLUMNS = [
  'po units', 'po net receipts', 'net shipped cogs', 'shortages',
  'chargebacks', 'co-op', 'mdf', 'marketing funds', 'operational deductions',
  'freight allowances', 'damage allowance', 'defect allowance', 'bulk returns',
  'net receivables', 'asin', 'vendor code'
];

export const detectReportType = (headers: string[]): ReportType => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  const sellerMatches = SELLER_COLUMNS.filter(col => 
    normalizedHeaders.some(h => h.includes(col))
  ).length;
  
  const vendorMatches = VENDOR_COLUMNS.filter(col => 
    normalizedHeaders.some(h => h.includes(col))
  ).length;
  
  if (sellerMatches > vendorMatches && sellerMatches >= 2) {
    return 'seller';
  }
  if (vendorMatches > sellerMatches && vendorMatches >= 2) {
    return 'vendor';
  }
  return 'unknown';
};

export const parseCSV = (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({ headers, data: results.data as Record<string, unknown>[] });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const parseExcel = async (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          reject(new Error('El archivo está vacío'));
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
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseFile = async (file: File): Promise<{ 
  headers: string[]; 
  data: Record<string, unknown>[]; 
  reportType: ReportType 
}> => {
  const fileName = file.name.toLowerCase();
  
  let result: { headers: string[]; data: Record<string, unknown>[] };
  
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    result = await parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    result = await parseExcel(file);
  } else {
    throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
  }
  
  const reportType = detectReportType(result.headers);
  
  return { ...result, reportType };
};
