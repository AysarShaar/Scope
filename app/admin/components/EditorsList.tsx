'use client';

import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  AlertCircle,
  Shield,
  Key,
  Check,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { errorMessage } from '../../../lib/errors';
import {
  ALL_PERMISSIONS,
  PERMISSION_MAP,
  EDITOR_PERMISSIONS,
  EDITOR_IN_CHIEF_PERMISSIONS,
  ADMIN_PERMISSIONS,
  Permission,
} from '../../../lib/permissions';

export interface EditorItem {
  id: string;
  name: string;
  email?: string;
  role: string;
  systemRole?: 'admin' | 'editor_in_chief' | 'editor';
  permissions?: string[];
  avatarUrl?: string;
  createdAt: string;
}

interface Props {
  editors: EditorItem[];
  isLoading: boolean;
  currentUser?: { id?: string | null; email?: string | null };
  currentUserPermissions?: string[];
  onAdd: (data: {
    name: string;
    email?: string;
    role: string;
    avatarUrl?: string;
    systemRole?: string;
    permissions?: string[];
  }) => Promise<{ success: boolean; error?: string } | void>;
  onUpdate: (
    id: string,
    data: Partial<EditorItem> & { permissions?: string[] }
  ) => Promise<{ success: boolean; error?: string } | void>;
  onDelete: (id: string) => Promise<void>;
}

const PERMISSION_GROUPS: {
  title: string;
  keys: Permission[];
}[] = [
  {
    title: 'المقالات والنشر',
    keys: [
      'articles.publish_direct',
      'articles.approve',
      'articles.delete',
      'articles.set_special',
      'articles.edit_any',
    ],
  },
  {
    title: 'المحتوى المباشر والبرامج',
    keys: ['breaking.manage', 'programs.manage', 'settings.live_stream'],
  },
  {
    title: 'الإدارة والتحليلات',
    keys: ['analytics.view', 'editors.manage'],
  },
];

