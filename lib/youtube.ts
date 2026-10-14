export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );

  return match && match[1] ? match[1] : null;
}

export function isYouTubeUrl(text?: string): boolean {
  return Boolean(extractYouTubeId(text));
}

export function getYouTubeEmbedUrl(urlOrId: string, autoplay: boolean = false): string | null {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;

  const params = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
