import { IDQAnalysisResult, IDQASINAnalysis, IDQActionPlan, IDQCatalogDiagnosis, IDQIssue } from '@/types/idq';

const generateMockASINAnalysis = (asin: string, score: number): IDQASINAnalysis => {
  const issues: IDQIssue[] = [];
  
  if (score < 90) {
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'title',
      issueType: 'title',
      severity: score < 60 ? 'critical' : 'high',
      description: 'Título demasiado corto, faltan palabras clave principales',
      recommendation: 'Añadir características clave del producto y palabras clave relevantes'
    });
  }
  
  if (score < 85) {
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'bullet_points',
      issueType: 'bullets',
      severity: 'high',
      description: 'Solo 3 bullet points de 5 posibles',
      recommendation: 'Completar los 5 bullet points con beneficios y características'
    });
  }
  
  if (score < 80) {
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'images',
      issueType: 'images',
      severity: 'critical',
      description: 'Solo 2 imágenes, falta imagen principal de calidad',
      recommendation: 'Añadir mínimo 6 imágenes: principal, lifestyle, infografía, dimensiones'
    });
  }
  
  if (score < 75) {
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'size_name',
      issueType: 'attributes',
      severity: 'critical',
      description: 'Atributo de tamaño faltante',
      recommendation: 'Rellenar atributo size_name con valor correcto'
    });
    
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'material',
      issueType: 'attributes',
      severity: 'high',
      description: 'Atributo de material faltante',
      recommendation: 'Especificar el material del producto'
    });
  }
  
  if (score < 70) {
    issues.push({
      asin,
      idqScore: score,
      attributeName: 'a_plus_content',
      issueType: 'description',
      severity: 'medium',
      description: 'Sin contenido A+ configurado',
      recommendation: 'Crear contenido A+ con módulos de marca e infografías'
    });
  }

  return {
    asin,
    idqScore: score,
    marketplace: ['ES', 'DE', 'FR', 'IT', 'UK'][Math.floor(Math.random() * 5)],
    issues,
    improvements: {
      title: score < 90 ? {
        current: `Producto ${asin} - Básico`,
        proposed: `{MARCA} ${asin.slice(-4)} - {TIPO_PRODUCTO} Premium | {MATERIAL} de Alta Calidad | {TAMAÑO} | Ideal para {USO_PRINCIPAL}`,
        placeholders: ['MARCA', 'TIPO_PRODUCTO', 'MATERIAL', 'TAMAÑO', 'USO_PRINCIPAL']
      } : undefined,
      bullets: score < 85 ? {
        current: ['Producto de calidad', 'Envío rápido', 'Garantía incluida'],
        proposed: [
          '✅ CALIDAD PREMIUM: Fabricado con {MATERIAL} de primera calidad para máxima durabilidad y rendimiento',
          '📦 CONTENIDO DEL PACK: Incluye {CONTENIDO_PACK} todo lo necesario para empezar',
          '📐 MEDIDAS PERFECTAS: {DIMENSIONES} - Diseño optimizado para {USO_ESPECÍFICO}',
          '🛡️ GARANTÍA TOTAL: {AÑOS_GARANTÍA} años de garantía del fabricante + soporte técnico',
          '🎁 REGALO IDEAL: Perfecto para {OCASIÓN} - Presentación premium lista para regalar'
        ],
        placeholders: ['MATERIAL', 'CONTENIDO_PACK', 'DIMENSIONES', 'USO_ESPECÍFICO', 'AÑOS_GARANTÍA', 'OCASIÓN']
      } : undefined,
      description: score < 70 ? {
        current: 'Descripción básica del producto.',
        proposed: `Descubre el {NOMBRE_PRODUCTO} de {MARCA}, la solución definitiva para {PROBLEMA_QUE_RESUELVE}. 

Diseñado pensando en {TIPO_USUARIO}, este producto combina {BENEFICIO_1} con {BENEFICIO_2} para ofrecerte una experiencia superior.

**Características destacadas:**
- {CARACTERÍSTICA_1}
- {CARACTERÍSTICA_2}
- {CARACTERÍSTICA_3}

**¿Por qué elegir {MARCA}?**
Con más de {AÑOS_EXPERIENCIA} años de experiencia en el sector, {MARCA} se ha convertido en sinónimo de calidad y confianza.`,
        aPlus: [
          { module: 'Historia de marca', content: 'Módulo con logo, historia y valores de {MARCA}' },
          { module: 'Beneficios clave', content: 'Infografía con los 4 beneficios principales del producto' },
          { module: 'Tabla comparativa', content: 'Comparación con otros modelos de la gama' },
          { module: 'Instrucciones', content: 'Guía visual de uso y mantenimiento' }
        ]
      } : undefined,
      mediaPlan: score < 80 ? {
        currentImages: 2,
        recommendedImages: 7,
        imageTypes: [
          'Imagen principal fondo blanco (obligatoria)',
          'Imagen lifestyle en uso',
          'Infografía con beneficios clave',
          'Imagen de dimensiones/medidas',
          'Detalle de materiales/texturas',
          'Imagen de packaging',
          'Imagen de accesorios incluidos'
        ],
        videoRecommendation: 'Vídeo 30-60s mostrando el producto en uso, destacando beneficios principales y diferenciadores vs competencia'
      } : undefined,
      attributes: score < 75 ? [
        { name: 'size_name', type: 'critical', suggestedAction: 'Rellenar con talla/tamaño exacto' },
        { name: 'color_name', type: 'critical', suggestedAction: 'Especificar color principal' },
        { name: 'material', type: 'critical', suggestedAction: 'Indicar material principal' },
        { name: 'target_gender', type: 'recommended', suggestedAction: 'Especificar género objetivo si aplica' },
        { name: 'age_range', type: 'recommended', suggestedAction: 'Indicar rango de edad si es relevante' }
      ] : undefined
    }
  };
};

