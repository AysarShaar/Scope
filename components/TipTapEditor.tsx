'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Link2,
  Image as ImageIcon,
  Code,
  Undo2,
  Redo2,
  RefreshCw,
} from 'lucide-react';
import { prepareImageForUpload } from '../lib/prepareImageForUpload';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
  titleHint?: string;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg text-xs md:text-sm transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
      isActive
        ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 font-bold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);

const Divider = () => (
  <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 self-center" />
);

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'ابدأ الكتابة...',
  dir = 'rtl',
  className = '',
  titleHint = '',
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'tiptap-link' } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: false }),
    ],
    content,
    editorProps: {
      attributes: {
        dir,
        class: 'tiptap-editor-body focus:outline-none',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('رابط URL:', prev);
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const isSafeProtocol = /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed);
    if (!isSafeProtocol) {
      alert('الرابط غير صالح. يرجى إدخال رابط يبدأ بـ https:// أو http://');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }, [editor]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة يجب ألا يتجاوز 10 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', await prepareImageForUpload(file));
      if (titleHint && titleHint.trim()) {
        formData.append('title', titleHint.trim());
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && (data?.url || data?.secure_url)) {
        editor.chain().focus().setImage({ src: data.url || data.secure_url }).run();
      } else {
        alert(data?.error || 'فشل رفع الصورة');
      }
    } catch {
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addImage = useCallback(() => {
    if (!editor) return;
    fileInputRef.current?.click();
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;
  const wordCount = editor.storage.characterCount?.words() ?? 0;

  return (
    <div className={`w-full flex flex-col bg-white dark:bg-[#0d1221] text-slate-800 dark:text-slate-100 transition-colors duration-200 ${className}`}>
      <div className="flex flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto no-scrollbar max-sm:[&>*]:shrink-0 items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#111728]/90 backdrop-blur-xs transition-colors duration-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="غامق (Ctrl+B)"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="مائل (Ctrl+I)"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="تسطير (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="تظليل"
        >
          <Highlighter size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="عنوان رئيسي 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="عنوان فرعي 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="عنوان فرعي 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="قائمة نقطية"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="قائمة مرقمة"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="اقتباس متميز"
        >
          <Quote size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="محاذاة يمين"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="محاذاة وسط"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="محاذاة يسار"
        >
          <AlignLeft size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="إدراج أو تعديل رابط"
        >
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          disabled={isUploading}
          isActive={false}
          title="رفع وإدراج صورة من جهازك"
        >
          {isUploading ? <RefreshCw size={16} className="animate-spin text-rose-500" /> : <ImageIcon size={16} />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={handleUploadImage}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="رمز أو كود"
        >
          <Code size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="تراجع (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="إعادة (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </ToolbarButton>
      </div>

      {editor && editor.isActive('link') && (
        <div className="bg-white dark:bg-[#161d31] border border-slate-200 dark:border-slate-700/80 rounded-xl p-2 px-3 flex items-center gap-3 text-xs shadow-xl z-50 fixed backdrop-blur-md">
          <button
            type="button"
            onClick={setLink}
            className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
          >
            تعديل الرابط
          </button>
          <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            إزالة
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-end gap-5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-[#0c101d] transition-colors duration-200">
        <span>{wordCount} كلمة</span>
        <span>{charCount} حرف</span>
      </div>

      <style>{`
        .tiptap-editor-body {
          min-height: 280px;
          max-height: 560px;
          overflow-y: auto;
          padding: 18px 22px;
          outline: none;
          color: #1e293b;
          background-color: transparent;
          font-size: 15.5px;
          line-height: 1.85;
          font-family: var(--font-readex-pro), 'Readex Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          direction: rtl;
          transition: color 0.2s ease;
          word-spacing: -0.03em !important;
          letter-spacing: 0 !important;
          text-align: start !important;
          font-weight: 400 !important;
        }

        .tiptap-editor-body *,
        .tiptap-editor-body p {
          font-family: var(--font-readex-pro), 'Readex Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          word-spacing: -0.03em !important;
          letter-spacing: 0 !important;
          font-weight: 400 !important;
        }

        .tiptap-editor-body h1,
        .tiptap-editor-body h2,
        .tiptap-editor-body h3,
        .tiptap-editor-body strong,
        .tiptap-editor-body b,
        .tiptap-editor-body blockquote {
          font-family: var(--font-readex-pro), 'Readex Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 600 !important;
        }

        /* Dark mode support */
        .dark .tiptap-editor-body {
          color: #e2e8f0;
        }

        .tiptap-editor-body h1 {
          font-size: 1.85em;
          font-weight: 600;
          margin: 1.1em 0 0.4em;
          color: #0f172a;
          line-height: 1.3;
        }
        .dark .tiptap-editor-body h1 {
          color: #f8fafc;
        }

        .tiptap-editor-body h2 {
          font-size: 1.45em;
          font-weight: 600;
          margin: 1em 0 0.35em;
          color: #1e293b;
          line-height: 1.35;
        }
        .dark .tiptap-editor-body h2 {
          color: #f1f5f9;
        }

        .tiptap-editor-body h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin: 0.9em 0 0.3em;
          color: #334155;
        }
        .dark .tiptap-editor-body h3 {
          color: #e2e8f0;
        }

        .tiptap-editor-body p {
          font-weight: 400;
          margin: 0.6em 0;
        }

        .tiptap-editor-body blockquote {
          margin: 1.4em 0;
          padding: 0.2em 1em;
          border-inline-start: 4px solid #A42424;
          background: none;
          border-radius: 0;
          font-style: normal;
          font-weight: 600;
          font-size: 1.1em;
          line-height: 1.65;
          color: #0F4468;
          text-align: start !important;
          word-spacing: normal !important;
          letter-spacing: normal !important;
        }
        .tiptap-editor-body blockquote p {
          margin: 0;
          text-align: start !important;
          word-spacing: normal !important;
          letter-spacing: normal !important;
        }
        .dark .tiptap-editor-body blockquote {
          background: none;
          color: #7dd3fc;
        }

        .tiptap-editor-body ul, .tiptap-editor-body ol {
          padding-inline-start: 24px;
          margin: 10px 0;
        }
        .tiptap-editor-body ul {
          list-style-type: disc;
        }
        .tiptap-editor-body ol {
          list-style-type: decimal;
        }
        .tiptap-editor-body li {
          margin: 5px 0;
        }
        .tiptap-editor-body ul li::marker {
          color: #A42424;
        }
        .tiptap-editor-body ol li::marker {
          color: #A42424;
          font-weight: 700;
          font-size: 1.15em;
        }
        .dark .tiptap-editor-body ul li::marker {
          color: #E05252;
        }
        .dark .tiptap-editor-body ol li::marker {
          color: #E05252;
          font-weight: 700;
          font-size: 1.15em;
        }

        .tiptap-editor-body code {
          background: rgba(225, 29, 72, 0.08);
          color: #A42424;
          padding: 2px 6px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .dark .tiptap-editor-body code {
          background: rgba(225, 29, 72, 0.15);
          color: #fb7185;
        }

        .tiptap-editor-body pre {
          background: #f8fafc;
          color: #1e293b;
          padding: 16px;
          border-radius: 10px;
          overflow-x: auto;
          margin: 12px 0;
          border: 1px solid #e2e8f0;
        }
        .dark .tiptap-editor-body pre {
          background: #070b14;
          color: #e2e8f0;
          border-color: #1e293b;
        }

        .tiptap-editor-body a.tiptap-link {
          color: #A42424;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .dark .tiptap-editor-body a.tiptap-link {
          color: #fb7185;
        }

        .tiptap-editor-body img {
          max-width: 100%;
          border-radius: 10px;
          margin: 12px 0;
        }

        .tiptap-editor-body mark {
          background: rgba(251, 191, 36, 0.3);
          color: #78350f;
          border-radius: 4px;
          padding: 1px 4px;
        }
        .dark .tiptap-editor-body mark {
          background: rgba(251, 191, 36, 0.25);
          color: #fde68a;
        }

        .tiptap-editor-body p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .dark .tiptap-editor-body p.is-editor-empty:first-child::before {
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
