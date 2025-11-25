import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Globe, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileInfo } from '@/types/multiTransaction';

interface MultiFileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
  error: string | null;
  detectedFiles?: FileInfo[];
}

const MultiFileUpload = ({ onFilesSelect, isProcessing, error, detectedFiles }: MultiFileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div
        className={cn(
          'upload-zone cursor-pointer relative',
          isDragOver && 'dragover',
          isProcessing && 'pointer-events-none opacity-70'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('multi-file-input')?.click()}
      >
        <input
          id="multi-file-input"
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          multiple
          className="hidden"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-6">
          {isProcessing ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-multi/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-multi animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Procesando {selectedFiles.length} archivos...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Normalizando datos y unificando análisis
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-multi/10 flex items-center justify-center group-hover:bg-multi/20 transition-colors">
                <Globe className="w-10 h-10 text-multi" />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Arrastra múltiples informes aquí
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  USA, Europa, Japón, México, Canadá... todos a la vez
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV / Excel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>Multi-país</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Auto-detección</span>
                </div>
              </div>
              
              <Button className="mt-2 bg-multi hover:bg-multi/90 text-white" size="lg">
                Seleccionar Archivos
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && !isProcessing && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Archivos seleccionados ({selectedFiles.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-foreground">
              Limpiar todo
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-multi" />
                  <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full bg-multi hover:bg-multi/90 text-white" 
            onClick={handleAnalyze}
          >
            <Globe className="w-4 h-4 mr-2" />
            Analizar {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Detected Files Info */}
      {detectedFiles && detectedFiles.length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-multi flex items-center gap-2">
            <Check className="w-4 h-4" />
            Archivos detectados automáticamente
          </h3>
          <div className="space-y-2">
            {detectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-multi/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{file.fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-multi/20 text-multi">
                    {file.country}
                  </span>
                  <span className="text-xs text-muted-foreground">{file.currency}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {file.rowCount.toLocaleString()} filas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error al procesar archivos</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {/* Supported Reports */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-multi mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Informes soportados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-medium text-foreground mb-2">Norteamérica</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• USA (amazon.com)</li>
              <li>• Canadá (amazon.ca)</li>
              <li>• México (amazon.com.mx)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Europa</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• UK, DE, FR, ES, IT</li>
              <li>• NL, PL, SE, BE</li>
              <li>• Liquidaciones EU</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Asia-Pacífico</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Japón (amazon.co.jp)</li>
              <li>• Australia (amazon.com.au)</li>
              <li>• Singapur, India</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Tipos de informe</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Transacciones / Pay</li>
              <li>• Liquidaciones</li>
              <li>• Ads / Reembolsos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiFileUpload;
