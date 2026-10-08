import React from 'react';
import { ComplaintStatus } from '../../types';
import {
  PaperPlaneTilt,
  UserSwitch,
  Clock,
  Wrench,
  SealCheck,
  CheckCircle,
  ArrowCounterClockwise,
  WarningCircle,
  ShieldWarning,
} from '@phosphor-icons/react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getMeta = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          icon: PaperPlaneTilt,
          label: 'SUBMITTED',
          light: 'bg-zinc-100 text-zinc-800 border-zinc-300',
          dark: 'dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700',
          dot: 'bg-zinc-400',
        };
      case 'ASSIGNED':
        return {
          icon: UserSwitch,
          label: 'ASSIGNED',
          light: 'bg-blue-50 text-blue-800 border-blue-200',
          dark: 'dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'ACKNOWLEDGED':
        return {
          icon: Clock,
          label: 'ACKNOWLEDGED',
          light: 'bg-sky-50 text-sky-800 border-sky-200',
          dark: 'dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30',
          dot: 'bg-sky-500',
        };
      case 'IN_PROGRESS':
        return {
          icon: Wrench,
          label: 'IN PROGRESS',
          light: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dark: 'dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/30',
          dot: 'bg-indigo-500 animate-pulse',
        };
      case 'RESOLUTION_PENDING':
        return {
          icon: SealCheck,
          label: 'RESOLUTION PENDING',
          light: 'bg-purple-50 text-purple-800 border-purple-200',
          dark: 'dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/30',
          dot: 'bg-purple-500 animate-ping',
        };
      case 'REOPENED':
        return {
          icon: ArrowCounterClockwise,
          label: 'REOPENED',
          light: 'bg-rose-50 text-rose-800 border-rose-300',
          dark: 'dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/40',
          dot: 'bg-rose-500 animate-pulse',
        };
      case 'SLA_BREACHED':
        return {
          icon: WarningCircle,
          label: 'SLA BREACHED',
          light: 'bg-red-50 text-red-800 border-red-300',
          dark: 'dark:bg-red-950/50 dark:text-red-400 dark:border-red-500/50',
          dot: 'bg-red-600 animate-ping',
        };
      case 'ESCALATED':
        return {
          icon: ShieldWarning,
          label: 'ESCALATED',
          light: 'bg-red-100 text-red-900 border-red-300 font-bold',
          dark: 'dark:bg-red-950/60 dark:text-red-300 dark:border-red-500/60 font-bold',
          dot: 'bg-red-500 animate-pulse',
        };
      case 'STUDENT_CONFIRMED':
      case 'RESOLVED':
      case 'CLOSED':
      default:
        return {
          icon: CheckCircle,
          label: 'CLOSED',
          light: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dark: 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
    }
  };

  const meta = getMeta();
  const Icon = meta.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold font-mono border transition-colors select-none ${sizeClasses} ${meta.light} ${meta.dark}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} weight="bold" className="shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
};
