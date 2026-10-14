'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAdmin } from '../components/AdminShell';
import type { EditorItem } from '../components/EditorsList';
import { errorMessage } from '../../../lib/errors';

const EditorsList = dynamic(() => import('../components/EditorsList'), { ssr: false });

export default function AdminEditorsPage() {
  const { userRole, showToast, refreshProfile } = useAdmin();
  const [editors, setEditors] = useState<EditorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEditors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/editors');
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success && Array.isArray(j.data)) {
        setEditors(j.data);
      }
    } catch {
      showToast('تعذّر تحميل قائمة المحررين', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEditors();
  }, [loadEditors]);

  if (userRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          هذه الصفحة مخصصة لمدير النظام فقط.
        </p>
      </div>
    );
  }

  const handleAddEditor = async (data: {
    name: string;
    email?: string;
    role: string;
    avatarUrl?: string;
    systemRole: string;
  }) => {
    try {
      const res = await fetch('/api/editors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.success) {
        showToast('تمت إضافة المحرر بنجاح ✓', 'success');
        loadEditors();
        refreshProfile();
        return { success: true };
      } else {
        const errorMsg = j.error || 'فشلت إضافة المحرر';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    } catch (e: unknown) {
      const errorMsg = errorMessage(e) || 'فشلت العملية';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  const handleUpdateEditor = async (id: string, data: Partial<EditorItem>) => {
    try {
      const res = await fetch(`/api/editors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.success) {
        showToast('تم تحديث بيانات المحرر بنجاح ✓', 'success');
        loadEditors();
        refreshProfile();
        return { success: true };
      } else {
        const errorMsg = j.error || 'فشل التحديث';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    } catch (e: unknown) {
      const errorMsg = errorMessage(e) || 'فشلت العملية';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  const handleDeleteEditor = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحرر؟')) return;
    const res = await fetch(`/api/editors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      setEditors((p) => p.filter((e) => e.id !== id));
      showToast('تم حذف المحرر بنجاح ✓', 'success');
      refreshProfile();
    } else {
      showToast(j.error || 'فشل حذف المحرر', 'error');
    }
  };

  return (
    <EditorsList
      editors={editors}
      isLoading={isLoading}
      onAdd={handleAddEditor}
      onUpdate={handleUpdateEditor}
      onDelete={handleDeleteEditor}
    />
  );
}
