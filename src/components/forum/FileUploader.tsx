import { useCallback, useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onUpload: (files: { name: string; url: string; type: string; size: number }[]) => void;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export function FileUploader({ onUpload, maxFiles = 5, accept = 'image/*,.pdf,.doc,.docx,.txt,.zip', disabled }: FileUploaderProps) {
  const { uploadMultiple, uploading, progress } = useFileUpload();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).slice(0, maxFiles - uploadedFiles.length);
    if (fileArray.length === 0) {
      toast({ title: `Maximum ${maxFiles} files allowed`, variant: 'destructive' });
      return;
    }

    // Check file sizes (max 50MB each)
    const oversizedFiles = fileArray.filter(f => f.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({ title: 'Files must be under 50MB', variant: 'destructive' });
      return;
    }

    const results = await uploadMultiple(fileArray);
    if (results.length > 0) {
      const newFiles = [...uploadedFiles, ...results];
      setUploadedFiles(newFiles);
      onUpload(newFiles);
      toast({ title: `${results.length} file(s) uploaded` });
    }
  }, [uploadedFiles, maxFiles, uploadMultiple, onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onUpload(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading... {Math.round(progress)}%</p>
            <div className="w-full max-w-xs bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, up to 50MB each
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached files ({uploadedFiles.length})</p>
          <div className="grid gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-md border bg-card">
                {isImage(file.type) ? (
                  <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
