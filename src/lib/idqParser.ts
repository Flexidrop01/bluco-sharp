import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Column name patterns for IDQ reports
const COLUMN_PATTERNS = {
  asin: ['asin', 'asin_id', 'product_id', 'item_id', 'sku'],
  score: ['idq_score', 'item_data_quality_score', 'score', 'quality_score', 'data_quality'],
  attribute: ['attribute_name', 'field_name', 'data_field', 'attribute', 'field', 'issue_field'],
  issue: ['issue_type', 'issue_code', 'defect_type', 'problem_description', 'issue', 'problem', 'error_type'],
  severity: ['severity', 'priority', 'importance', 'level', 'criticality'],
  recommendation: ['recommended_action', 'recommendation', 'fix_tip', 'suggested_fix', 'action', 'solution'],
  marketplace: ['marketplace', 'country', 'locale', 'region', 'market', 'country_code'],
  category: ['category', 'browse_node', 'product_type', 'item_type']
};

export const detectIDQColumns = (headers: string[]): {
  asin: string | null;
  score: string | null;
  attribute: string | null;
  issue: string | null;
  severity: string | null;
  recommendation: string | null;
  marketplace: string | null;
  category: string | null;
} => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));
  
  const findColumn = (patterns: string[]): string | null => {
    for (const pattern of patterns) {
      const index = normalizedHeaders.findIndex(h => h.includes(pattern));
      if (index !== -1) {
        return headers[index];
      }
    }
    return null;
  };

  return {
    asin: findColumn(COLUMN_PATTERNS.asin),
    score: findColumn(COLUMN_PATTERNS.score),
    attribute: findColumn(COLUMN_PATTERNS.attribute),
    issue: findColumn(COLUMN_PATTERNS.issue),
    severity: findColumn(COLUMN_PATTERNS.severity),
    recommendation: findColumn(COLUMN_PATTERNS.recommendation),
    marketplace: findColumn(COLUMN_PATTERNS.marketplace),
    category: findColumn(COLUMN_PATTERNS.category)
  };
};

export const isIDQReport = (headers: string[]): boolean => {
  const detected = detectIDQColumns(headers);
  // Must have ASIN and at least one of: score, attribute, issue
  return detected.asin !== null && (
    detected.score !== null || 
    detected.attribute !== null || 
    detected.issue !== null
  );
};

export const parseIDQCSV = (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
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

export const parseIDQExcel = async (file: File): Promise<{ headers: string[]; data: Record<string, unknown>[] }> => {
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

export const parseIDQFile = async (file: File): Promise<{ 
  headers: string[]; 
  data: Record<string, unknown>[]; 
  detectedColumns: ReturnType<typeof detectIDQColumns>;
  isValid: boolean;
}> => {
  const fileName = file.name.toLowerCase();
  
  let result: { headers: string[]; data: Record<string, unknown>[] };
  
  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    result = await parseIDQCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    result = await parseIDQExcel(file);
  } else {
    throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
  }
  
  const detectedColumns = detectIDQColumns(result.headers);
  const isValid = isIDQReport(result.headers);
  
  return { ...result, detectedColumns, isValid };
};
