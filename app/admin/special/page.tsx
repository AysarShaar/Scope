'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAdmin } from '../components/AdminShell';
import { ScopeArticle } from '../../../data/scopeData';

const ArticlesList = dynamic(() => import('../components/ArticlesList'), { ssr: false });
const ArticleEditor = dynamic(() => import('../components/ArticleEditor'), { ssr: false });

export default function AdminSpecialArticlesPage() {
  const { userRole, userPermissions, editorId, editors, showToast } = useAdmin();
  const [editingArticle, setEditingArticle] = useState<ScopeArticle | null | undefined>(undefined);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditArticle = async (article: ScopeArticle) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(article.id)}`, { cache: 'no-store' });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success && j.data) {
        setEditingArticle(j.data as ScopeArticle);
      } else {
        showToast(j?.error || 'تعذّر تحميل نص المقال بالكامل', 'error');
      }
    } catch {
      showToast('تعذّر الاتصال لتحميل نص المقال', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveArticle = async (data: Partial<ScopeArticle>) => {
    const isNew = editingArticle === null;
    if (!isNew && editingArticle?.content === undefined) {
      showToast('لم يُحمَّل نص المقال، أعد فتح التعديل.', 'error');
      return;
    }
    const url = isNew ? '/api/articles' : `/api/articles/${editingArticle?.id}`;
    const method = isNew ? 'POST' : 'PUT';

    setIsActionLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (j.success || res.ok) {
        showToast(isNew ? 'تم نشر المقال بنجاح ✓' : 'تم حفظ التعديلات ✓', 'success');
        setEditingArticle(undefined);
        setRefreshKey((k) => k + 1);
      } else {
        showToast(j.error || 'فشلت العملية', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء حفظ المقال', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`حذف المقال نهائياً:\n"${title}"`)) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (j.success || res.ok) {
        showToast('تم الحذف بنجاح ✓', 'success');
        setRefreshKey((k) => k + 1);
      } else {
        showToast(j.error || 'فشل الحذف', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء محاولة الحذف', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveArticle = async (id: string, title: string): Promise<void> => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.success || res.ok) {
        showToast(`تم اعتماد ونشر المقال: "${title}" ✓`, 'success');
        setRefreshKey((k) => k + 1);
      } else {
        showToast(j.error || 'فشل اعتماد المقال', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء اعتماد المقال', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <ArticlesList
        key={refreshKey}
        isSpecialOnly={true}
        onCreateNew={() => setEditingArticle(null)}
        onEdit={handleEditArticle}
        onDelete={handleDeleteArticle}
        onApprove={handleApproveArticle}
        userRole={userRole}
        permissions={userPermissions}
      />

      {editingArticle !== undefined && (
        <ArticleEditor
          article={editingArticle}
          editors={editors}
          onSave={handleSaveArticle}
          onClose={() => setEditingArticle(undefined)}
          isLoading={isActionLoading}
          userRole={userRole}
          permissions={userPermissions}
          currentEditorId={editorId}
        />
      )}
    </>
  );
}
