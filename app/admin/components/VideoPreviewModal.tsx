'use client';

import { X } from 'lucide-react';

interface Props {
  video: { title: string; youtubeId: string };
  onClose: () => void;
}

/** Modal that plays one episode from YouTube (nocookie domain). */
export function VideoPreviewModal({ video, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-black border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="p-3 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
          <h4 className="font-semibold text-xs truncate max-w-[85%]">
            {video.title}
          </h4>
          <button
            onClick={() => onClose()}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="relative aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
