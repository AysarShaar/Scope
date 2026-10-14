const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;
const CONVERTIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Browser-side: shrinks large JPEG/PNG/WebP images and re-encodes them as WebP before upload,
 * since R2 stores files as-is. GIF and AVIF are left untouched, and any failure returns the
 * original file, so uploading never breaks because of this step.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!CONVERTIBLE_TYPES.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
