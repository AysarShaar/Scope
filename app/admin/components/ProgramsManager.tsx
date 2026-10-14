'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Edit2,
  Video,
  X,
  RefreshCw,
  Film,
  Upload,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { ScopeShow, ProgramEpisode } from '../../../data/scopeData';
import { extractYouTubeId } from '../../../lib/youtube';
import { useImageUpload } from '../hooks/useImageUpload';
import { ProgramCard } from './ProgramCard';
import { VideoLibrary } from './VideoLibrary';
import { VideoPreviewModal } from './VideoPreviewModal';

interface Props {
  programs: ScopeShow[];
  isLoading: boolean;
  onAddProgram: (data: Partial<ScopeShow>) => Promise<void>;
  onUpdateProgram: (id: string, data: Partial<ScopeShow>) => Promise<void>;
  onDeleteProgram: (id: string, title: string) => Promise<void>;
  userRole: 'admin' | 'editor_in_chief' | 'editor';
}

const EDITORIAL_THEMES = [
  { id: 'deep_investigation', label: 'تحقيقات استقصائية خاصة' },
  { id: 'anchor_studio', label: 'استوديو البرامج الحوارية' },
  { id: 'number_one', label: 'تقارير المال والأعمال' },
  { id: 'lightbulb_idea', label: 'آفاق المستقبل والتكنولوجيا' },
  { id: 'vintage_book', label: 'وثائقيات وأرشيف تاريخي' },
  { id: 'diplomats_meeting', label: 'حوارات دبلوماسية وسياسية' },
];

