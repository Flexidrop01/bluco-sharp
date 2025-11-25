import { AnalysisResult } from '@/types/analysis';
import ExecutiveSummary from './analysis/ExecutiveSummary';
import NumericalDiagnosis from './analysis/NumericalDiagnosis';
import StrategicAnalysis from './analysis/StrategicAnalysis';
import OperationalAnalysis from './analysis/OperationalAnalysis';
import ActionPlan from './analysis/ActionPlan';
import MissingData from './analysis/MissingData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  onReset: () => void;
}

const AnalysisDashboard = ({ analysis, onReset }: AnalysisDashboardProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onReset}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{analysis.fileName}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analizado: {formatDate(analysis.analyzedAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="hero" size="sm" onClick={onReset}>
            Nuevo análisis
          </Button>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <ExecutiveSummary 
        summary={analysis.executiveSummary} 
        reportType={analysis.reportType}
      />

      {/* Section 2: Numerical Diagnosis */}
      <NumericalDiagnosis 
        metrics={analysis.metrics}
        skuPerformance={analysis.skuPerformance}
        marketplaceBreakdown={analysis.marketplaceBreakdown}
      />

      {/* Section 3: Strategic Analysis */}
      <StrategicAnalysis analysis={analysis.strategicAnalysis} />

      {/* Section 4: Operational Analysis */}
      <OperationalAnalysis analysis={analysis.operationalAnalysis} />

      {/* Section 5: Action Plan */}
      <ActionPlan actions={analysis.actionPlan} />

      {/* Section 6: Missing Data */}
      <MissingData missingData={analysis.missingData} />
    </div>
  );
};

export default AnalysisDashboard;
