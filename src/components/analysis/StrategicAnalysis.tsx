import { Target, AlertTriangle, Lightbulb, Link, ArrowRight } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';

interface StrategicAnalysisProps {
  analysis: AnalysisResult['strategicAnalysis'];
}

const StrategicAnalysis = ({ analysis }: StrategicAnalysisProps) => {
  return (
    <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="section-header">
        <div className="section-icon">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Análisis Estratégico</h2>
          <p className="text-sm text-muted-foreground">Visión de dirección</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-semibold">Riesgos Identificados</h3>
          </div>
          <ul className="space-y-2">
            {analysis.risks.map((risk, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground pl-2 border-l-2 border-destructive/30"
              >
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-success">
            <Lightbulb className="w-4 h-4" />
            <h3 className="font-semibold">Oportunidades</h3>
          </div>
          <ul className="space-y-2">
            {analysis.opportunities.map((opp, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground pl-2 border-l-2 border-success/30"
              >
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dependencies */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-warning">
            <Link className="w-4 h-4" />
            <h3 className="font-semibold">Dependencias Peligrosas</h3>
          </div>
          <ul className="space-y-2">
            {analysis.dependencies.map((dep, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground pl-2 border-l-2 border-warning/30"
              >
                <span>{dep}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <ArrowRight className="w-4 h-4" />
            <h3 className="font-semibold">Recomendaciones Estratégicas</h3>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground pl-2 border-l-2 border-primary/30"
              >
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default StrategicAnalysis;
