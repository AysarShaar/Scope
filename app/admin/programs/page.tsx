'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAdmin } from '../components/AdminShell';
import { ScopeShow } from '../../../data/scopeData';

const ProgramsManager = dynamic(() => import('../components/ProgramsManager'), { ssr: false });

export default function AdminProgramsPage() {
  const { userRole, userPermissions, showToast } = useAdmin();
  const [programs, setPrograms] = useState<ScopeShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/programs');
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success && Array.isArray(j.data)) {
        setPrograms(j.data);
      }
    } catch {
      showToast('تعذّر تحميل قائمة البرامج', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleAddProgram = async (data: Partial<ScopeShow>) => {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      showToast('تمت إضافة البرنامج بنجاح ✓', 'success');
      loadPrograms();
    } else {
      showToast(j.error || 'فشلت إضافة البرنامج', 'error');
    }
  };

  const handleUpdateProgram = async (id: string, data: Partial<ScopeShow>) => {
    const res = await fetch(`/api/programs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      showToast('تم تحديث البرنامج والحلقات بنجاح ✓', 'success');
      loadPrograms();
    } else {
      showToast(j.error || 'فشل تحديث البرنامج', 'error');
    }
  };

  const handleDeleteProgram = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف البرنامج:\n"${title}"؟`)) return;
    const res = await fetch(`/api/programs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      setPrograms((p) => p.filter((pr) => pr.id !== id));
      showToast('تم حذف البرنامج بنجاح ✓', 'success');
    } else {
      showToast(j.error || 'فشل حذف البرنامج', 'error');
    }
  };

  return (
    <ProgramsManager
      programs={programs}
      isLoading={isLoading}
      onAddProgram={handleAddProgram}
      onUpdateProgram={handleUpdateProgram}
      onDeleteProgram={handleDeleteProgram}
      userRole={userRole}
      permissions={userPermissions}
    />
  );
}
