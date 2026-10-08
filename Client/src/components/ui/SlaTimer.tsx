import React, { useState, useEffect } from 'react';
import { Timer, WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface SlaTimerProps {
  deadline: string; // ISO date
  totalMinutes: number;
  status: string;
  showBar?: boolean;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({
  deadline,
  totalMinutes,
  status,
  showBar = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    diffMinutes: number;
    text: string;
    isBreached: boolean;
    isApproaching: boolean;
  }>({
    diffMinutes: 0,
    text: '',
    isBreached: false,
    isApproaching: false,
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diffMs = target - now;
      const diffMinutes = Math.round(diffMs / (1000 * 60));

      const isBreached = diffMinutes <= 0;
      const isApproaching = diffMinutes > 0 && diffMinutes <= Math.max(60, totalMinutes * 0.25);

      const absMinutes = Math.abs(diffMinutes);
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;

      let text = '';
      if (isBreached) {
        text = `Breached by ${hours}h ${mins}m`;
      } else {
        text = `${hours}h ${mins}m remaining`;
      }

      setTimeLeft({
        diffMinutes,
        text,
        isBreached,
        isApproaching,
      });
    };

    calculate();
    const interval = setInterval(calculate, 30000); // 30s tick
    return () => clearInterval(interval);
  }, [deadline, totalMinutes]);

  const isResolved = status === 'RESOLVED' || status === 'CLOSED' || status === 'STUDENT_CONFIRMED';

  if (isResolved) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30 font-mono">
        <CheckCircle size={14} weight="fill" />
        <span>SLA MET</span>
      </div>
    );
  }

  const percentRemaining = Math.max(
    0,
    Math.min(100, Math.round((timeLeft.diffMinutes / totalMinutes) * 100))
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {timeLeft.isBreached ? (
            <WarningCircle size={14} weight="fill" className="text-red-600 dark:text-red-400 animate-pulse shrink-0" />
          ) : timeLeft.isApproaching ? (
            <Timer size={14} weight="bold" className="text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
          ) : (
            <Timer size={14} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
          )}
          <span
            className={`font-semibold ${
              timeLeft.isBreached
                ? 'text-red-600 dark:text-red-400'
                : timeLeft.isApproaching
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {timeLeft.text}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
          Due: {new Date(deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {showBar && (
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              timeLeft.isBreached
                ? 'w-full bg-red-600 dark:bg-red-500'
                : timeLeft.isApproaching
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-emerald-600 dark:bg-emerald-400'
            }`}
            style={{ width: timeLeft.isBreached ? '100%' : `${percentRemaining}%` }}
          />
        </div>
      )}
    </div>
  );
};
