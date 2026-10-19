'use client';
import { X, RefreshCw, Send, Sun, Moon, Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { TipTapEditor } from '../../../components/TipTapEditor';
import { ScopeArticle } from '../../../data/scopeData';
import { EditorItem } from './EditorsList';
import { formatArabicDate, isFutureDate } from '../../../lib/dates';
import { htmlToContentArray, contentArrayToHtml } from '../lib/articleHtml';
import { useImageUpload } from '../hooks/useImageUpload';
import { ArticleDatePicker } from './ArticleDatePicker';
import { useTheme } from '../../../context/ThemeContext';

const CATEGORIES = [
  { slug: 'news', labelAr: 'أخبار عامة', color: 'red' },
  { slug: 'economy', labelAr: 'اقتصاد', color: 'blue' },
  { slug: 'society', labelAr: 'مجتمع', color: 'blue' },
  { slug: 'culture', labelAr: 'ثقافة', color: 'blue' },
  { slug: 'science', labelAr: 'علوم', color: 'blue' },
  { slug: 'investigations', labelAr: 'تحقيقات', color: 'red' },
];

const EDITORIAL_THEMES = [
  { id: 'anchor_studio', label: 'استوديو الأخبار الرئيسي' },
  { id: 'diplomats_meeting', label: 'تغطيات سياسية ودبلوماسية' },
  { id: 'skyline_sunset', label: 'اقتصاد وأسواق المال' },
  { id: 'deep_investigation', label: 'تحقيقات استقصائية خاصة' },
  { id: 'youth_future', label: 'تكنولوجيا وابتكار رقمي' },
  { id: 'world_flags', label: 'شؤون وقضايا دولية' },
  { id: 'colosseum_history', label: 'ثقافة وتراث إنساني' },
];

import { can } from '../../../lib/permissions';

interface Props {
  article: ScopeArticle | null;
  editors?: EditorItem[];
  onSave: (data: Partial<ScopeArticle>) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  userRole: 'admin' | 'editor_in_chief' | 'editor';
  permissions?: string[];
  currentEditorId: string | null;
}

const inputClass =
  'w-full px-3 py-2 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs max-sm:text-base max-sm:py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors';

export default function ArticleEditor({
  article,
  editors = [],
  onSave,
  onClose,
  isLoading,
  userRole,
  permissions,
  currentEditorId,
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const isNew = !article;
  const defaultDate = formatArabicDate(new Date());
  const initialEditor = editors.find(e => e.name === article?.author?.name) || null;
  const currentLoggedEditor = editors.find(e => e.id === currentEditorId) || null;

  const [selectedEditorId, setSelectedEditorId] = useState<string>(() => {
    if (initialEditor) return initialEditor.id;
    if (article?.author?.name) {
      if (
        article.author.name === 'فريق تحرير SCOPE' ||
        article.author.name === 'فريق تحرير SCOPE MEDIA'
      ) {
        return '';
      }
      return 'custom';
    }
    // New article defaults to '' (الافتراضي: اختيار من الفريق)
    return '';
  });

  const [title, setTitle] = useState(article?.title || '');
  const [subtitle, setSubtitle] = useState(article?.subtitle || '');
  const [catSlug, setCatSlug] = useState<string>(article?.categorySlug || 'news');
  const [authorName, setAuthorName] = useState(() => {
    if (initialEditor) return initialEditor.name;
    return article?.author?.name || 'فريق تحرير SCOPE';
  });
  const [authorRole, setAuthorRole] = useState(() => {
    if (initialEditor) return initialEditor.role;
    return article?.author?.role || 'هيئة التحرير';
  });
  const [date, setDate] = useState(() => {
    const raw = article?.date || defaultDate;
    return isFutureDate(raw) ? defaultDate : raw;
  });
  const [imageType, setImageType] = useState<string>(article?.imageType || 'anchor_studio');
  const [imageUrl, setImageUrl] = useState(article?.imageUrl || '');
  const [caption, setCaption] = useState(article?.caption || '');
  const [status, setStatus] = useState<string>(article?.status || 'published');
  const [isSpecial, setIsSpecial] = useState<boolean>(Boolean(article?.isSpecial));
  const [htmlContent, setHtmlContent] = useState(() => contentArrayToHtml(article?.content));

  const [attachedImageSlug, setAttachedImageSlug] = useState<string>('');

  const { isUploadingImage, uploadError, setUploadError, fileInputRef, handleFileUpload } = useImageUpload(
    (url, key) => {
      setImageUrl(url);
      if (key) {
        const baseName = key.split('/').pop()?.replace(/\.[^.]+$/, '');
        if (baseName) setAttachedImageSlug(baseName);
      }
    },
    {
      getTitle: () => title,
    },
  );

  const canPublishDirectly =
    permissions !== undefined
      ? can({ permissions }, 'articles.publish_direct')
      : userRole === 'admin' || userRole === 'editor_in_chief';

  const canSetSpecial =
    permissions !== undefined
      ? can({ permissions }, 'articles.set_special')
      : canPublishDirectly;

  const handleEditorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEditorId(val);
    if (val === 'custom') {
      setAuthorName('');
      setAuthorRole('');
      return;
    }
    if (!val) {
      setAuthorName('فريق تحرير SCOPE');
      setAuthorRole('هيئة التحرير');
      return;
    }
    const ed = editors.find(x => x.id === val);
    if (ed) {
      setAuthorName(ed.name);
      setAuthorRole(ed.role);
    }
  };

  const handleQuickAuthorChoice = (choice: 'self' | 'team') => {
    if (choice === 'self' && currentLoggedEditor) {
      setSelectedEditorId(currentLoggedEditor.id);
      setAuthorName(currentLoggedEditor.name);
      setAuthorRole(currentLoggedEditor.role);
    } else {
      setSelectedEditorId('');
      setAuthorName('فريق تحرير SCOPE');
      setAuthorRole('هيئة التحرير');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const cat = CATEGORIES.find(c => c.slug === catSlug) || CATEGORIES[0];
    const contentArray = htmlToContentArray(htmlContent);

    let editorId: string | undefined =
      selectedEditorId && selectedEditorId !== 'custom' ? selectedEditorId : undefined;
    let authorAvatar: string | undefined;

    if (selectedEditorId && selectedEditorId !== 'custom') {
      const ed = editors.find(x => x.id === selectedEditorId);
      if (ed) {
        editorId = ed.id;
        authorAvatar = ed.avatarUrl;
      }
    } else if (currentLoggedEditor && !canPublishDirectly) {
      editorId = currentLoggedEditor.id;
    }

    const finalAuthorName = authorName.trim() || 'فريق تحرير SCOPE';
    const finalAuthorRole = authorRole.trim() || 'هيئة التحرير';

    let finalDate = date.trim() || defaultDate;
    if (isFutureDate(finalDate)) {
      finalDate = defaultDate;
    }

    await onSave({
      id: isNew && attachedImageSlug ? attachedImageSlug : article?.id,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category: cat.labelAr,
      categorySlug: catSlug as ScopeArticle['categorySlug'],
      date: finalDate,
      author: { name: finalAuthorName, role: finalAuthorRole },
      authorAvatar,
      editorId,
      content: contentArray.length > 0 ? contentArray : [title.trim()],
      imageType: imageType as ScopeArticle['imageType'],
      imageUrl: imageUrl.trim() || undefined,
      caption: caption.trim() || undefined,
      status: canPublishDirectly ? status : 'pending',
      isSpecial: canPublishDirectly ? isSpecial : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-3xl h-full max-sm:h-dvh bg-white dark:bg-[#0c101c] border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0c101c]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {isNew ? (canPublishDirectly ? 'تحرير مادة جديدة' : 'مقال جديد (للمراجعة)') : 'تعديل المادة'}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="max-sm:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !title.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 max-sm:py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              <span>
                {isNew
                  ? canPublishDirectly
                    ? status === 'published'
                      ? 'نشر'
                      : 'حفظ'
                    : 'إرسال للمراجعة'
                  : <><span className="max-sm:hidden">حفظ التعديلات</span><span className="sm:hidden">حفظ</span></>}
              </span>
            </button>

            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-1.5 max-sm:p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-4">
          <div className="space-y-2">
            <input
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-sm max-sm:text-base max-sm:py-2.5 font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="عنوان المادة الصحفية..."
              autoFocus={isNew && typeof window !== 'undefined' && window.innerWidth >= 640}
            />
            <input
              className={inputClass}
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="عنوان فرعي (اختياري)..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">القسم</label>
              <select
                className={inputClass}
                value={catSlug}
                onChange={e => setCatSlug(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.slug} value={c.slug}>{c.labelAr}</option>
                ))}
              </select>
            </div>

            <ArticleDatePicker value={date} onChange={setDate} inputClass={inputClass} />

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">الحالة</label>
              {canPublishDirectly ? (
                <select
                  className={inputClass}
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="published">منشور</option>
                  <option value="pending">قيد المراجعة</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium">
                  قيد المراجعة
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الكاتب / المحرر المسؤول
              </label>
              {currentLoggedEditor && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAuthorChoice('team')}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer border ${
                      !selectedEditorId
                        ? 'bg-[#0F4468] text-white border-[#0F4468] font-bold shadow-2xs'
                        : 'bg-white dark:bg-[#121624] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    الافتراضي (اختيار من الفريق)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAuthorChoice('self')}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer border ${
                      selectedEditorId === currentLoggedEditor.id
                        ? 'bg-[#0F4468] text-white border-[#0F4468] font-bold shadow-2xs'
                        : 'bg-white dark:bg-[#121624] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    اسمي ({currentLoggedEditor.name})
                  </button>
                </div>
              )}
            </div>

            <div className={selectedEditorId === 'custom' && canPublishDirectly ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : ''}>
              <div>
                <select
                  className={inputClass}
                  value={selectedEditorId}
                  onChange={handleEditorSelect}
                >
                  <option value="">اختيار من الفريق (الافتراضي: فريق تحرير SCOPE)</option>
                  {currentLoggedEditor && (
                    <option value={currentLoggedEditor.id}>
                      اسمي: {currentLoggedEditor.name} ({currentLoggedEditor.role}) - حسابك الحالي
                    </option>
                  )}
                  {editors
                    .filter(e => e.id !== currentLoggedEditor?.id)
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  {canPublishDirectly && <option value="custom">إدخال مخصص</option>}
                </select>
              </div>

              {canPublishDirectly && selectedEditorId === 'custom' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-1">الاسم</label>
                    <input
                      className={inputClass}
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-1">الصفة</label>
                    <input
                      className={inputClass}
                      value={authorRole}
                      onChange={e => setAuthorRole(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
              {selectedEditorId === currentLoggedEditor?.id ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ سيُنشر المقال باسمك: {currentLoggedEditor.name} ({currentLoggedEditor.role})
                </span>
              ) : !selectedEditorId ? (
                <span>
                  الافتراضي: سيُنشر المقال باسم &quot;فريق تحرير SCOPE&quot;
                </span>
              ) : selectedEditorId !== 'custom' ? (
                <span>
                  سيُنشر المقال باسم: {authorName} ({authorRole})
                </span>
              ) : null}
            </div>
          </div>

          {canPublishDirectly && (
            <label className="flex items-start gap-3 p-3 max-sm:py-3.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={e => setIsSpecial(e.target.checked)}
                className="mt-0.5 w-4 h-4 max-sm:w-5 max-sm:h-5 shrink-0 accent-[#A42424] cursor-pointer"
              />
              <span className="min-w-0">
                <span className="block text-xs max-sm:text-sm font-bold text-slate-900 dark:text-white">
                  تمييز كتغطية خاصة
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  يظهر في المربع الطويل بالصفحة الرئيسية. يُعرض أحدث مقال منشور مميّز.
                </span>
              </span>
            </label>
          )}

          <div className="space-y-3 sm:p-4 sm:bg-slate-50/80 sm:dark:bg-[#121624]/60 sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:rounded-xl">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-rose-600 dark:text-rose-400" />
              <span className="sm:hidden">الصورة</span>
              <span className="max-sm:hidden">صورة ومحتوى الوسائط للمادة</span>
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                صورة الغلاف الرئيسية
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-4 py-2 max-sm:py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {isUploadingImage ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>جاري الرفع السحابي...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>رفع صورة من جهازك</span>
                    </>
                  )}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="أو ضع رابط صورة مباشر (https://...)"
                    dir="ltr"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="مسح الصورة"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {imageUrl && (
                <div className="mt-3 relative w-full sm:w-64 h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 group">
                  <Image
                    src={imageUrl}
                    alt="معاينة صورة الغلاف"
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    className="object-cover"
                    onError={() => setUploadError('تعذر تحميل الصورة من الرابط المحدد')}
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    معاينة الغلاف
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">الخلفية البصرية التحريرية الافتراضية</label>
                <select
                  className={inputClass}
                  value={imageType}
                  onChange={e => setImageType(e.target.value)}
                >
                  {EDITORIAL_THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">تعليق ومصدر الصورة</label>
            <input
              className={inputClass}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="وصف مختصر ومصدر الصورة..."
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">نص المادة</label>
            <div className="min-h-[300px] sm:min-h-[360px] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#121624]">
              <TipTapEditor
                content={htmlContent}
                onChange={setHtmlContent}
                placeholder="اكتب المحتوى هنا..."
                titleHint={title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
