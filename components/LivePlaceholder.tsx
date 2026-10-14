'use client';

import React from 'react';
import { ScopeLogo } from './ScopeLogo';

interface LivePlaceholderProps {
  title?: string;
  label?: string;
  className?: string;
}

export const LivePlaceholder: React.FC<LivePlaceholderProps> = ({
  className = '',
}) => (
  <div
    className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden select-none bg-[#f8fafc] dark:bg-[#0a0e17] transition-colors duration-200 ${className}`}
  >
    <div className="w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[480px] px-6 py-4 flex items-center justify-center">
      <ScopeLogo
        animated={true}
        variant="auto"
        className="w-full h-auto"
        holdFull={6000}
        holdO={4000}
      />
    </div>
  </div>
);

export default LivePlaceholder;
