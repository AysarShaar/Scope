export function optimizeCloudinaryUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('res.cloudinary.com')) {
    return trimmed;
  }

  if (
    trimmed.includes('/f_auto/') ||
    trimmed.includes('/f_auto,') ||
    trimmed.includes(',f_auto/') ||
    trimmed.includes(',f_auto,')
  ) {
    return trimmed;
  }

  if (trimmed.includes('/f-auto/')) {
    return trimmed.replace('/f-auto/', '/f_auto/');
  }

  if (trimmed.includes('/image/upload/')) {
    return trimmed.replace('/image/upload/', '/image/upload/f_auto/');
  }

  if (trimmed.includes('/video/upload/')) {
    return trimmed.replace('/video/upload/', '/video/upload/f_auto/');
  }

  return trimmed;
}