export default function EditorsList({
  editors,
  isLoading,
  currentUser,
  currentUserPermissions,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [systemRole, setSystemRole] = useState<'admin' | 'editor_in_chief' | 'editor'>('editor');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit basic modal
  const [editingEditor, setEditingEditor] = useState<EditorItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Permissions modal
  const [permEditor, setPermEditor] = useState<EditorItem | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [permSaving, setPermSaving] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedRole || !trimmedEmail) return;

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError(
        'صيغة البريد الإلكتروني غير صحيحة، يجب أن يحتوي على اسم المستخدم ورمز @ ونطاق صالح (مثال: name@domain.com)'
      );
      return;
    }

    const isDuplicate = editors.some(
      ed => ed.email && ed.email.trim().toLowerCase() === trimmedEmail
    );
    if (isDuplicate) {
      setFormError('البريد الإلكتروني مستخدم بالفعل');
      return;
    }

    const initialPerms =
      systemRole === 'admin'
        ? [...ADMIN_PERMISSIONS]
        : systemRole === 'editor_in_chief'
        ? [...EDITOR_IN_CHIEF_PERMISSIONS]
        : [...EDITOR_PERMISSIONS];

    setSaving(true);
    try {
      const res = await onAdd({
        name: trimmedName,
        email: trimmedEmail,
        role: trimmedRole,
        avatarUrl: avatarUrl.trim() || undefined,
        permissions: initialPerms,
      });

      if (res && !res.success) {
        setFormError(res.error || 'البريد الإلكتروني مستخدم بالفعل');
        return;
      }

      setName('');
      setEmail('');
      setRole('');
      setAvatarUrl('');
      setSystemRole('editor');
      setFormError(null);
    } catch (err: unknown) {
      setFormError(errorMessage(err) || 'حدث خطأ أثناء إضافة المحرر');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (editor: EditorItem) => {
    setEditingEditor(editor);
    setEditName(editor.name || '');
    setEditEmail(editor.email || '');
    setEditRole(editor.role || '');
    setEditAvatarUrl(editor.avatarUrl || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingEditor || !editName.trim() || !editRole.trim()) return;

    const trimmedEmail = editEmail.trim().toLowerCase();
    if (trimmedEmail) {
      const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setEditError(
          'صيغة البريد الإلكتروني غير صحيحة، يجب أن يحتوي على اسم المستخدم ورمز @ ونطاق صالح (مثال: name@domain.com)'
        );
        return;
      }

      const isDuplicate = editors.some(
        ed =>
          ed.id !== editingEditor.id &&
          ed.email &&
          ed.email.trim().toLowerCase() === trimmedEmail
      );
      if (isDuplicate) {
        setEditError('البريد الإلكتروني مستخدم بالفعل');
        return;
      }
    }

    setUpdating(true);
    try {
      // Do NOT send systemRole to server: systemRole is derived strictly on server from permissions
      const res = await onUpdate(editingEditor.id, {
        name: editName.trim(),
        email: trimmedEmail || undefined,
        role: editRole.trim(),
        avatarUrl: editAvatarUrl.trim() || undefined,
      });

      if (res && !res.success) {
        setEditError(res.error || 'فشل تحديث البيانات');
        return;
      }

      setEditingEditor(null);
      setEditError(null);
    } catch (err: unknown) {
      setEditError(errorMessage(err) || 'حدث خطأ أثناء تحديث المحرر');
    } finally {
      setUpdating(false);
    }
  };

  const openPermModal = (editor: EditorItem) => {
    setPermEditor(editor);
    let currentPerms: Permission[] = [];
    if (Array.isArray(editor.permissions)) {
      currentPerms = editor.permissions.filter((p): p is Permission =>
        ALL_PERMISSIONS.includes(p as Permission)
      );
    } else if (editor.systemRole === 'admin') {
      currentPerms = [...ADMIN_PERMISSIONS];
    } else if (editor.systemRole === 'editor_in_chief') {
      currentPerms = [...EDITOR_IN_CHIEF_PERMISSIONS];
    } else {
      currentPerms = [...EDITOR_PERMISSIONS];
    }
    setSelectedPermissions(currentPerms);
    setPermError(null);
  };

  const togglePermission = (key: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const applyPreset = (preset: 'editor' | 'editor_in_chief' | 'admin') => {
    if (preset === 'editor') {
      setSelectedPermissions([...EDITOR_PERMISSIONS]);
    } else if (preset === 'editor_in_chief') {
      setSelectedPermissions([...EDITOR_IN_CHIEF_PERMISSIONS]);
    } else if (preset === 'admin') {
      setSelectedPermissions([...ADMIN_PERMISSIONS]);
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permEditor) return;
    setPermSaving(true);
    setPermError(null);

    try {
      const res = await onUpdate(permEditor.id, {
        permissions: selectedPermissions,
      });

      if (res && !res.success) {
        setPermError(res.error || 'فشل حفظ الصلاحيات');
        return;
      }

      setPermEditor(null);
    } catch (err: unknown) {
      setPermError(errorMessage(err) || 'حدث خطأ أثناء حفظ الصلاحيات');
    } finally {
      setPermSaving(false);
    }
  };

  const isSelf = (editorId: string) => {
    return currentUser?.id === editorId;
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          فريق العمل والتحرير
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          إدارة الصلاحيات وحسابات هيئة التحرير ({editors.length})
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3"
      >
        {formError && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">الاسم بالكامل *</label>
            <input
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="الاسم الثلاثي..."
              required
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">البريد الإلكتروني (Google) *</label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="account@gmail.com"
              dir="ltr"
              required
              className={`w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border ${
                formError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } rounded-lg text-xs font-mono text-left text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors`}
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">المسمى الصحفي *</label>
            <input
              value={role}
              onChange={e => {
                setRole(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="مثال: محرر الشؤون السياسية"
              required
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">القالب الابتدائي للصلاحيات *</label>
            <select
              value={systemRole}
              onChange={e => setSystemRole(e.target.value as typeof systemRole)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="editor">محرر (نشر معلق للمراجعة)</option>
              <option value="editor_in_chief">رئيس تحرير (نشر مباشر واعتماد)</option>
              <option value="admin">مدير نظام (كامل الصلاحيات)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="رابط الصورة الشخصية (اختياري)..."
            dir="ltr"
            className="w-72 px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
          />

          <button
            type="submit"
            disabled={saving || !name.trim() || !role.trim() || !email.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            <span>إضافة العضو</span>
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <RefreshCw size={18} className="animate-spin" />
        </div>
      ) : editors.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#0c101c] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs">
          لا يوجد أعضاء مسجلين
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-4 py-2.5 font-medium">العضو</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">البريد الإلكتروني</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">المسمى</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">الدور المرجعي</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">الصلاحيات الفردية</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {editors.map(editor => {
                  const sRole = editor.systemRole || 'editor';
                  const roleLabel =
                    sRole === 'admin'
                      ? 'مدير نظام'
                      : sRole === 'editor_in_chief'
                      ? 'رئيس تحرير'
                      : 'محرر';

                  const permsCount = Array.isArray(editor.permissions)
                    ? editor.permissions.length
                    : sRole === 'admin'
                    ? ADMIN_PERMISSIONS.length
                    : sRole === 'editor_in_chief'
                    ? EDITOR_IN_CHIEF_PERMISSIONS.length
                    : 0;

                  const isCurrentUser = isSelf(editor.id);

                  return (
                    <tr
                      key={editor.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {editor.avatarUrl ? (
                            <Image
                              src={editor.avatarUrl}
                              alt={editor.name}
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                              {editor.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 block">
                              {editor.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                (حسابك الحالي)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td
                        className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400"
                        dir="ltr"
                      >
                        {editor.email || '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {editor.role}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            sRole === 'admin'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                              : sRole === 'editor_in_chief'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                              : 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openPermModal(editor)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-xs font-semibold cursor-pointer"
                          title="تعديل الصلاحيات الفردية"
                        >
                          <Shield size={12} className="text-[#A42424]" />
                          <span>{permsCount} / 10 صلاحيات</span>
                        </button>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openPermModal(editor)}
                            className="p-1.5 text-slate-500 hover:text-[#A42424] transition-colors cursor-pointer"
                            title="إدارة الصلاحيات"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(editor)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="تعديل البيانات الأساسية"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDelete(editor.id)}
                            disabled={isCurrentUser}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrentUser ? 'لا يمكنك حذف حسابك بنفسك' : 'حذف العضو'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#A42424] flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    إدارة الصلاحيات الفردية: {permEditor.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {permEditor.email || 'بدون بريد'} • المسمى: {permEditor.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermEditor(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {permError && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{permError}</span>
              </div>
            )}

            {isSelf(permEditor.id) && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 dark:amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  أنت تعدل حسابك الخاص. منع تصعيد الصلاحيات يمنعك من تعديل صلاحياتك بنفسك. اطلب من مدير آخر أو مدير الطوارئ إجراء التعديل.
                </span>
              </div>
            )}

            {/* Quick Presets Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  قوالب سريعة جاهزة:
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  المحدد: {selectedPermissions.length} من {ALL_PERMISSIONS.length} صلاحيات
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSelf(permEditor.id)}
                  onClick={() => applyPreset('editor')}
                  className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  قالب محرر (فارغ - إرسال للمراجعة فقط)
                </button>
                <button
                  type="button"
                  disabled={isSelf(permEditor.id)}
                  onClick={() => applyPreset('editor_in_chief')}
                  className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  قالب رئيس تحرير (8 صلاحيات تحريرية وبث)
                </button>
                <button
                  type="button"
                  disabled={isSelf(permEditor.id)}
                  onClick={() => applyPreset('admin')}
                  className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  قالب مدير نظام (كامل الصلاحيات الـ 10)
                </button>
              </div>
            </div>

            {/* Permissions Checkbox Groups */}
            <form onSubmit={handleSavePermissions} className="space-y-4">
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.title} className="pt-3 first:pt-0 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {group.title}
                    </h4>
                    <div className="space-y-1.5">
                      {group.keys.map(key => {
                        const def = PERMISSION_MAP[key];
                        const isChecked = selectedPermissions.includes(key);
                        const disabled = isSelf(permEditor.id);

                        return (
                          <label
                            key={key}
                            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700'
                                : 'bg-transparent border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={disabled}
                              onChange={() => togglePermission(key)}
                              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[#A42424] focus:ring-[#A42424] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {def.label}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({key})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {def.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">
                  تسري الصلاحيات فوراً في قاعدة البيانات وسجل التدقيق.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPermEditor(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={permSaving || isSelf(permEditor.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#A42424] hover:bg-[#8e1f1f] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    {permSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>حفظ الصلاحيات</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Basic Data Modal */}
      {editingEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm">تعديل بيانات المحرر الأساسية</h3>
              <button
                onClick={() => setEditingEditor(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              {editError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-500 mb-1">الاسم بالكامل *</label>
                <input
                  required
                  value={editName}
                  onChange={e => {
                    setEditName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">البريد الإلكتروني (Google) *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => {
                    setEditEmail(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  dir="ltr"
                  className={`w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border ${
                    editError ? 'border-rose-500 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } rounded-lg font-mono text-left text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600`}
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">المسمى الصحفي / الوظيفي *</label>
                <input
                  required
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">رابط الصورة الشخصية</label>
                <input
                  value={editAvatarUrl}
                  onChange={e => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEditor(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  {updating ? <RefreshCw size={12} className="animate-spin" /> : null}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
