import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import IDQFileUpload from '@/components/idq/IDQFileUpload';
import IDQDashboard from '@/components/idq/IDQDashboard';
import MultiFileUpload from '@/components/multi/MultiFileUpload';
import MultiDashboard from '@/components/multi/MultiDashboard';
import { parseFile } from '@/lib/fileParser';
import { parseIDQFile } from '@/lib/idqParser';
import { generateMockAnalysis } from '@/lib/mockAnalysis';
import { generateMockIDQAnalysis } from '@/lib/mockIdqAnalysis';
import { generateMockMultiAnalysis } from '@/lib/mockMultiAnalysis';
import { AnalysisResult } from '@/types/analysis';
import { IDQAnalysisResult } from '@/types/idq';
import { MultiAnalysisResult, FileInfo } from '@/types/multiTransaction';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BarChart3, Shield, Brain, Sparkles, FileText, Image, Tag, Globe, Layers, Target } from 'lucide-react';

type AnalysisMode = 'ceo' | 'idq' | 'multi';

const Index = () => {
  const [mode, setMode] = useState<AnalysisMode>('ceo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ceoAnalysis, setCeoAnalysis] = useState<AnalysisResult | null>(null);
  const [idqAnalysis, setIdqAnalysis] = useState<IDQAnalysisResult | null>(null);
  const [multiAnalysis, setMultiAnalysis] = useState<MultiAnalysisResult | null>(null);

  const handleCEOFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { reportType } = await parseFile(file);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCeoAnalysis(generateMockAnalysis(file.name, reportType === 'unknown' ? 'seller' : reportType));
      toast({ title: "Análisis completado", description: `Informe procesado correctamente.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleIDQFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { data } = await parseIDQFile(file);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIdqAnalysis(generateMockIDQAnalysis(file.name, data));
      toast({ title: "Análisis IDQ completado" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleMultiFilesSelect = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockFiles: FileInfo[] = files.map((f, i) => ({
        id: `file-${i}`,
        fileName: f.name,
        marketplace: ['amazon.com', 'amazon.de', 'amazon.es', 'amazon.co.uk'][i % 4],
        country: ['USA', 'Germany', 'Spain', 'UK'][i % 4],
        currency: ['USD', 'EUR', 'EUR', 'GBP'][i % 4],
        region: ['NA', 'EU', 'EU', 'EU'][i % 4],
        reportType: 'transaction',
        rowCount: Math.floor(Math.random() * 5000) + 500,
        detectedColumns: []
      }));
      setMultiAnalysis(generateMockMultiAnalysis(mockFiles));
      toast({ title: "Análisis Multi-Mercado completado", description: `${files.length} archivos procesados.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Show dashboards
  if (ceoAnalysis && mode === 'ceo') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <AnalysisDashboard analysis={ceoAnalysis} onReset={() => setCeoAnalysis(null)} />
        </main>
      </div>
    );
  }

  if (idqAnalysis && mode === 'idq') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <IDQDashboard analysis={idqAnalysis} onReset={() => setIdqAnalysis(null)} />
        </main>
      </div>
    );
  }

  if (multiAnalysis && mode === 'multi') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <MultiDashboard analysis={multiAnalysis} onReset={() => setMultiAnalysis(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient">Bluco Analyzer</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Suite completa de análisis para tu cuenta de Amazon
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as AnalysisMode)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 glass-card">
              <TabsTrigger value="ceo" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-semibold">CEO Brain</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="idq" className="py-3 data-[state=active]:bg-idq data-[state=active]:text-idq-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold">IDQ Optimizer</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="multi" className="py-3 data-[state=active]:bg-multi data-[state=active]:text-multi-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-semibold">Multi-Mercado</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ceo" className="space-y-8">
              <FileUpload onFileSelect={handleCEOFileSelect} isProcessing={isProcessing} error={error} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: BarChart3, title: 'Diagnóstico Numérico', description: 'Ventas, fees, devoluciones' },
                  { icon: Brain, title: 'Análisis Estratégico', description: 'Riesgos y oportunidades' },
                  { icon: Shield, title: 'Plan de Acción', description: 'Decisiones priorizadas' }
                ].map((f, i) => (
                  <div key={i} className="glass-card p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="idq" className="space-y-8">
              <IDQFileUpload onFileSelect={handleIDQFileSelect} isProcessing={isProcessing} error={error} />
            </TabsContent>

            <TabsContent value="multi" className="space-y-8">
              <MultiFileUpload onFilesSelect={handleMultiFilesSelect} isProcessing={isProcessing} error={error} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Globe, title: 'Multi-País', description: 'USA, EU, JP, MX, CA...' },
                  { icon: Layers, title: 'Modelos Unificados', description: 'FBA, FBM, AWD juntos' },
                  { icon: Target, title: 'KPIs Globales', description: 'Visión consolidada' }
                ].map((f, i) => (
                  <div key={i} className="glass-card p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-multi/10 flex items-center justify-center mx-auto mb-4">
                      <f.icon className="w-6 h-6 text-multi" />
                    </div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
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
