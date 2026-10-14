const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

/**
 * Helper to load an image source across all browser environments.
 * Uses `createImageBitmap` where supported, with a fallback to `HTMLImageElement`.
 */
async function loadImageSource(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to Image fallback
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
        cleanup: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Browser-side client compression:
 * ALWAYS converts and compresses images to WebP format directly in the user's browser before upload.
 * - Scales down large images to MAX_DIMENSION (1920px) while preserving aspect ratio.
 * - Compresses with high-efficiency WebP encoder (quality 0.82).
 * - Offloads 100% of image compression CPU workload from the server to the client.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  // If not running in a browser window context, return the file as-is
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  try {
    const imgSource = await loadImageSource(file);
    try {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(imgSource.width, imgSource.height));
      const targetWidth = Math.max(1, Math.round(imgSource.width * scale));
      const targetHeight = Math.max(1, Math.round(imgSource.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      imgSource.draw(ctx, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
      );

      // Must be a valid WebP blob
      if (!blob || blob.type !== 'image/webp') return file;

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
      return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
    } finally {
      imgSource.cleanup();
    }
  } catch (err) {
    console.warn('[prepareImageForUpload] Browser WebP compression skipped due to error, sending original:', err);
    return file;
  }
}
