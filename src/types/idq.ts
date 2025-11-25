export interface IDQIssue {
  asin: string;
  marketplace?: string;
  idqScore?: number;
  attributeName: string;
  issueType: 'title' | 'bullets' | 'description' | 'images' | 'attributes' | 'category' | 'compliance' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

export interface IDQASINAnalysis {
  asin: string;
  marketplace?: string;
  idqScore?: number;
  issues: IDQIssue[];
  improvements: {
    title?: {
      current?: string;
      proposed: string;
      placeholders?: string[];
    };
    bullets?: {
      current?: string[];
      proposed: string[];
      placeholders?: string[];
    };
    description?: {
      current?: string;
      proposed: string;
      aPlus?: {
        module: string;
        content: string;
      }[];
    };
    mediaPlan?: {
      currentImages: number;
      recommendedImages: number;
      imageTypes: string[];
      videoRecommendation?: string;
    };
    attributes?: {
      name: string;
      type: 'critical' | 'recommended';
      currentValue?: string;
      suggestedAction: string;
    }[];
    category?: {
      issue: string;
      recommendation: string;
    };
  };
}

export interface IDQCatalogDiagnosis {
  totalAsins: number;
  averageScore?: number;
  scoreDistribution: {
    excellent: number; // >= 90
    good: number; // 80-89
    fair: number; // 60-79
    poor: number; // < 60
    unknown: number; // no score
  };
  topIssuesByCategory: {
    category: string;
    count: number;
    percentage: number;
    examples: string[];
  }[];
  marketplaceBreakdown?: {
    marketplace: string;
    asinCount: number;
    avgScore?: number;
    mainIssues: string[];
  }[];
  criticalFindings: string[];
  quickWins: string[];
}

export interface IDQActionPlan {
  priority: 'immediate' | 'short-term' | 'medium-term';
  action: string;
  impact: string;
  affectedAsins: number;
  category: string;
}

export interface IDQAnalysisResult {
  fileName: string;
  analyzedAt: Date;
  reportType: 'idq';
  
  // Detected columns
  detectedColumns: {
    asin: string;
    score?: string;
    attribute?: string;
    issue?: string;
    severity?: string;
    recommendation?: string;
    marketplace?: string;
  };
  
  // Global diagnosis
  catalogDiagnosis: IDQCatalogDiagnosis;
  
  // ASIN-level analysis
  asinAnalyses: IDQASINAnalysis[];
  
  // Prioritized action plan
  actionPlan: IDQActionPlan[];
  
  // Executive summary
  executiveSummary: string;
  
  // Missing data warnings
  warnings: string[];
}

export interface IDQFileUploadState {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}
