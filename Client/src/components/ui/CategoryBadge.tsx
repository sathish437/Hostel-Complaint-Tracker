import React from 'react';
import { ComplaintCategory } from '../../types';
import {
  Lightning,
  Drop,
  Broom,
  ForkKnife,
  ShieldCheck,
  Armchair,
  WifiHigh,
  Wrench,
} from '@phosphor-icons/react';

interface CategoryBadgeProps {
  category: ComplaintCategory;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, showIcon = true }) => {
  const getMeta = () => {
    switch (category) {
      case 'ELECTRICAL':
        return {
          label: 'Electrical',
          icon: Lightning,
          classes: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        };
      case 'WATER_PLUMBING':
        return {
          label: 'Plumbing',
          icon: Drop,
          classes: 'bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-500/30',
        };
      case 'CLEANING_HYGIENE':
        return {
          label: 'Hygiene & Cleaning',
          icon: Broom,
          classes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        };
      case 'FOOD_MESS':
        return {
          label: 'Food & Mess',
          icon: ForkKnife,
          classes: 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
        };
      case 'SECURITY':
        return {
          label: 'Security & Access',
          icon: ShieldCheck,
          classes: 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/30',
        };
      case 'ROOM_FURNITURE':
        return {
          label: 'Furniture & Room',
          icon: Armchair,
          classes: 'bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-400 border-violet-200 dark:border-violet-500/30',
        };
      case 'INTERNET':
        return {
          label: 'Network & Wi-Fi',
          icon: WifiHigh,
          classes: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30',
        };
      case 'GENERAL':
      default:
        return {
          label: 'General Maintenance',
          icon: Wrench,
          classes: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
        };
    }
  };

  const meta = getMeta();
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors select-none ${meta.classes}`}
    >
      {showIcon && <Icon size={13} weight="bold" />}
      <span>{meta.label}</span>
    </span>
  );
};
