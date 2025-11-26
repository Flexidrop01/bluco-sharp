import * as XLSX from 'xlsx';

/**
 * IDQ Optimizer Parser
 * Parsea archivos de vigilancia de Amazon y analiza la calidad de los listings
 */

// Criterios IDQ de Amazon para un listing perfecto
export interface IDQCriteria {
  titleLength: { min: 150; max: 200; ideal: 180 };
  bulletPoints: { required: 5 };
  images: { min: 7 };
  videos: { min: 1 };
  reviews: { min: 30 };
  rating: { min: 4.0 };
  hasAPlus: boolean;
  hasBSR: boolean;
}

export const IDQ_CRITERIA: IDQCriteria = {
  titleLength: { min: 150, max: 200, ideal: 180 },
  bulletPoints: { required: 5 },
  images: { min: 7 },
  videos: { min: 1 },
  reviews: { min: 30 },
  rating: { min: 4.0 },
  hasAPlus: true,
  hasBSR: true
};

export interface ProductIDQAnalysis {
  asin: string;
  ean?: string;
  title: string;
  country: string;
  amazonUrl?: string;
  imageUrl?: string;
  
  // Métricas de calidad
  metrics: {
    titleLength: number;
    bulletPointsCount: number;
    imagesCount: number;
    videosCount: number;
    reviewsCount: number;
    rating: number;
    hasAPlus: boolean;
    hasBSR: boolean;
    buyBoxOwner: string;
    bsr: number | null;
    bsrCategory: string;
  };
  
  // Puntuaciones
  scores: {
    title: number;        // 0-100
    bulletPoints: number; // 0-100
    images: number;       // 0-100
    videos: number;       // 0-100
    reviews: number;      // 0-100
    rating: number;       // 0-100
    aPlus: number;        // 0-100
    overall: number;      // 0-100
  };
  
  // Ventas para priorización
  sales: number;
  salesRank: number;
  
  // Problemas detectados
  issues: IDQIssue[];
  
  // Prioridad (basada en ventas e issues)
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface IDQIssue {
  type: 'title' | 'bulletPoints' | 'images' | 'videos' | 'reviews' | 'rating' | 'aPlus' | 'bsr' | 'buyBox';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
  impact: string;
}

export interface IDQOptimizerResult {
  analyzedAt: Date;
  totalProducts: number;
  averageScore: number;
  
  // Resumen por criterio
  summary: {
    titleIssues: number;
    bulletPointsIssues: number;
    imageIssues: number;
    videoIssues: number;
    reviewIssues: number;
    ratingIssues: number;
    aPlusIssues: number;
  };
  
  // Productos analizados
  products: ProductIDQAnalysis[];
  