export default function ProgramsManager({
  programs,
  isLoading,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  userRole,
}: Props) {
  const canManage = userRole === 'admin' || userRole === 'editor_in_chief';

  const [activeTab, setActiveTab] = useState<'programs' | 'videos'>('programs');

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ScopeShow | null>(null);

  const [episodesModalProgram, setEpisodesModalProgram] = useState<ScopeShow | null>(null);

  const [editingEpisodeState, setEditingEpisodeState] = useState<{
    episode: ProgramEpisode;
    programId: string;
  } | null>(null);
  const [editEpTitle, setEditEpTitle] = useState('');
  const [editEpYoutube, setEditEpYoutube] = useState('');
  const [editEpDate, setEditEpDate] = useState('');
  const [editEpDesc, setEditEpDesc] = useState('');
  const [savingEditEpisode, setSavingEditEpisode] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<{
    title: string;
    youtubeId: string;
  } | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [imageType, setImageType] = useState('anchor_studio');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [latestEpisode, setLatestEpisode] = useState('');
  const [savingProgram, setSavingProgram] = useState(false);

  const { fileInputRef, isUploadingImage, uploadError, setUploadError, handleFileUpload } = useImageUpload(setImageUrl, {
    failureMessage: 'فشل رفع الصورة',
    getTitle: () => title,
  });

  const [epTitle, setEpTitle] = useState('');
  const [epYoutube, setEpYoutube] = useState('');
  const [epDate, setEpDate] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [savingEpisode, setSavingEpisode] = useState(false);

  const allVideosList = useMemo(() => {
    const list: Array<{
      episode: ProgramEpisode;
      program: ScopeShow;
    }> = [];

    programs.forEach(prog => {
      if (Array.isArray(prog.episodes)) {
        prog.episodes.forEach(ep => {
          list.push({ episode: ep, program: prog });
        });
      }
    });

    return list;
  }, [programs]);

  const openAddProgram = () => {
    setEditingProgram(null);
    setTitle('');
    setSubtitle('');
    setHost('فريق إنتاج SCOPE');
    setDescription('');
    setImageType('deep_investigation');
    setImageUrl('');
    setYoutubeId('');
    setLatestEpisode('');
    setUploadError('');
    setIsProgramModalOpen(true);
  };

  const openEditProgram = (prog: ScopeShow) => {
    setEditingProgram(prog);
    setTitle(prog.title);
    setSubtitle(prog.subtitle);
    setHost(prog.host);
    setDescription(prog.description);
    setImageType(prog.imageType || 'deep_investigation');
    setImageUrl(prog.imageUrl || '');
    setYoutubeId(prog.youtubeId || prog.episodes?.[0]?.youtubeId || '');
    setLatestEpisode(prog.latestEpisode || prog.episodes?.[0]?.title || '');
    setUploadError('');
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSavingProgram(true);
    try {
      const cleanYt = extractYouTubeId(youtubeId) || youtubeId.trim();
      const data: Partial<ScopeShow> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        host: host.trim(),
        description: description.trim(),
        imageType,
        imageUrl: imageUrl.trim() || undefined,
        youtubeId: cleanYt || undefined,
        latestEpisode: latestEpisode.trim() || undefined,
      };

      if (editingProgram) {
        await onUpdateProgram(editingProgram.id, data);
      } else {
        await onAddProgram(data);
      }
      setIsProgramModalOpen(false);
    } finally {
      setSavingProgram(false);
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodesModalProgram || !epTitle.trim()) return;

    const cleanYt = extractYouTubeId(epYoutube) || epYoutube.trim();
    if (!cleanYt) {
      alert('يرجى إدخال رابط أو معرّف فيديو صالح من YouTube');
      return;
    }

    setSavingEpisode(true);
    try {
      const currentEpisodes: ProgramEpisode[] = Array.isArray(episodesModalProgram.episodes)
        ? [...episodesModalProgram.episodes]
        : [];

      const newEp: ProgramEpisode = {
        id: `ep-${Date.now()}`,
        title: epTitle.trim(),
        youtubeId: cleanYt,
        date: epDate.trim() || new Date().toLocaleDateString('ar-EG'),
        description: epDesc.trim(),
      };

      currentEpisodes.unshift(newEp);

      try {
        await fetch('/api/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newEp.id,
            programId: episodesModalProgram.id,
            title: newEp.title,
            youtubeId: newEp.youtubeId,
            date: newEp.date,
            description: newEp.description,
          }),
        });
      } catch (err) {
        console.error('Error syncing with /api/episodes:', err);
      }

      await onUpdateProgram(episodesModalProgram.id, {
        episodes: currentEpisodes,
        latestEpisode: newEp.title,
        youtubeId: newEp.youtubeId,
        episodeCount: currentEpisodes.length,
      });

      setEpisodesModalProgram({
        ...episodesModalProgram,
        episodes: currentEpisodes,
        latestEpisode: newEp.title,
        youtubeId: newEp.youtubeId,
        episodeCount: currentEpisodes.length,
      });

      setEpTitle('');
      setEpYoutube('');
      setEpDate('');
      setEpDesc('');
    } finally {
      setSavingEpisode(false);
    }
  };

  const openEditEpisodeModal = (episode: ProgramEpisode, programId: string) => {
    setEditingEpisodeState({ episode, programId });
    setEditEpTitle(episode.title);
    setEditEpYoutube(episode.youtubeId);
    setEditEpDate(episode.date || '');
    setEditEpDesc(episode.description || '');
  };

  const handleSaveEditedEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisodeState || !editEpTitle.trim()) return;

    const cleanYt = extractYouTubeId(editEpYoutube) || editEpYoutube.trim();
    if (!cleanYt) {
      alert('يرجى إدخال رابط أو معرّف فيديو صالح من YouTube');
      return;
    }

    setSavingEditEpisode(true);
    try {
      const { episode, programId } = editingEpisodeState;
      const prog = programs.find(p => p.id === programId);
      if (!prog) return;

      const updatedEpisodes: ProgramEpisode[] = (prog.episodes || []).map(ep => {
        if (ep.id === episode.id) {
          return {
            ...ep,
            title: editEpTitle.trim(),
            youtubeId: cleanYt,
            date: editEpDate.trim(),
            description: editEpDesc.trim(),
          };
        }
        return ep;
      });

      try {
        await fetch(`/api/episodes/${encodeURIComponent(episode.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editEpTitle.trim(),
            youtubeId: cleanYt,
            date: editEpDate.trim(),
            description: editEpDesc.trim(),
          }),
        });
      } catch (err) {
        console.error('Error syncing PUT with /api/episodes:', err);
      }

      const latestEp = updatedEpisodes[0]?.title || '';
      const mainYt = updatedEpisodes[0]?.youtubeId || prog.youtubeId;

      await onUpdateProgram(programId, {
        episodes: updatedEpisodes,
        latestEpisode: latestEp,
        youtubeId: mainYt,
      });

      if (episodesModalProgram && episodesModalProgram.id === programId) {
        setEpisodesModalProgram({
          ...episodesModalProgram,
          episodes: updatedEpisodes,
          latestEpisode: latestEp,
          youtubeId: mainYt,
        });
      }

      setEditingEpisodeState(null);
    } finally {
      setSavingEditEpisode(false);
    }
  };

  const handleDeleteEpisode = async (epId: string, progId?: string) => {
    const targetProgramId = progId || episodesModalProgram?.id;
    if (!targetProgramId) return;

    const prog = programs.find(p => p.id === targetProgramId);
    if (!prog) return;

    if (!confirm('هل أنت متأكد من حذف هذا الفيديو / الحلقة نهائياً؟')) return;

    try {
      await fetch(`/api/episodes/${encodeURIComponent(epId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error syncing delete with /api/episodes:', err);
    }

    const currentEpisodes = (prog.episodes || []).filter(e => e.id !== epId);
    const latestEp = currentEpisodes[0]?.title || '';
    const mainYt = currentEpisodes[0]?.youtubeId || prog.youtubeId;

    await onUpdateProgram(prog.id, {
      episodes: currentEpisodes,
      latestEpisode: latestEp,
      youtubeId: mainYt,
      episodeCount: currentEpisodes.length,
    });

    if (episodesModalProgram && episodesModalProgram.id === prog.id) {
      setEpisodesModalProgram({
        ...episodesModalProgram,
        episodes: currentEpisodes,
        latestEpisode: latestEp,
        youtubeId: mainYt,
        episodeCount: currentEpisodes.length,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>الإنتاج المرئي والبرامج</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#A42424]/10 text-[#A42424] font-semibold">
              {allVideosList.length} فيديو
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة البرامج التلفزيونية، وتصفح وتعديل مكتبة الفيديوهات والحلقات
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'programs'
                  ? 'bg-white dark:bg-[#0c101c] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Film size={13} />
              <span>البرامج ({programs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'videos'
                  ? 'bg-white dark:bg-[#0c101c] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Video size={13} />
              <span>مكتبة الفيديوهات ({allVideosList.length})</span>
            </button>
          </div>

          {canManage && activeTab === 'programs' && (
            <button
              onClick={openAddProgram}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>برنامج جديد</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'programs' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0c101c] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
              لا توجد برامج مضافة بعد
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map(prog => {
                return (
                  <ProgramCard
                    key={prog.id}
                    prog={prog}
                    canManage={canManage}
                    onBrowseEpisodes={setEpisodesModalProgram}
                    onEdit={openEditProgram}
                    onDelete={onDeleteProgram}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'videos' && (
        <VideoLibrary
          programs={programs}
          allVideos={allVideosList}
          canManage={canManage}
          onPreview={setPreviewVideo}
          onEdit={openEditEpisodeModal}
          onDelete={handleDeleteEpisode}
        />
      )}

      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm">
                {editingProgram ? 'تعديل بيانات البرنامج' : 'إضافة برنامج جديد'}
              </h3>
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">اسم البرنامج *</label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: سكوب استقصاء"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">الشعار / العنوان الفرعي</label>
                  <input
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="مثال: ما وراء العناوين"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">مقدم البرنامج *</label>
                  <input
                    required
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    placeholder="اسم الإعلامي أو مقدم البرنامج"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">نبذة عن البرنامج</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="وصف مختصر لطبيعة البرنامج وأهدافه..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              <div className="space-y-2 p-3 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  صورة غلاف البرنامج
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingImage ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                    <span>{isUploadingImage ? 'جارٍ الرفع...' : 'رفع صورة من الجهاز'}</span>
                  </button>
                  {imageUrl && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-mono truncate">
                      <CheckCircle2 size={12} /> تم تعيين الصورة
                    </span>
                  )}
                </div>
                {uploadError && <p className="text-[11px] text-rose-500">{uploadError}</p>}

                <div className="pt-1.5">
                  <label className="block text-[10px] text-slate-400 mb-1">أو اختيار نمط بصري جاهز:</label>
                  <select
                    value={imageType}
                    onChange={e => setImageType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    {EDITORIAL_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingProgram}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  {savingProgram ? 'جارٍ الحفظ...' : editingProgram ? 'حفظ التعديلات' : 'إضافة البرنامج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {episodesModalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-5 text-slate-900 dark:text-white flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>حلقات برنامج: {episodesModalProgram.title}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {episodesModalProgram.episodes?.length || 0} فيديو
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  تصفح الفيديوهات الخاصة بهذا البرنامج وتعديل كل فيديو على حدى
                </p>
              </div>
              <button
                onClick={() => setEpisodesModalProgram(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddEpisode} className="p-3 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800/80 rounded-lg space-y-2 mt-3 text-xs">
              <div className="font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                إضافة فيديو / حلقة جديدة:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  required
                  value={epTitle}
                  onChange={e => setEpTitle(e.target.value)}
                  placeholder="عنوان الحلقة أو الفيديو *"
                  className="px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white"
                />
                <input
                  required
                  value={epYoutube}
                  onChange={e => setEpYoutube(e.target.value)}
                  placeholder="رابط يوتيوب أو معرف الفيديو *"
                  dir="ltr"
                  className="px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-md font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <input
                  value={epDate}
                  onChange={e => setEpDate(e.target.value)}
                  placeholder="التاريخ (مثال: 5 أكتوبر 2026)"
                  className="w-44 px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white"
                />
                <input
                  value={epDesc}
                  onChange={e => setEpDesc(e.target.value)}
                  placeholder="نبذة عن محتوى الفيديو (اختياري)"
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={savingEpisode || !epTitle.trim() || !epYoutube.trim()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold rounded-md disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {savingEpisode ? <RefreshCw size={12} className="animate-spin" /> : 'إضافة'}
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-3 pr-1">
              {(!episodesModalProgram.episodes || episodesModalProgram.episodes.length === 0) ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  لا توجد حلقات مضافة لهذا البرنامج بعد
                </div>
              ) : (
                episodesModalProgram.episodes.map(ep => (
                  <div key={ep.id} className="py-2.5 flex items-center justify-between gap-3 text-xs group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        onClick={() =>
                          setPreviewVideo({
                            title: ep.title,
                            youtubeId: ep.youtubeId,
                          })
                        }
                        className="relative w-16 h-10 bg-slate-900 rounded overflow-hidden shrink-0 cursor-pointer group/thumb"
                      >
                        <Image
                          src={`https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`}
                          alt=""
                          fill
                          sizes="64px"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <Play size={12} fill="white" className="text-white" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {ep.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                          {ep.date && <span>{ep.date}</span>}
                          <span className="font-mono text-[10px]">ID: {ep.youtubeId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          setPreviewVideo({
                            title: ep.title,
                            youtubeId: ep.youtubeId,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="معاينة وتشغيل الفيديو"
                      >
                        <Play size={13} />
                      </button>

                      <button
                        onClick={() => openEditEpisodeModal(ep, episodesModalProgram.id)}
                        className="p-1.5 text-slate-400 hover:text-[#A42424] transition-colors cursor-pointer"
                        title="تعديل بيانات هذه الحلقة"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteEpisode(ep.id, episodesModalProgram.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="حذف هذه الحلقة"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editingEpisodeState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-5 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Edit2 size={13} className="text-[#A42424]" />
                  <span>تعديل بيانات الفيديو / الحلقة</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  قم بتعديل العنوان، رابط اليوتيوب، أو التاريخ والوصف
                </p>
              </div>
              <button
                onClick={() => setEditingEpisodeState(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedEpisode} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">عنوان الفيديو / الحلقة *</label>
                <input
                  required
                  value={editEpTitle}
                  onChange={e => setEditEpTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  رابط يوتيوب أو معرف الفيديو *
                </label>
                <input
                  required
                  value={editEpYoutube}
                  onChange={e => setEditEpYoutube(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">تاريخ النشر</label>
                <input
                  value={editEpDate}
                  onChange={e => setEditEpDate(e.target.value)}
                  placeholder="مثال: 5 أكتوبر 2026"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">نبذة عن الفيديو (اختياري)</label>
                <textarea
                  rows={2}
                  value={editEpDesc}
                  onChange={e => setEditEpDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              {editEpYoutube && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-20 aspect-video rounded overflow-hidden bg-black shrink-0 relative">
                    <Image
                      src={`https://img.youtube.com/vi/${extractYouTubeId(editEpYoutube) || editEpYoutube}/mqdefault.jpg`}
                      alt="Thumbnail Preview"
                      fill
                      sizes="80px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    معاينة صورة الفيديو من YouTube
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEpisodeState(null)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEditEpisode}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  {savingEditEpisode ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewVideo && <VideoPreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />}
    </div>
  );
}
