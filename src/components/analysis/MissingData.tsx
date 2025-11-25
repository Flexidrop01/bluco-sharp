import { FileQuestion, Upload, AlertTriangle } from 'lucide-react';
import { MissingData as MissingDataType } from '@/types/analysis';
import { Button } from '@/components/ui/button';

interface MissingDataProps {
  missingData: MissingDataType[];
}

const MissingData = ({ missingData }: MissingDataProps) => {
  return (
    <section className="glass-card p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
      <div className="section-header">
        <div className="section-icon bg-warning/10 text-warning">
          <FileQuestion className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Datos Adicionales Necesarios</h2>
          <p className="text-sm text-muted-foreground">Para completar el análisis</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {missingData.map((data, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground">{data.field}</h4>
                <p className="text-sm text-muted-foreground">{data.reason}</p>
                <p className="text-xs text-warning/80">
                  <strong>Impacto:</strong> {data.impact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-4">
          <Upload className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Sube más informes para un análisis completo
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Con datos de COGS, Ads y catálogo, CEO Brain puede calcular profit real, 
              TACOS, y dar recomendaciones más precisas.
            </p>
            <Button variant="outline" size="sm">
              Subir informes adicionales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissingData;
