import { useState } from "react";
import { Loader2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFViewerProps {
  src: string;
  title?: string;
  className?: string;
}

export function PDFViewer({ src, title = "PDF Document", className = "" }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if it's a data URL (Base64)
  const isDataUrl = src.startsWith("data:");
  const isPdfDataUrl = src.startsWith("data:application/pdf");

  // Handle download for Base64 PDFs
  const handleDownload = () => {
    if (isDataUrl && isPdfDataUrl) {
      const link = document.createElement("a");
      link.href = src;
      link.download = `${title || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && isPdfDataUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {isPdfDataUrl ? (
        <>
          {/* PDF Toolbar */}
          <div className="flex items-center justify-between mb-2 p-3 bg-muted rounded-t-lg border">
            <div className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* PDF Iframe */}
          <iframe
            src={src}
            title={title}
            className={`w-full rounded-b-lg border flex-1 ${isLoading ? "opacity-0" : "opacity-100"}`}
            style={{ minHeight: "70vh", transition: "opacity 0.3s" }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError("Failed to load PDF. Some browsers may have restrictions with data URLs. Try downloading instead.");
              setIsLoading(false);
            }}
          />
        </>
      ) : (
        // For regular URLs or unsupported formats
        <iframe
          src={src}
          title={title}
          className="w-full h-[70vh] rounded-lg border"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError("Failed to load content");
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}
