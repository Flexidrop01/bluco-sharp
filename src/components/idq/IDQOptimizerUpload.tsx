import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Sparkles, List, Search, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type InputMethod = 'asin-list' | 'ean-list' | 'file';

interface IDQOptimizerUploadProps {
  onFileSelect: (file: File, identifiers?: string[]) => void;
  isProcessing: boolean;
  error: string | null;
}

const IDQOptimizerUpload = ({ onFileSelect, isProcessing, error }: IDQOptimizerUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>('asin-list');
  const [identifiersText, setIdentifiersText] = useState('');
  const [vigilanceFile, setVigilanceFile] = useState<File | null>(null);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);

  // Parsear identificadores del texto
  const parseIdentifiers = (text: string): string[] => {
    return text
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 5 && s.length <= 20);
  };

  const identifiersList = parseIdentifiers(identifiersText);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setVigilanceFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVigilanceFile(files[0]);
    }
  }, []);

  const handleAnalyze = () => {
    if (!vigilanceFile) return;
    
    const identifiers = inputMethod !== 'file' && identifiersText.trim() 
      ? identifiersList 
      : undefined;
    
    onFileSelect(vigilanceFile, identifiers);
  };

  const clearFile = () => {
    setVigilanceFile(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Selector de método de entrada */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-idq" />
            Cargar productos
          </h3>
          
          <RadioGroup 
            value={inputMethod} 
            onValueChange={(v) => setInputMethod(v as InputMethod)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="asin-list" id="asin-list" />
              <Label htmlFor="asin-list" className="flex items-center gap-2 cursor-pointer">
                <Badge variant="outline" className="bg-idq/10 text-idq border-idq/30">ASIN</Badge>
                Lista de ASINs
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="ean-list" id="ean-list" />
              <Label htmlFor="ean-list" className="flex items-center gap-2 cursor-pointer">
                <Badge variant="outline" className="bg-amazon-orange/10 text-amazon-orange border-amazon-orange/30">EAN/UPC</Badge>
                Lista de códigos EAN / UPC / GTIN
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="file" id="file" />
              <Label htmlFor="file" className="flex items-center gap-2 cursor-pointer">
                <Badge variant="outline" className="bg-multi/10 text-multi border-multi/30">Archivo</Badge>
                Cargar archivo con identificadores
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Input de identificadores */}
      {inputMethod !== 'file' && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {inputMethod === 'asin-list' ? 'Lista de ASINs' : 'Lista de EAN/UPC/GTIN'}
                </Label>
                {identifiersList.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {identifiersList.length} identificadores
                  </Badge>
                )}
              </div>
              <Textarea
                placeholder={inputMethod === 'asin-list' 
                  ? "Pega aquí los ASINs (uno por línea o separados por comas)...\n\nB07H24Q9GF\nB07PQ7SYKP\nB07H24Q6QC"
                  : "Pega aquí los códigos EAN/UPC (uno por línea o separados por comas)...\n\n8436013179016\n8436013179023"}
                value={identifiersText}
                onChange={(e) => setIdentifiersText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Puedes cargar hasta 10,000 productos. Separa los identificadores con comas, espacios o saltos de línea.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload de archivo de vigilancia */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-idq" />
            Archivo de Vigilancia (Estado Amazon)
          </Label>
          {vigilanceFile && (
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {vigilanceFile ? (
          <Card className="glass-card border-idq/30">
            <CardContent className="p-4 flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-idq" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{vigilanceFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(vigilanceFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Badge className="bg-status-success/20 text-status-success border-status-success/30">
                Listo
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              'upload-zone cursor-pointer relative border-2 border-dashed rounded-xl p-8 transition-all',
              isDragOver ? 'border-idq bg-idq/5' : 'border-border hover:border-idq/50',
              isProcessing && 'pointer-events-none opacity-70'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('vigilance-file-input')?.click()}
          >
            <input
              id="vigilance-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
              disabled={isProcessing}
            />
            
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-idq/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-idq" />
              </div>
              <div>
                <p className="text-sm font-medium">Arrastra el archivo de vigilancia aquí</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Excel con datos de Estado Amazon (BSR, Nodos, Videos, A+)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>CSV</span>
                <span>•</span>
                <span>Excel (.xlsx, .xls)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opciones adicionales */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="include-unavailable" 
              checked={includeUnavailable}
              onCheckedChange={(checked) => setIncludeUnavailable(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="include-unavailable" className="text-sm font-medium cursor-pointer">
                Incluir productos sin datos disponibles
              </Label>
              <p className="text-xs text-muted-foreground">
                Productos para los que actualmente no se puede recopilar información
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de análisis */}
      <Button 
        className="w-full bg-idq hover:bg-idq/90 text-white py-6 text-lg"
        onClick={handleAnalyze}
        disabled={!vigilanceFile || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analizando IDQ...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Cargar y Analizar
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error al procesar</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Info panel */}
      <Card className="glass-card border-info/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">¿Qué analiza el IDQ Optimizer?</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p>• Longitud de título (150-200 chars)</p>
                  <p>• 5 Bullet Points completos</p>
                  <p>• Mínimo 7 imágenes</p>
                  <p>• Vídeo de producto</p>
                </div>
                <div>
                  <p>• Contenido A+</p>
                  <p>• Rating &gt; 4 estrellas</p>
                  <p>• Más de 30 reseñas</p>
                  <p>• Posición Buy Box</p>
                </div>
              </div>
              <p className="text-xs italic mt-2">
                * Recomendado: máximo 5,000 productos. Listas grandes pueden tardar más.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IDQOptimizerUpload;
