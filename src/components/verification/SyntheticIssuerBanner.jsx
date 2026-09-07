import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export const SyntheticIssuerBanner = ({ compact = false }) => {
  return (
    <div className={`rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-300 text-xs flex items-center justify-between gap-2 mb-4 ${compact ? 'py-1.5 px-3' : ''}`}>
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-semibold tracking-wide">
          Mock/Synthetic Registry — Demo Data
        </span>
      </div>
      <div className="flex items-center gap-1 text-amber-400/80 font-mono text-[11px]">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Demonstration Mode</span>
      </div>
    </div>
  );
};
