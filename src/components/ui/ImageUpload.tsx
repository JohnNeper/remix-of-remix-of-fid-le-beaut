import React, { useState } from 'react';
import { UploadCloud, X, Loader2, ImageIcon, RefreshCw } from 'lucide-react';
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
  aspectRatio?: 'square' | 'wide' | 'video' | string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  className,
  label = "Cliquez ou glissez une image ici"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const urls = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

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

  // SINGLE IMAGE MODE: Full card filling container with smooth hover overlay
  if (!multiple && urls.length > 0) {
    return (
      <div className={cn("relative group rounded-2xl overflow-hidden border-2 border-border/80 bg-muted/20 shadow-md transition-all hover:border-primary/60 w-full h-48", className)}>
        {/* Filled Background Image */}
        <img
          src={urls[0]}
          alt="Aperçu"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-4 text-white">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isUploading ? "Chargement..." : "Changer l'image"}</span>
            <input
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          <button
            type="button"
            onClick={() => removeImage(urls[0])}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all"
          >
            <X className="h-3.5 w-3.5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>
    );
  }

  // MULTIPLE IMAGES MODE or EMPTY SINGLE DROPZONE
  return (
    <div className="space-y-4 w-full">
      {multiple && urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {urls.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-border/80 shadow-xs bg-muted/20">
              <img src={url} alt={`Photo ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more tile in multiple mode */}
          <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin mb-1" />
            ) : (
              <UploadCloud className="w-6 h-6 text-primary mb-1" />
            )}
            <span className="text-xs font-bold text-primary text-center px-2">
              {isUploading ? "Chargement..." : "Ajouter des photos"}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              multiple={true}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {(!multiple || urls.length === 0) && (
        <label className={cn(
          "flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all p-4 text-center group",
          className
        )}>
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
            )}
            <p className="mb-1 text-sm font-bold text-foreground">
              {isUploading ? "Upload en cours..." : label}
            </p>
            <p className="text-xs text-muted-foreground font-medium">PNG, JPG ou WEBP (Max. 10 Mo)</p>
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
