import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { parseFile } from '@/lib/fileParser';
import { generateMockAnalysis } from '@/lib/mockAnalysis';
import { AnalysisResult } from '@/types/analysis';
import { toast } from '@/hooks/use-toast';
import { Zap, BarChart3, Shield, Brain } from 'lucide-react';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Parse the file
      const { headers, data, reportType } = await parseFile(file);

      if (reportType === 'unknown') {
        toast({
          title: "Tipo de informe no reconocido",
          description: "El archivo no parece ser un informe estándar de Amazon Seller o Vendor Central. El análisis se realizará con detección automática.",
          variant: "destructive"
        });
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock analysis (in production, this would call the AI backend)
      const result = generateMockAnalysis(file.name, reportType === 'unknown' ? 'seller' : reportType);
      
      setAnalysis(result);
      
      toast({
        title: "Análisis completado",
        description: `Informe de ${reportType === 'seller' ? 'Seller' : reportType === 'vendor' ? 'Vendor' : 'Amazon'} procesado correctamente.`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo';
      setError(errorMessage);
      toast({
        title: "Error de procesamiento",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {!analysis ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>CEO Brain — Análisis sin filtros</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient">Analiza tu cuenta de Amazon</span>
                <br />
                <span className="text-foreground">como un CEO</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Sube tu informe de transacciones y recibe un diagnóstico completo con 
                métricas clave, problemas identificados y acciones prioritarias.
              </p>
            </div>

            {/* Upload Section */}
            <FileUpload 
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              error={error}
            />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                {
                  icon: BarChart3,
                  title: 'Diagnóstico Numérico',
                  description: 'Ventas, fees, devoluciones y rentabilidad por SKU y marketplace'
                },
                {
                  icon: Brain,
                  title: 'Análisis Estratégico',
                  description: 'Riesgos, oportunidades y recomendaciones directas sin filtros'
                },
                {
                  icon: Shield,
                  title: 'Plan de Acción',
                  description: 'Decisiones priorizadas con impacto y timeframe definido'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="glass-card p-6 text-center animate-fade-in"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AnalysisDashboard analysis={analysis} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default Index;
