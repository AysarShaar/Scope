'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAdmin } from '../components/AdminShell';
import { BreakingItem } from '../../../data/scopeData';

const BreakingNews = dynamic(() => import('../components/BreakingNews'), { ssr: false });

export default function AdminBreakingPage() {
  const { showToast } = useAdmin();
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBreaking = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/breaking?limit=50');
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success && Array.isArray(j.data)) {
        setItems(j.data);
      }
    } catch {
      showToast('تعذّر تحميل الأخبار العاجلة', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBreaking();
  }, [loadBreaking]);

  const handleAddBreaking = async (data: { title: string }) => {
    const res = await fetch('/api/breaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      showToast('تمت إضافة الخبر العاجل بنجاح ✓', 'success');
      loadBreaking();
    } else {
      showToast(j.error || 'فشلت إضافة الخبر العاجل', 'error');
    }
  };

  const handleDeleteBreaking = async (id: string) => {
    const res = await fetch(`/api/breaking/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      setItems((prev) => prev.filter((b) => b.id !== id));
      showToast('تم حذف الخبر العاجل ✓', 'success');
    } else {
      showToast(j.error || 'فشل حذف الخبر العاجل', 'error');
    }
  };

  return (
    <BreakingNews
      items={items}
      isLoading={isLoading}
      onAdd={handleAddBreaking}
      onDelete={handleDeleteBreaking}
    />
  );
}
