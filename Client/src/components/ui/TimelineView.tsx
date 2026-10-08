import React from 'react';
import { TimelineEvent } from '../../types';
import {
  CheckCircle,
  PaperPlaneTilt,
  UserSwitch,
  ClockCountdown,
  Wrench,
  Warning,
  SealCheck,
  ArrowClockwise,
} from '@phosphor-icons/react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-zinc-400 dark:text-zinc-500 text-xs py-4 font-mono">
        No lifecycle events recorded yet.
      </div>
    );
  }

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'COMPLAINT_CREATED':
        return <PaperPlaneTilt size={14} weight="bold" className="text-zinc-500 dark:text-zinc-400" />;
      case 'AUTOMATICALLY_ASSIGNED':
      case 'MANUALLY_ASSIGNED':
      case 'REASSIGNED':
        return <UserSwitch size={14} weight="bold" className="text-blue-500" />;
      case 'ACKNOWLEDGED':
      case 'SLA_STARTED':
        return <ClockCountdown size={14} weight="bold" className="text-amber-500" />;
      case 'WORK_STARTED':
        return <Wrench size={14} weight="bold" className="text-indigo-500" />;
      case 'RESOLUTION_PENDING':
        return <SealCheck size={14} weight="bold" className="text-purple-500" />;
      case 'CONFIRM_RESOLUTION':
      case 'CLOSED':
        return <CheckCircle size={14} weight="bold" className="text-emerald-500" />;
      case 'REOPENED':
        return <ArrowClockwise size={14} weight="bold" className="text-rose-500" />;
      case 'SLA_BREACHED':
      case 'ESCALATED':
        return <Warning size={14} weight="bold" className="text-red-500" />;
      default:
        return <CheckCircle size={14} className="text-zinc-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
      {events.map((event) => {
        const dateObj = new Date(event.timestamp);
        return (
          <div key={event.id} className="relative group">
            {/* Dot / Icon */}
            <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center ring-4 ring-zinc-50 dark:ring-zinc-950 group-hover:border-red-600 transition-colors">
              {getEventIcon(event.action)}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-3.5 transition-all text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">
                  {event.actorName}
                  <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-sans border border-zinc-300 dark:border-zinc-700">
                    {event.actorRole}
                  </span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                  {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 leading-snug">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
