import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
  error: string | null;
  progress?: number;
  rowsProcessed?: number;
}

const FileUpload = ({ onFilesSelect, isProcessing, error, progress = 0, rowsProcessed = 0 }: FileUploadProps) => {
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
    e.target.value = '';
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
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'upload-zone cursor-pointer relative',
          isDragOver && 'dragover',
          isProcessing && 'pointer-events-none opacity-70'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
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
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="text-center w-full max-w-xs">
                <p className="text-lg font-medium text-foreground">
                  Analizando {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}...
                </p>
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{rowsProcessed.toLocaleString()} filas procesadas</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Arrastra tus informes de Amazon aquí
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Uno o varios archivos de cualquier marketplace
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
              </div>
              
              <Button variant="hero" size="lg" className="mt-2">
                Seleccionar Archivos
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && !isProcessing && (
        <div className="mt-4 glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Archivos seleccionados ({selectedFiles.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-foreground">
              Limpiar
            </Button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate max-w-[280px]">{file.name}</span>
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
            className="w-full" 
            variant="hero"
            onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
          >
            Analizar {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error al procesar</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-2 gap-4 text-center">
        <div className="glass-card p-4">
          <div className="badge-seller inline-block mb-2">Seller Central</div>
          <p className="text-xs text-muted-foreground">
            Transacciones, fees FBA, referral fees, devoluciones
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="badge-vendor inline-block mb-2">Vendor Central</div>
          <p className="text-xs text-muted-foreground">
            PO, shortages, chargebacks, co-op, deducciones
          </p>
        </div>
      </div>

      <div className="mt-4 glass-card p-4">
        <p className="text-xs text-muted-foreground text-center">
          <Globe className="w-3 h-3 inline mr-1" />
          Soporta USA, Europa, Japón, México, Canadá, Australia y más
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