export const generateMockIDQAnalysis = (fileName: string, data: Record<string, unknown>[]): IDQAnalysisResult => {
  // Generate mock ASIN analyses
  const asins = ['B0ABC12345', 'B0DEF67890', 'B0GHI11111', 'B0JKL22222', 'B0MNO33333', 
                 'B0PQR44444', 'B0STU55555', 'B0VWX66666', 'B0YZA77777', 'B0BCD88888'];
  
  const scores = [45, 58, 62, 71, 78, 82, 85, 89, 92, 95];
  
  const asinAnalyses: IDQASINAnalysis[] = asins.map((asin, i) => 
    generateMockASINAnalysis(asin, scores[i])
  );

  // Calculate catalog diagnosis
  const catalogDiagnosis: IDQCatalogDiagnosis = {
    totalAsins: asins.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    scoreDistribution: {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 80 && s < 90).length,
      fair: scores.filter(s => s >= 60 && s < 80).length,
      poor: scores.filter(s => s < 60).length,
      unknown: 0
    },
    topIssuesByCategory: [
      {
        category: 'Imágenes/Vídeo',
        count: 7,
        percentage: 70,
        examples: ['Faltan imágenes lifestyle', 'Sin vídeo de producto', 'Imagen principal baja resolución']
      },
      {
        category: 'Atributos estructurados',
        count: 6,
        percentage: 60,
        examples: ['size_name faltante', 'material no especificado', 'color_name vacío']
      },
      {
        category: 'Contenido (Título/Bullets)',
        count: 5,
        percentage: 50,
        examples: ['Títulos cortos', 'Bullets incompletos', 'Falta de keywords']
      },
      {
        category: 'Contenido A+',
        count: 4,
        percentage: 40,
        examples: ['Sin A+ configurado', 'A+ básico sin infografías']
      }
    ],
    marketplaceBreakdown: [
      { marketplace: 'ES', asinCount: 3, avgScore: 72, mainIssues: ['Bullets incompletos', 'Sin A+'] },
      { marketplace: 'DE', asinCount: 3, avgScore: 68, mainIssues: ['Traducción pobre', 'Atributos faltantes'] },
      { marketplace: 'FR', asinCount: 2, avgScore: 75, mainIssues: ['Imágenes insuficientes'] },
      { marketplace: 'IT', asinCount: 1, avgScore: 82, mainIssues: ['Descripción corta'] },
      { marketplace: 'UK', asinCount: 1, avgScore: 85, mainIssues: ['Sin vídeo'] }
    ],
    criticalFindings: [
      '🔴 70% de ASINs tienen menos de 5 imágenes - IMPACTO CRÍTICO en conversión',
      '🔴 60% carecen de atributos críticos (tamaño, material) - afecta discoverability',
      '🔴 40% sin contenido A+ - pérdida de espacio de conversión premium',
      '🟡 Score medio 75.7 - por debajo del umbral competitivo (80+)'
    ],
    quickWins: [
      '✅ Completar atributos size_name y color_name en 6 ASINs = +5 puntos IDQ estimado',
      '✅ Añadir 4 imágenes a los 7 ASINs con <5 fotos = mejora inmediata en conversión',
      '✅ Expandir bullets a 5 en todos los listings = mejor indexación keywords',
      '✅ Activar A+ básico en los 4 ASINs sin él = aumento CTR estimado 3-10%'
    ]
  };

  // Generate action plan
  const actionPlan: IDQActionPlan[] = [
    {
      priority: 'immediate',
      action: 'Completar atributos críticos faltantes (size_name, color_name, material)',
      impact: '+5-8 puntos IDQ, mejora indexación en búsquedas filtradas',
      affectedAsins: 6,
      category: 'Atributos'
    },
    {
      priority: 'immediate',
      action: 'Subir mínimo 6 imágenes por ASIN incluyendo lifestyle e infografía',
      impact: '+10-15% conversión, mejora posicionamiento orgánico',
      affectedAsins: 7,
      category: 'Imágenes'
    },
    {
      priority: 'short-term',
      action: 'Reescribir títulos con estructura keyword-optimized',
      impact: '+3-5 puntos IDQ, mejor CTR en resultados',
      affectedAsins: 5,
      category: 'Contenido'
    },
    {
      priority: 'short-term',
      action: 'Completar 5 bullet points con beneficios y keywords',
      impact: 'Mejor indexación, información completa para comprador',
      affectedAsins: 5,
      category: 'Contenido'
    },
    {
      priority: 'medium-term',
      action: 'Crear contenido A+ con módulos de marca y comparativas',
      impact: '+5-10% conversión, diferenciación de competencia',
      affectedAsins: 4,
      category: 'A+ Content'
    },
    {
      priority: 'medium-term',
      action: 'Producir vídeo de producto 30-60s para top ASINs',
      impact: 'Aumento engagement, reducción dudas pre-compra',
      affectedAsins: 10,
      category: 'Multimedia'
    }
  ];

  const executiveSummary = `## 🔴 DIAGNÓSTICO IDQ: CATÁLOGO EN ESTADO CRÍTICO

**Score medio: 75.7/100** — Por debajo del umbral competitivo. Amazon está penalizando la visibilidad de tus productos.

### Hallazgos principales:

**1. IMÁGENES: EL MAYOR AGUJERO**
El 70% de tus ASINs tienen menos de 5 imágenes. Esto no es solo un problema de IDQ, es una **hemorragia de conversión**. Cada imagen que falta es dinero que dejas en la mesa.

**2. ATRIBUTOS: INVISIBLES EN BÚSQUEDAS**
El 60% de productos carecen de atributos críticos. Sin size_name, color_name o material, tus productos NO aparecen cuando los compradores filtran. Literalmente no existes para esos clientes.

**3. CONTENIDO A+: OPORTUNIDAD DESPERDICIADA**
4 de cada 10 ASINs sin A+. Ese espacio premium de conversión lo está usando tu competencia. Tú no.

### Veredicto:
Este catálogo necesita una **intervención agresiva de contenido**. No es opcional, es supervivencia. Los ASINs con IDQ <70 están siendo enterrados por el algoritmo.

**Prioridad absoluta**: Atacar los 2 ASINs con score <60 esta semana. Son bombas de tiempo.`;

  return {
    fileName,
    analyzedAt: new Date(),
    reportType: 'idq',
    detectedColumns: {
      asin: 'asin',
      score: 'idq_score',
      attribute: 'attribute_name',
      issue: 'issue_type',
      severity: 'severity',
      recommendation: 'recommended_action',
      marketplace: 'marketplace'
    },
    catalogDiagnosis,
    asinAnalyses,
    actionPlan,
    executiveSummary,
    warnings: [
      'El informe no incluye datos de ventas - no se puede priorizar por impacto económico',
      'Faltan datos de categoría/browse_node para algunos ASINs',
      'Recomendación: solicitar informe de tráfico para correlacionar IDQ con performance'
    ]
  };
};