  // Productos priorizados por acción
  actionPlan: {
    critical: ProductIDQAnalysis[];
    high: ProductIDQAnalysis[];
    medium: ProductIDQAnalysis[];
    low: ProductIDQAnalysis[];
  };
}

// Mapeo de columnas del archivo de vigilancia
const COLUMN_MAPPINGS: Record<string, string[]> = {
  asin: ['asin', 'ASIN', 'asin padre'],
  title: ['título', 'title', 'Título', 'nombre'],
  country: ['país', 'country', 'PAÍS', 'marketplace'],
  titleLength: ['caracteres título', 'caracteres titulo', 'title length', 'Caracteres Título'],
  bulletPoints: ['conteo bullet points', 'bullet points', 'Conteo Bullet Points'],
  hasBSR: ['tiene bsr', 'has bsr', 'Tiene BSR'],
  sales: ['ventas €', 'ventas', 'sales', 'Ventas €'],
  images: ['imagen', 'images', 'Imagen'],
  imageCount: ['recuento de imágenes', 'image count', 'Recuento de imágenes'],
  bsr: ['clasificación de ventas: actual', 'bsr', 'sales rank', 'Clasificación de Ventas: Actual'],
  bsrCategory: ['clasificación de ventas: subcategoría', 'Clasificación de Ventas: Subcategoría Clasificación de Ventas'],
  rating: ['opiniones: valoraciones', 'rating', 'valoraciones', 'Opiniones: Valoraciones'],
  reviewCount: ['opiniones: cantidad de valoraciones', 'review count', 'Opiniones: Cantidad de valoraciones'],
  buyBox: ['vendedor caja de compra', 'buy box', 'Vendedor Caja de compra (Buy Box)'],
  amazonUrl: ['url: amazon', 'amazon url', 'URL: Amazon'],
  videoCount: ['videos: cantidad de videos', 'video count', 'Videos: Cantidad de Videos'],
  hasMainVideo: ['videos: tiene video principal', 'has main video', 'Videos: Tiene video principal'],
  hasAPlus: ['contenido a+: tiene contenido a+', 'has a+', 'Contenido A+: Tiene contenido A+'],
  ean: ['ean', 'EAN', 'upc', 'UPC', 'gtin', 'GTIN']
};

// Encontrar columna en headers
const findColumn = (headers: string[], key: string): number => {
  const patterns = COLUMN_MAPPINGS[key] || [key];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase().trim() || '';
    for (const pattern of patterns) {
      if (header === pattern.toLowerCase() || header.includes(pattern.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
};

// Parsear valor numérico
const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[€$,\s]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Parsear boolean
const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return str === 'yes' || str === 'sí' || str === 'si' || str === 'true' || str === '1';
};

// Extraer conteo de imágenes de una string con URLs
const countImages = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value);
  // Contar URLs de imágenes separadas por ; o ,
  const urls = str.split(/[;,]/).filter(url => url.includes('http') || url.includes('amazon'));
  return urls.length || 0;
};

// Extraer BSR de string formateado
const parseBSR = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (!value) return null;
  const str = String(value);
  // Formato: "# 1,897 | Top 4% | Cuscini standard"
  const match = str.match(/#?\s*([\d,\.]+)/);
  if (match) {
    return parseNumber(match[1]);
  }
  return null;
};

// Calcular score para título
const calculateTitleScore = (length: number): number => {
  if (length >= 150 && length <= 200) return 100;
  if (length >= 120 && length < 150) return 70;
  if (length > 200 && length <= 250) return 60;
  if (length >= 80 && length < 120) return 40;
  return 20;
};

// Calcular score para bullet points
const calculateBulletScore = (count: number): number => {
  if (count >= 5) return 100;
  return (count / 5) * 100;
};

// Calcular score para imágenes
const calculateImageScore = (count: number): number => {
  if (count >= 7) return 100;
  if (count >= 5) return 70;
  if (count >= 3) return 40;
  return 20;
};

// Calcular score para videos
const calculateVideoScore = (count: number): number => {
  if (count >= 2) return 100;
  if (count >= 1) return 70;
  return 0;
};

// Calcular score para reviews
const calculateReviewScore = (count: number, rating: number): number => {
  let score = 0;
  // Por cantidad
  if (count >= 100) score += 50;
  else if (count >= 30) score += 35;
  else if (count >= 10) score += 20;
  else score += (count / 30) * 20;
  
  // Por rating
  if (rating >= 4.5) score += 50;
  else if (rating >= 4.0) score += 35;
  else if (rating >= 3.5) score += 20;
  else score += (rating / 4.5) * 20;
  
  return Math.min(score, 100);
};

// Detectar issues del producto
const detectIssues = (product: ProductIDQAnalysis): IDQIssue[] => {
  const issues: IDQIssue[] = [];
  const m = product.metrics;
  
  // Título
  if (m.titleLength < 100) {
    issues.push({
      type: 'title',
      severity: 'critical',
      message: `Título muy corto (${m.titleLength} caracteres)`,
      recommendation: 'Amplía el título a 150-200 caracteres con keywords relevantes',
      impact: 'Afecta visibilidad y CTR'
    });
  } else if (m.titleLength < 150) {
    issues.push({
      type: 'title',
      severity: 'warning',
      message: `Título corto (${m.titleLength} caracteres)`,
      recommendation: 'Añade keywords adicionales para alcanzar 150-200 caracteres',
      impact: 'Puede mejorar posicionamiento'
    });
  } else if (m.titleLength > 200) {
    issues.push({
      type: 'title',
      severity: 'info',
      message: `Título largo (${m.titleLength} caracteres)`,
      recommendation: 'Considera acortar a 200 caracteres máximo',
      impact: 'Puede truncarse en móviles'
    });
  }
  
  // Bullet Points
  if (m.bulletPointsCount < 5) {
    issues.push({
      type: 'bulletPoints',
      severity: m.bulletPointsCount < 3 ? 'critical' : 'warning',
      message: `Solo ${m.bulletPointsCount} bullet points de 5 recomendados`,
      recommendation: 'Añade bullet points con beneficios y características clave',
      impact: 'Reduce conversión y SEO'
    });
  }
  
  // Imágenes
  if (m.imagesCount < 7) {
    issues.push({
      type: 'images',
      severity: m.imagesCount < 3 ? 'critical' : 'warning',
      message: `Solo ${m.imagesCount} imágenes de 7+ recomendadas`,
      recommendation: 'Añade imágenes de lifestyle, infográficas y dimensiones',
      impact: 'Las imágenes aumentan conversión un 40%'
    });
  }
  
  // Videos
  if (m.videosCount < 1) {
    issues.push({
      type: 'videos',
      severity: 'warning',
      message: 'Sin vídeo de producto',
      recommendation: 'Añade al menos un vídeo demostrativo del producto',
      impact: 'Los vídeos aumentan conversión un 20%'
    });
  }
  
  // A+ Content
  if (!m.hasAPlus) {
    issues.push({
      type: 'aPlus',
      severity: 'warning',
      message: 'Sin contenido A+',
      recommendation: 'Crea contenido A+ con imágenes comparativas y storytelling',
      impact: 'A+ puede aumentar ventas un 5-10%'
    });
  }
  
  // Reviews
  if (m.reviewsCount < 30) {
    issues.push({
      type: 'reviews',
      severity: m.reviewsCount < 10 ? 'critical' : 'warning',
      message: `Solo ${m.reviewsCount} reseñas`,
      recommendation: 'Implementa estrategia de solicitud de reseñas (Vine, emails)',
      impact: 'Productos con +30 reseñas convierten mejor'
    });
  }
  
  // Rating
  if (m.rating < 4.0 && m.reviewsCount > 5) {
    issues.push({
      type: 'rating',
      severity: m.rating < 3.5 ? 'critical' : 'warning',
      message: `Valoración baja (${m.rating.toFixed(1)} estrellas)`,
      recommendation: 'Analiza reseñas negativas y mejora producto/servicio',
      impact: 'Rating bajo reduce visibilidad y conversión'
    });
  }
  
  // Buy Box
  if (m.buyBoxOwner && !m.buyBoxOwner.toLowerCase().includes('pikolin') && 
      !m.buyBoxOwner.toLowerCase().includes('oficial')) {
    issues.push({
      type: 'buyBox',
      severity: 'critical',
      message: `Buy Box perdida: ${m.buyBoxOwner}`,
      recommendation: 'Revisa precio y stock para recuperar Buy Box',
      impact: 'Sin Buy Box pierdes el 80% de las ventas'
    });
  }
  
  return issues;
};

// Calcular prioridad basada en ventas e issues
const calculatePriority = (product: ProductIDQAnalysis): 'critical' | 'high' | 'medium' | 'low' => {
  const criticalIssues = product.issues.filter(i => i.severity === 'critical').length;
  const warningIssues = product.issues.filter(i => i.severity === 'warning').length;
  const hasSales = product.sales > 0;
  const hasHighSales = product.sales > 100;
  
  // Si tiene ventas altas y problemas críticos = crítico
  if (hasHighSales && criticalIssues > 0) return 'critical';
  
  // Si tiene ventas y problemas críticos = alto
  if (hasSales && criticalIssues > 0) return 'high';
  
  // Si tiene ventas y varios warnings = alto
  if (hasSales && warningIssues >= 3) return 'high';
  
  // Si tiene problemas críticos sin ventas = medio
  if (criticalIssues > 0) return 'medium';
  
  // Si tiene warnings = medio o bajo
  if (warningIssues > 0) return hasSales ? 'medium' : 'low';
  
  return 'low';
};

// Procesar fila de datos
const processRow = (row: unknown[], headers: string[], colIndices: Record<string, number>): ProductIDQAnalysis | null => {
  const getValue = (key: string): unknown => {
    const idx = colIndices[key];
    return idx >= 0 ? row[idx] : undefined;
  };
  
  const asin = String(getValue('asin') || '').trim();
  if (!asin || asin.length < 5) return null;
  
  const title = String(getValue('title') || '').trim();
  const titleLength = parseNumber(getValue('titleLength')) || title.length;
  const bulletPointsCount = parseNumber(getValue('bulletPoints'));
  const imagesRaw = getValue('images');
  const imageCountRaw = getValue('imageCount');
  const imagesCount = parseNumber(imageCountRaw) || countImages(imagesRaw);
  const videoCount = parseNumber(getValue('videoCount'));
  const hasMainVideo = parseBoolean(getValue('hasMainVideo'));
  const videosCount = videoCount || (hasMainVideo ? 1 : 0);
  const rating = parseNumber(getValue('rating'));
  const reviewsCount = parseNumber(getValue('reviewCount'));
  const hasAPlus = parseBoolean(getValue('hasAPlus'));
  const hasBSR = parseBoolean(getValue('hasBSR'));
  const bsr = parseBSR(getValue('bsr'));
  const bsrCategory = String(getValue('bsrCategory') || '').trim();
  const buyBoxOwner = String(getValue('buyBox') || '').trim();
  const sales = parseNumber(getValue('sales'));
  const country = String(getValue('country') || 'ES').trim();
  const amazonUrl = String(getValue('amazonUrl') || '').trim();
  const ean = String(getValue('ean') || '').trim();
  
  // Extraer primera URL de imagen
  const imageUrl = typeof imagesRaw === 'string' 
    ? imagesRaw.split(/[;,\[\]]/)[0].replace(/[<>()]/g, '').trim()
    : '';
  
  // Calcular scores
  const scores = {
    title: calculateTitleScore(titleLength),
    bulletPoints: calculateBulletScore(bulletPointsCount),
    images: calculateImageScore(imagesCount),
    videos: calculateVideoScore(videosCount),
    reviews: calculateReviewScore(reviewsCount, rating),
    rating: rating >= 4.0 ? 100 : rating >= 3.5 ? 70 : rating >= 3.0 ? 40 : 20,
    aPlus: hasAPlus ? 100 : 0,
    overall: 0
  };
  
  // Score general ponderado
  scores.overall = Math.round(
    scores.title * 0.15 +
    scores.bulletPoints * 0.15 +
    scores.images * 0.20 +
    scores.videos * 0.10 +
    scores.reviews * 0.15 +
    scores.rating * 0.10 +
    scores.aPlus * 0.15
  );
  
  const product: ProductIDQAnalysis = {
    asin,
    ean: ean || undefined,
    title,
    country,
    amazonUrl: amazonUrl.startsWith('http') ? amazonUrl : undefined,
    imageUrl: imageUrl.startsWith('http') ? imageUrl : undefined,
    metrics: {
      titleLength,
      bulletPointsCount,
      imagesCount,
      videosCount,
      reviewsCount,
      rating,
      hasAPlus,
      hasBSR,
      buyBoxOwner,
      bsr,
      bsrCategory
    },
    scores,
    sales,
    salesRank: 0, // Se calcula después
    issues: [],
    priority: 'low'
  };
  
  // Detectar issues
  product.issues = detectIssues(product);
  
  // Calcular prioridad
  product.priority = calculatePriority(product);
  
  return product;
};

// Función principal de parsing
export const parseIDQVigilanceFile = async (file: File): Promise<IDQOptimizerResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Buscar hoja con datos
        let targetSheet = workbook.SheetNames[0];
        let maxRows = 0;
        
        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          const rowCount = range.e.r - range.s.r + 1;
          if (rowCount > maxRows) {
            maxRows = rowCount;
            targetSheet = sheetName;
          }
        }
        
        const worksheet = workbook.Sheets[targetSheet];
        const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        // Encontrar headers
        let headers: string[] = [];
        let headerRow = 0;
        
        for (let i = 0; i < Math.min(10, allData.length); i++) {
          const row = allData[i] as string[];
          const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
          if (rowStr.includes('asin') || rowStr.includes('título') || rowStr.includes('title')) {
            headers = row.map(c => String(c || ''));
            headerRow = i;
            break;
          }
        }
        
        if (headers.length === 0) {
          throw new Error('No se encontraron headers válidos en el archivo');
        }
        
        // Construir índices de columnas
        const colIndices: Record<string, number> = {};
        for (const key of Object.keys(COLUMN_MAPPINGS)) {
          colIndices[key] = findColumn(headers, key);
        }
        
        // Procesar filas
        const products: ProductIDQAnalysis[] = [];
        
        for (let i = headerRow + 1; i < allData.length; i++) {
          const row = allData[i] as unknown[];
          const product = processRow(row, headers, colIndices);
          if (product) {
            products.push(product);
          }
        }
        
        // Calcular ranking de ventas
        const sortedBySales = [...products].sort((a, b) => b.sales - a.sales);
        sortedBySales.forEach((p, i) => {
          const original = products.find(op => op.asin === p.asin);
          if (original) original.salesRank = i + 1;
        });
        
        // Calcular resumen
        const summary = {
          titleIssues: products.filter(p => p.issues.some(i => i.type === 'title')).length,
          bulletPointsIssues: products.filter(p => p.issues.some(i => i.type === 'bulletPoints')).length,
          imageIssues: products.filter(p => p.issues.some(i => i.type === 'images')).length,
          videoIssues: products.filter(p => p.issues.some(i => i.type === 'videos')).length,
          reviewIssues: products.filter(p => p.issues.some(i => i.type === 'reviews')).length,
          ratingIssues: products.filter(p => p.issues.some(i => i.type === 'rating')).length,
          aPlusIssues: products.filter(p => p.issues.some(i => i.type === 'aPlus')).length
        };
        
        // Agrupar por prioridad
        const actionPlan = {
          critical: products.filter(p => p.priority === 'critical').sort((a, b) => b.sales - a.sales),
          high: products.filter(p => p.priority === 'high').sort((a, b) => b.sales - a.sales),
          medium: products.filter(p => p.priority === 'medium').sort((a, b) => b.sales - a.sales),
          low: products.filter(p => p.priority === 'low').sort((a, b) => b.sales - a.sales)
        };
        
        const result: IDQOptimizerResult = {
          analyzedAt: new Date(),
          totalProducts: products.length,
          averageScore: products.length > 0 
            ? Math.round(products.reduce((sum, p) => sum + p.scores.overall, 0) / products.length)
            : 0,
          summary,
          products,
          actionPlan
        };
        
        resolve(result);
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

// Filtrar productos por ASINs/EANs
export const filterProductsByIdentifiers = (
  result: IDQOptimizerResult,
  identifiers: string[]
): IDQOptimizerResult => {
  const normalizedIds = identifiers.map(id => id.trim().toUpperCase());
  
  const filteredProducts = result.products.filter(p => 
    normalizedIds.includes(p.asin.toUpperCase()) ||
    (p.ean && normalizedIds.includes(p.ean.toUpperCase()))
  );
  
  return {
    ...result,
    totalProducts: filteredProducts.length,
    averageScore: filteredProducts.length > 0 
      ? Math.round(filteredProducts.reduce((sum, p) => sum + p.scores.overall, 0) / filteredProducts.length)
      : 0,
    products: filteredProducts,
    actionPlan: {
      critical: filteredProducts.filter(p => p.priority === 'critical'),
      high: filteredProducts.filter(p => p.priority === 'high'),
      medium: filteredProducts.filter(p => p.priority === 'medium'),
      low: filteredProducts.filter(p => p.priority === 'low')
    }
  };
};
