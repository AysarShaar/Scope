export interface DetectedImage {
  ext: 'jpg' | 'png' | 'gif' | 'webp' | 'avif';
  mime: string;
}

export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const DEFAULT_IMAGES_BASE_URL = 'https://img.scope-media.net';

/** Public base URL of the R2 images bucket (no trailing slash). */
export function getImagesBaseUrl(): string {
  return (process.env.IMAGES_PUBLIC_URL || DEFAULT_IMAGES_BASE_URL).replace(/\/$/, '');
}

/** Identifies the real image type from the file's first bytes; the client-sent type and name are not trusted. */
export function detectImageTypeFromBytes(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length < 4) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' };
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { ext: 'gif', mime: 'image/gif' };
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }

  if (bytes.length >= 12) {
    const brand = String.fromCharCode(...bytes.slice(4, 12));
    if (brand.startsWith('ftypavif') || brand.startsWith('ftypavis')) {
      return { ext: 'avif', mime: 'image/avif' };
    }
  }

  return null;
}

export async function detectImageType(blob: Blob): Promise<DetectedImage | null> {
  try {
    const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    return detectImageTypeFromBytes(header);
  } catch {
    return null;
  }
}

/** Object key such as `articles/2026/10/<uuid>.webp`. The random id makes every key unique, so files are never overwritten. */
export function buildImageKey(
  ext: string,
  now: Date = new Date(),
  id: string = crypto.randomUUID(),
): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `articles/${year}/${month}/${id}.${ext}`;
}

export function publicImageUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${key}`;
}
