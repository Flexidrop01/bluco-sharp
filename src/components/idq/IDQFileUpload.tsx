import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IDQFileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const IDQFileUpload = ({ onFileSelect, isProcessing, error }: IDQFileUploadProps) => {
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
        onClick={() => document.getElementById('idq-file-input')?.click()}
      >
        <input
          id="idq-file-input"
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          className="hidden"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-6">
          {isProcessing ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-idq/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-idq animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Analizando informe IDQ...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  IDQ Optimizer procesando datos de calidad
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-idq/10 flex items-center justify-center group-hover:bg-idq/20 transition-colors">
                <Sparkles className="w-10 h-10 text-idq" />
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Arrastra tu informe IDQ aquí
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Item Data Quality Report de Amazon
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
              
              <Button className="mt-2 bg-idq hover:bg-idq/90 text-white" size="lg">
                Seleccionar Archivo IDQ
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
      
      <div className="mt-8 glass-card p-6">
        <h3 className="text-sm font-semibold text-idq mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          ¿Qué analiza el IDQ Optimizer?
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Contenido</p>
            <ul className="space-y-1">
              <li>• Títulos y keywords</li>
              <li>• Bullet points</li>
              <li>• Descripciones y A+</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Multimedia</p>
            <ul className="space-y-1">
              <li>• Cantidad de imágenes</li>
              <li>• Tipos de imágenes</li>
              <li>• Vídeos de producto</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Datos estructurados</p>
            <ul className="space-y-1">
              <li>• Atributos obligatorios</li>
              <li>• Categorización</li>
              <li>• Variaciones</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Resultado</p>
            <ul className="space-y-1">
              <li>• Propuestas de mejora</li>
              <li>• Textos optimizados</li>
              <li>• Plan de acción</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDQFileUpload;
