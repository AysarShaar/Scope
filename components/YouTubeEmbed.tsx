'use client';

import React from 'react';
import { extractYouTubeId, getYouTubeEmbedUrl } from '../lib/youtube';

interface YouTubeEmbedProps {
  urlOrId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  urlOrId,
  title = 'YouTube video player',
  className = '',
  autoplay = false,
}) => {
  const embedUrl = getYouTubeEmbedUrl(urlOrId, autoplay);
  const videoId = extractYouTubeId(urlOrId);

  if (!embedUrl || !videoId) {
    return null;
  }

  return (
    <div
      className={`relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};
