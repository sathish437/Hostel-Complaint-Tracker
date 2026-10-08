import React from 'react';
import { Priority } from '../../types';
import { Flame, Warning, Info, CheckCircle } from '@phosphor-icons/react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const p = priority === 'EMERGENCY' ? 'CRITICAL' : priority;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-[11px] px-2 py-0.5 gap-1.5';

  switch (p) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center rounded-md font-semibold font-mono border transition-colors select-none ${sizeClasses} bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/40 animate-pulse`}
          title="Critical SLA Priority (4h max)"
        >
          <Flame size={13} weight="fill" className="text-red-600 dark:text-red-400 shrink-0" />
          <span>CRITICAL (4h)</span>
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center rounded-md font-semibold font-mono border transition-colors select-none ${sizeClasses} bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30`}
          title="High SLA Priority (12h max)"
        >
          <Warning size={13} weight="bold" className="text-orange-600 dark:text-orange-400 shrink-0" />
          <span>HIGH (12h)</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center rounded-md font-medium font-mono border transition-colors select-none ${sizeClasses} bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30`}
          title="Medium SLA Priority (24h max)"
        >
          <Info size={13} weight="bold" className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>MEDIUM (24h)</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md font-medium font-mono border transition-colors select-none ${sizeClasses} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30`}
          title="Low SLA Priority (48h max)"
        >
          <CheckCircle size={13} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>LOW (48h)</span>
        </span>
      );
  }
};
