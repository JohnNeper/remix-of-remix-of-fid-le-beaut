import React, { useCallback, useState } from 'react';
import { UploadCloud, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompressor';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
  label?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ value, onChange, multiple = false, className, label = "Cliquez ou glissez une image ici" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const urls = Array.isArray(value) ? value : value ? [value] : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    try {
      if (multiple) {
        const rawFiles = Array.from(e.target.files);
        const compressedFiles = await Promise.all(rawFiles.map((f) => compressImage(f)));
        try {
          const uploadedUrls = await api.uploadImages(compressedFiles);
          if (uploadedUrls && uploadedUrls.length > 0) {
            onChange([...urls, ...uploadedUrls]);
            return;
          }
        } catch (apiErr) {
          console.warn("Transfert Cloudinary/Backend non disponible, bascule automatique vers l'image optimisée:", apiErr);
        }
        const dataUrls = await Promise.all(compressedFiles.map(fileToDataUrl));
        onChange([...urls, ...dataUrls.filter(Boolean)]);
      } else {
        const rawFile = e.target.files[0];
        const compressedFile = await compressImage(rawFile);
        try {
          const uploadedUrl = await api.uploadImage(compressedFile);
          if (uploadedUrl) {
            onChange(uploadedUrl);
            return;
          }
        } catch (apiErr) {
          console.warn("Transfert Cloudinary/Backend non disponible, bascule automatique vers l'image optimisée:", apiErr);
        }
        const dataUrl = await fileToDataUrl(compressedFile);
        onChange(dataUrl);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (urlToRemove: string) => {
    if (multiple) {
      onChange(urls.filter(url => url !== urlToRemove));
    } else {
      onChange('');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {urls.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
              <img src={url} alt={`Upload ${index}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-destructive text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(!urls.length || multiple) && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
            )}
            <p className="mb-2 text-sm text-muted-foreground font-medium">
              {isUploading ? "Upload en cours..." : label}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (Max. 10MB)</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            multiple={multiple}
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
