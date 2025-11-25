import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const FileUpload = ({ onFileSelect, isProcessing, error }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

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
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

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
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Analizando archivo...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  CEO Brain procesando datos
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Arrastra tu informe de Amazon aquí
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz clic para seleccionar archivo
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xlsx, .xls)</span>
                </div>
              </div>
              
              <Button variant="hero" size="lg" className="mt-2">
                Seleccionar Archivo
              </Button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error al procesar archivo</p>
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
    </div>
  );
};

export default FileUpload;
