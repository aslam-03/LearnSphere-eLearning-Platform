import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for handling file uploads.
 * Uses a blob: URL for client-side preview.
 */
export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Convert file to base64 data URL for storage in Firestore
   */
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Upload a file by converting to data URL
   * For development: stores file as base64 in Firestore
   * For production: replace with Firebase Storage or backend upload
   */
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        if (!file) {
          throw new Error("No file provided");
        }

        // Validate file size (max 5MB for data URLs in Firestore)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          throw new Error("File too large (max 5MB for development)");
        }

        setProgress(30);

        // Convert to data URL
        const dataUrl = await fileToDataUrl(file);

        setProgress(80);

        // Create a blob URL for immediate preview
        const blobUrl = URL.createObjectURL(file);

        setProgress(100);

        const uploadResponse: UploadResponse = {
          uploadURL: blobUrl,
          // For Firestore storage, use data URL instead
          // In production, this would be a CDN URL
          objectPath: dataUrl,
          metadata: {
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          },
        };

        console.log(
          "Upload complete. Using blob URL for preview:",
          blobUrl.substring(0, 50) + "..."
        );

        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        console.error("Upload error:", error);
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [fileToDataUrl, options]
  );

  /**
   * Get upload parameters for Uppy's AWS S3 plugin.
   * (Legacy method - using blob URLs now)
   */
  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      throw new Error(
        "Uppy upload not supported. Use uploadFile() instead."
      );
    },
    []
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}

