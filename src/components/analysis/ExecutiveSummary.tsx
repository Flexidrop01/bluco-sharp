import { Brain, Zap } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: string;
  reportType: 'seller' | 'vendor' | 'unknown';
}

const ExecutiveSummary = ({ summary, reportType }: ExecutiveSummaryProps) => {
  // Parse markdown-like formatting
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Bold text
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
      
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      return (
        <p 
          key={index} 
          className="mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <section className="glass-card p-6 animate-fade-in">
      <div className="section-header">
        <div className="section-icon">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Resumen Ejecutivo</h2>
          <p className="text-sm text-muted-foreground">Análisis CEO Brain — Sin filtros</p>
        </div>
        <div className="ml-auto">
          {reportType === 'seller' ? (
            <span className="badge-seller">Seller Central</span>
          ) : reportType === 'vendor' ? (
            <span className="badge-vendor">Vendor Central</span>
          ) : null}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
        <div className="pl-4 text-muted-foreground">
          {formatText(summary)}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-4 h-4 text-primary" />
        <span>Análisis generado por BLUCO CEO BRAIN — Versión Agresiva</span>
      </div>
    </section>
  );
};

export default ExecutiveSummary;
