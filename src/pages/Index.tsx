import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import IDQFileUpload from '@/components/idq/IDQFileUpload';
import IDQDashboard from '@/components/idq/IDQDashboard';
import CFOFileUpload from '@/components/cfo/CFOFileUpload';
import CFODashboard from '@/components/cfo/CFODashboard';
import MultiDashboard from '@/components/multi/MultiDashboard';
import { parseFile } from '@/lib/fileParser';
import { parseIDQFile } from '@/lib/idqParser';
import { parseCFOFile } from '@/lib/cfoParser';
import { processMassiveFile } from '@/lib/massiveFileProcessor';
import { convertMetricsToAnalysis } from '@/lib/metricsToAnalysis';
import { generateMockAnalysis } from '@/lib/mockAnalysis';
import { generateMockIDQAnalysis } from '@/lib/mockIdqAnalysis';
import { generateMockCFOAnalysis } from '@/lib/mockCfoAnalysis';
import { AnalysisResult } from '@/types/analysis';
import { IDQAnalysisResult } from '@/types/idq';
import { CFOAnalysisResult } from '@/types/cfo';
import { MultiAnalysisResult, FileInfo } from '@/types/multiTransaction';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BarChart3, Brain, Sparkles, FileText, Image, Tag, Globe, Scale, Receipt, Building2 } from 'lucide-react';

type AnalysisMode = 'ceo' | 'cfo' | 'idq';

const Index = () => {
  const [mode, setMode] = useState<AnalysisMode>('ceo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rowsProcessed, setRowsProcessed] = useState(0);
  const [singleAnalysis, setSingleAnalysis] = useState<AnalysisResult | null>(null);
  const [multiAnalysis, setMultiAnalysis] = useState<MultiAnalysisResult | null>(null);
  const [idqAnalysis, setIdqAnalysis] = useState<IDQAnalysisResult | null>(null);
  const [cfoAnalysis, setCfoAnalysis] = useState<CFOAnalysisResult | null>(null);

  // CEO Brain handles both single and multiple files
  const handleCEOFilesSelect = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setRowsProcessed(0);
    
    try {
      let totalRowsProcessed = 0;
      const totalFiles = files.length;
      
      // Process all files with the massive processor
      const allMetrics = await Promise.all(
        files.map(async (file, fileIndex) => {
          const metrics = await processMassiveFile(file, (fileProgress) => {
            // Calculate overall progress across all files
            const baseProgress = (fileIndex / totalFiles) * 100;
            const fileContribution = (fileProgress / totalFiles);
            setProgress(baseProgress + fileContribution);
          });
          totalRowsProcessed += metrics.totalRows;
          setRowsProcessed(totalRowsProcessed);
          return { file, metrics };
        })
      );

      // Create file info
      const fileInfos: FileInfo[] = allMetrics.map(({ file, metrics }, i) => ({
        id: `file-${i}`,
        fileName: file.name,
        marketplace: Array.from(metrics.marketplaces)[0] || 'amazon.com',
        country: Array.from(metrics.byCountry.keys())[0] || 'USA',
        currency: Array.from(metrics.currencies)[0] || 'USD',
        region: 'NA',
        reportType: 'transaction',
        rowCount: metrics.totalRows,
        detectedColumns: Array.from(metrics.detectedColumns.keys())
      }));

      if (files.length === 1) {
        // Single file - check if small enough for simple analysis
        const metrics = allMetrics[0].metrics;
        
        if (metrics.validTransactions < 100) {
          // Small file - use original mock for demo
          const { reportType } = await parseFile(files[0]);
          setSingleAnalysis(generateMockAnalysis(files[0].name, reportType === 'unknown' ? 'seller' : reportType));
          setMultiAnalysis(null);
        } else {
          // Large file - use massive processor results
          const analysis = convertMetricsToAnalysis(metrics, fileInfos);
          setMultiAnalysis(analysis);
          setSingleAnalysis(null);
        }
      } else {
        // Multiple files - merge metrics
        const mergedMetrics = allMetrics[0].metrics; // Start with first
        
        // In production, you'd merge all metrics here
        // For now, convert first file's metrics
        const analysis = convertMetricsToAnalysis(mergedMetrics, fileInfos);
        setMultiAnalysis(analysis);
        setSingleAnalysis(null);
      }

      toast({ 
        title: "Análisis completado", 
        description: `${allMetrics.reduce((sum, m) => sum + m.metrics.validTransactions, 0).toLocaleString()} transacciones procesadas` 
      });
    } catch (err) {
      console.error('Processing error:', err);
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

  const handleCFOFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { transactions } = await parseCFOFile(file);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCfoAnalysis(generateMockCFOAnalysis(file.name, transactions));
      toast({ title: "Análisis CFO completado", description: `${transactions.length} transacciones fiscales procesadas` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCEOReset = useCallback(() => {
    setSingleAnalysis(null);
    setMultiAnalysis(null);
    setError(null);
  }, []);

  // Show CEO Brain dashboards
  if (mode === 'ceo' && singleAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <AnalysisDashboard analysis={singleAnalysis} onReset={handleCEOReset} />
        </main>
      </div>
    );
  }

  if (mode === 'ceo' && multiAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <MultiDashboard analysis={multiAnalysis} onReset={handleCEOReset} />
        </main>
      </div>
    );
  }

  if (mode === 'cfo' && cfoAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <CFODashboard analysis={cfoAnalysis} onReset={() => setCfoAnalysis(null)} />
        </main>
      </div>
    );
  }

  if (mode === 'idq' && idqAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <IDQDashboard analysis={idqAnalysis} onReset={() => setIdqAnalysis(null)} />
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
              Suite de análisis avanzado para tu cuenta de Amazon
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as AnalysisMode)} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 glass-card">
              <TabsTrigger value="ceo" className="py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">CEO Brain</span>
                  </div>
                  <span className="text-xs opacity-80">Análisis financiero</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="cfo" className="py-4 data-[state=active]:bg-cfo data-[state=active]:text-cfo-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    <span className="font-semibold">CFO Brain</span>
                  </div>
                  <span className="text-xs opacity-80">Fiscalidad EU</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="idq" className="py-4 data-[state=active]:bg-idq data-[state=active]:text-idq-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">IDQ Optimizer</span>
                  </div>
                  <span className="text-xs opacity-80">Listings</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ceo" className="space-y-8">
              <FileUpload 
                onFilesSelect={handleCEOFilesSelect}
                isProcessing={isProcessing}
                error={error}
                progress={progress}
                rowsProcessed={rowsProcessed}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: BarChart3, title: 'Diagnóstico Numérico', description: 'Ventas, fees, devoluciones por país y modelo' },
                  { icon: Brain, title: 'Análisis Estratégico', description: 'Riesgos, oportunidades, alertas automáticas' },
                  { icon: Globe, title: 'Visión Global', description: 'KPIs consolidados multi-mercado' }
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

            <TabsContent value="cfo" className="space-y-8">
              <CFOFileUpload 
                onFileSelect={handleCFOFileSelect}
                isProcessing={isProcessing}
                error={error}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Receipt, title: 'Análisis VAT/IVA', description: 'IVA por país, tipo y transacción' },
                  { icon: Building2, title: 'Obligaciones Fiscales', description: 'Registros, declaraciones, OSS/IOSS' },
                  { icon: Scale, title: 'Auditoría Fiscal', description: 'Errores, discrepancias, regularizaciones' }
                ].map((feature, index) => (
                  <div key={index} className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <div className="w-12 h-12 rounded-xl bg-cfo/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-cfo" />
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
