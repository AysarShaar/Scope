'use client';
import { Plus, Trash2, Edit2, RefreshCw, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { errorMessage } from '../../../lib/errors';

export interface EditorItem {
  id: string;
  name: string;
  email?: string;
  role: string;
  systemRole?: 'admin' | 'editor_in_chief' | 'editor';
  avatarUrl?: string;
  createdAt: string;
}

interface Props {
  editors: EditorItem[];
  isLoading: boolean;
  onAdd: (data: {
    name: string;
    email?: string;
    role: string;
    avatarUrl?: string;
    systemRole: string;
  }) => Promise<{ success: boolean; error?: string } | void>;
  onUpdate: (id: string, data: Partial<EditorItem>) => Promise<{ success: boolean; error?: string } | void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EditorsList({ editors, isLoading, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [systemRole, setSystemRole] = useState<'admin' | 'editor_in_chief' | 'editor'>('editor');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingEditor, setEditingEditor] = useState<EditorItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editSystemRole, setEditSystemRole] = useState<'admin' | 'editor_in_chief' | 'editor'>('editor');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedRole || !trimmedEmail) return;

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setFormError('صيغة البريد الإلكتروني غير صحيحة، يجب أن يحتوي على اسم المستخدم ورمز @ ونطاق صالح (مثال: name@domain.com)');
      return;
    }

    const isDuplicate = editors.some(
      ed => ed.email && ed.email.trim().toLowerCase() === trimmedEmail
    );
    if (isDuplicate) {
      setFormError('البريد الإلكتروني مستخدم بالفعل');
      return;
    }

    setSaving(true);
    try {
      const res = await onAdd({
        name: trimmedName,
        email: trimmedEmail,
        role: trimmedRole,
        avatarUrl: avatarUrl.trim() || undefined,
        systemRole,
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
    setEditSystemRole(editor.systemRole || 'editor');
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
        setEditError('صيغة البريد الإلكتروني غير صحيحة، يجب أن يحتوي على اسم المستخدم ورمز @ ونطاق صالح (مثال: name@domain.com)');
        return;
      }

      const isDuplicate = editors.some(
        ed => ed.id !== editingEditor.id && ed.email && ed.email.trim().toLowerCase() === trimmedEmail
      );
      if (isDuplicate) {
        setEditError('البريد الإلكتروني مستخدم بالفعل');
        return;
      }
    }

    setUpdating(true);
    try {
      const res = await onUpdate(editingEditor.id, {
        name: editName.trim(),
        email: trimmedEmail || undefined,
        role: editRole.trim(),
        avatarUrl: editAvatarUrl.trim() || undefined,
        systemRole: editSystemRole,
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
            <label className="block text-[11px] text-slate-500 mb-1">مستوى الصلاحية *</label>
            <select
              value={systemRole}
              onChange={e => setSystemRole(e.target.value as typeof systemRole)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors cursor-pointer"
            >
              <option value="editor">محرر (نشر معلق للمراجعة)</option>
              <option value="editor_in_chief">رئيس تحرير (نشر واعتماد مباشر)</option>
              <option value="admin">مدير نظام Admin (كامل الصلاحيات)</option>
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
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">الصلاحية</th>
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

                  return (
                    <tr key={editor.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
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
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {editor.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                        {editor.email || '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {editor.role}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          sRole === 'admin'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            : sRole === 'editor_in_chief'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        }`}>
                          {roleLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(editor)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="تعديل بيانات المحرر"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDelete(editor.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف العضو"
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

      {editingEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-5 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm">تعديل بيانات المحرر</h3>
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
                <label className="block text-slate-500 mb-1">مستوى الصلاحية *</label>
                <select
                  value={editSystemRole}
                  onChange={e => setEditSystemRole(e.target.value as typeof editSystemRole)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 cursor-pointer"
                >
                  <option value="editor">محرر (نشر معلق للمراجعة)</option>
                  <option value="editor_in_chief">رئيس تحرير (نشر واعتماد مباشر)</option>
                  <option value="admin">مدير نظام Admin (كامل الصلاحيات)</option>
                </select>
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
