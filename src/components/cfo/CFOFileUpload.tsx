import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CFOFileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const CFOFileUpload = ({ onFileSelect, isProcessing, error }: CFOFileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300",
          "bg-gradient-to-br from-cfo/5 to-cfo/10",
          isDragOver 
            ? "border-cfo bg-cfo/10 scale-[1.02]" 
            : "border-cfo/30 hover:border-cfo/50",
          isProcessing && "pointer-events-none opacity-70"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-cfo/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cfo animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Analizando informe fiscal...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  CFO Brain procesando datos de IVA
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-cfo/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Scale className="w-10 h-10 text-cfo" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground mb-1">
                  Arrastra tu informe AIVA / VAT aquí
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV o Excel con datos fiscales de Amazon EU
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">o</span>
              </div>
              <label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" className="border-cfo/30 hover:bg-cfo/10 hover:border-cfo cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </span>
                </Button>
              </label>
            </>
          )}
        </div>

        {selectedFile && !isProcessing && (
          <div className="mt-4 p-3 bg-cfo/5 rounded-lg border border-cfo/20">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-cfo" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        {[
          { label: 'AIVA Report', icon: '📋' },
          { label: 'VAT Listings', icon: '🏛️' },
          { label: 'OSS/IOSS', icon: '🌍' },
          { label: 'Intrastat', icon: '🚚' },
        ].map((type, i) => (
          <div key={i} className="p-3 rounded-lg bg-card/50 border border-border/50">
            <span className="text-xl">{type.icon}</span>
            <p className="text-xs text-muted-foreground mt-1">{type.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CFOFileUpload;
