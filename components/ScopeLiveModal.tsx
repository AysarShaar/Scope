'use client';

import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Send, Users } from 'lucide-react';
import { ScopeVisual } from './ScopeVisual';

interface ScopeLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScopeLiveModal: React.FC<ScopeLiveModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { id: 1, user: 'أحمد السعدي', time: 'الآن', text: 'تغطية ممتازة وموضوعية كالعادة من SCOPE.' },
    { id: 2, user: 'ريم الزهراني', time: 'منذ دقيقة', text: 'الصوت والصورة فائقة الوضوح.' },
    { id: 3, user: 'د. فيصل المعمري', time: 'منذ دقيقتين', text: 'تحليل دقيق لأبعاد القمة الاقتصادية.' },
  ]);

  if (!isOpen) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLogs((prev) => [
      ...prev,
      { id: Date.now(), user: 'أنت (مشارك)', time: 'الآن', text: chatMessage.trim() },
    ]);
    setChatMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-[#0c1424] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Top Header */}
        <div className="px-5 py-3 bg-[#070e1b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#dc2626] text-white font-bold text-xs rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>بث حي (( ))</span>
            </span>
            <span className="text-sm font-bold text-slate-200">
              استوديو الأخبار الرئيسي - تغطية حية عبر SCOPE MEDIA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">48,290 مشاهد الآن</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Video Screen */}
          <div className="lg:col-span-8 bg-black relative flex flex-col justify-between overflow-hidden">
            <div className="relative flex-1 w-full h-full">
              <ScopeVisual type="anchor_studio" className="w-full h-full" />
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                <span className="font-black text-sm tracking-wider text-white">SCOPE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                <span className="text-[11px] font-semibold text-red-300">LIVE</span>
              </div>

              {/* Lower Third News Marquee Banner */}
              <div className="absolute bottom-12 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pb-2">
                <div className="bg-[#dc2626] text-white px-3 py-0.5 text-xs font-bold inline-block rounded-full mb-1">
                  تغطية خاصة
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  قمة الرياض: اتفاقيات اقتصادية واستراتيجية تعيد صياغة المشهد الإقليمي
                </h4>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="h-12 bg-[#070e1b] border-t border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-full hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-full hover:bg-white/10 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>مباشر</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="bg-slate-800 px-2.5 py-0.5 rounded-full font-mono text-[10px]">1080p HD</span>
                <button className="p-1.5 rounded-full hover:bg-white/10 hover:text-white cursor-pointer" aria-label="شاشة كاملة">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Chat */}
          <div className="lg:col-span-4 bg-[#0c1424] border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col h-full">
            <div className="p-3 border-b border-slate-800 bg-[#070e1b] flex items-center justify-between text-xs">
              <span className="font-bold text-white">الدردشة الحية مع الجمهور</span>
              <span className="text-slate-400">متصل الآن</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              {chatLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-[#121d33] rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-bold text-[#38bdf8]">{log.user}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-slate-200">{log.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-800 bg-[#070e1b] flex gap-2">
              <input
                type="text"
                placeholder="اكتب تعليقك المباشر..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-[#121d33] border border-slate-700 px-3.5 py-2 text-xs text-white rounded-full focus:outline-none focus:border-rose-500 placeholder-slate-400"
              />
              <button
                type="submit"
                className="w-9 h-9 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
