import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileCheck } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  label?: string;
  className?: string;
}

export function FileUpload({ onUploadComplete, accept = "image/*", label = "Upload File", className }: FileUploadProps) {
  const { uploadFile, isUploading, error } = useUpload();
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    if (file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview("file"); // Marker for non-image file
    }

    try {
      const result = await uploadFile(file);
      if (result) {
        // Construct the full public URL based on the storage bucket config
        // Assuming public access is configured for this bucket
        // The presigned URL approach returns uploadURL, but we need the fetch URL.
        // For this demo, let's use the objectPath returned which is what we store in DB.
        
        // Wait, typical pattern: 
        // 1. Upload to presigned URL
        // 2. The URL to ACCESS the file is usually different.
        // Let's assume we use the objectPath for storage in DB, and a getter route to display.
        onUploadComplete(result.objectPath);
      }
    } catch (err) {
      console.error("Upload failed", err);
      setPreview(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploadComplete(""); // Clear in parent
  };

  return (
    <div className={cn("relative group cursor-pointer w-full", className)}>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 h-full max-h-48 flex items-center justify-center">
          {preview === "file" ? (
            <div className="flex flex-col items-center text-muted-foreground p-4">
              <FileCheck className="w-10 h-10 mb-2" />
              <span className="text-sm font-medium">File Uploaded</span>
            </div>
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={clearFile}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-4 sm:p-6 h-full hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
        >
          <div className="p-2 sm:p-3 bg-primary/5 rounded-full text-primary">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Click to browse</p>
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error.message}</p>}
        </div>
      )}
    </div>
  );
}
