/**
 * Utility for compressing image files in the browser before upload.
 * Reduces file sizes dramatically (e.g. from 5MB-10MB photos to ~100KB-300KB)
 * using HTML5 Canvas & WebP/JPEG compression while maintaining great visual quality.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'image/webp',
  } = options;

  // Don't compress non-image files or SVG
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio & scaling
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original if canvas fails
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Create compressed File object preserving original extension style
            const ext = format === 'image/webp' ? '.webp' : '.jpg';
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + ext;

            const compressedFile = new File([blob], cleanName, {
              type: format,
              lastModified: Date.now(),
            });

            console.log(
              `[Image Compressor] Original: ${(file.size / 1024).toFixed(1)} KB -> Compressed: ${(compressedFile.size / 1024).toFixed(1)} KB`
            );

            resolve(compressedFile);
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Fallback to original image on load error
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
