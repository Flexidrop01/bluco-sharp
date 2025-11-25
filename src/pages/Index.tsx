import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import IDQFileUpload from '@/components/idq/IDQFileUpload';
import IDQDashboard from '@/components/idq/IDQDashboard';
import { parseFile } from '@/lib/fileParser';
import { parseIDQFile } from '@/lib/idqParser';
import { generateMockAnalysis } from '@/lib/mockAnalysis';
import { generateMockIDQAnalysis } from '@/lib/mockIdqAnalysis';
import { AnalysisResult } from '@/types/analysis';
import { IDQAnalysisResult } from '@/types/idq';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BarChart3, Shield, Brain, Sparkles, FileText, Image, Tag } from 'lucide-react';

type AnalysisMode = 'ceo' | 'idq';

const Index = () => {
  const [mode, setMode] = useState<AnalysisMode>('ceo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceoAnalysis, setCeoAnalysis] = useState<AnalysisResult | null>(null);
  const [idqAnalysis, setIdqAnalysis] = useState<IDQAnalysisResult | null>(null);

  const handleCEOFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { headers, data, reportType } = await parseFile(file);

      if (reportType === 'unknown') {
        toast({
          title: "Tipo de informe no reconocido",
          description: "El archivo no parece ser un informe estándar de Amazon Seller o Vendor Central.",
          variant: "destructive"
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = generateMockAnalysis(file.name, reportType === 'unknown' ? 'seller' : reportType);
      setCeoAnalysis(result);
      
      toast({
        title: "Análisis completado",
        description: `Informe de ${reportType === 'seller' ? 'Seller' : reportType === 'vendor' ? 'Vendor' : 'Amazon'} procesado.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleIDQFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { headers, data, detectedColumns, isValid } = await parseIDQFile(file);

      if (!isValid) {
        toast({
          title: "Formato IDQ no reconocido",
          description: "El archivo no parece ser un informe IDQ estándar. Se usará análisis genérico.",
          variant: "destructive"
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = generateMockIDQAnalysis(file.name, data);
      setIdqAnalysis(result);
      
      toast({
        title: "Análisis IDQ completado",
        description: `${result.asinAnalyses.length} ASINs analizados correctamente.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCEOReset = useCallback(() => {
    setCeoAnalysis(null);
    setError(null);
  }, []);

  const handleIDQReset = useCallback(() => {
    setIdqAnalysis(null);
    setError(null);
  }, []);

  // Show dashboards if analysis exists
  if (ceoAnalysis && mode === 'ceo') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <AnalysisDashboard analysis={ceoAnalysis} onReset={handleCEOReset} />
        </main>
      </div>
    );
  }

  if (idqAnalysis && mode === 'idq') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <IDQDashboard analysis={idqAnalysis} onReset={handleIDQReset} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient">Bluco Analyzer</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas de análisis avanzado para tu cuenta de Amazon
            </p>
          </div>

          {/* Mode Tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as AnalysisMode)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 glass-card">
              <TabsTrigger 
                value="ceo" 
                className="py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">CEO Brain</span>
                  </div>
                  <span className="text-xs opacity-80">Análisis financiero sin filtros</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="idq" 
                className="py-4 data-[state=active]:bg-idq data-[state=active]:text-idq-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">IDQ Optimizer</span>
                  </div>
                  <span className="text-xs opacity-80">Optimización de listings</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ceo" className="space-y-8">
              <FileUpload 
                onFileSelect={handleCEOFileSelect}
                isProcessing={isProcessing}
                error={error}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: BarChart3, title: 'Diagnóstico Numérico', description: 'Ventas, fees, devoluciones y rentabilidad' },
                  { icon: Brain, title: 'Análisis Estratégico', description: 'Riesgos, oportunidades y recomendaciones' },
                  { icon: Shield, title: 'Plan de Acción', description: 'Decisiones priorizadas con impacto definido' }
                ].map((feature, index) => (
                  <div key={index} className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="idq" className="space-y-8">
              <IDQFileUpload 
                onFileSelect={handleIDQFileSelect}
                isProcessing={isProcessing}
                error={error}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: FileText, title: 'Contenido Optimizado', description: 'Títulos, bullets y descripciones mejoradas' },
                  { icon: Image, title: 'Plan de Multimedia', description: 'Estrategia de imágenes y vídeos' },
                  { icon: Tag, title: 'Atributos Completos', description: 'Datos estructurados para mejor indexación' }
                ].map((feature, index) => (
                  <div key={index} className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <div className="w-12 h-12 rounded-xl bg-idq/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-idq" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
