'use client';

import React from 'react';
import { BreakingItem, ScopeArticle } from '../data/scopeData';

interface ScopeSidebarProps {
  breakingNews?: BreakingItem[];
  isLoading?: boolean;
  articles?: ScopeArticle[];
  onSelectTag?: (tag: string) => void;
  onViewAllNews?: () => void;
  onViewMoreReports?: () => void;
}

export const ScopeSidebar: React.FC<ScopeSidebarProps> = () => {
  return null;
};
