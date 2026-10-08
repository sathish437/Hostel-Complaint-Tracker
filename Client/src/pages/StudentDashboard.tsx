import React, { useState } from 'react';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { ComplaintService } from '../services/complaintService';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  Check,
  X,
  Warning,
} from '@phosphor-icons/react';

interface StudentDashboardProps {
  complaints: Complaint[];
  onOpenNewModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  complaints,
  onOpenNewModal,
  onSelectComplaint,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<'ALL' | 'NOT_SOLVED' | 'SOLVED'>('ALL');
  const [reopenTargetId, setReopenTargetId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');

  if (!currentUser) return null;

  const displayName = currentUser.name || currentUser.fullName || 'Student';
  const firstName = displayName.split(' ')[0];

  // Filter complaints for current student
  const studentComplaints = complaints.filter(
    (c) => c.studentId === currentUser.id || c.studentName === displayName
  );
  const displayList = studentComplaints.length > 0 ? studentComplaints : complaints;

  // Filter by Solved or Not Solved
  const filteredList = displayList.filter((item) => {
    const isSolved =
      item.status === 'CLOSED' ||
      item.status === 'RESOLVED' ||
      item.status === 'STUDENT_CONFIRMED';
    if (filter === 'SOLVED') return isSolved;
    if (filter === 'NOT_SOLVED') return !isSolved;
    return true;
  });

  const solvedCount = displayList.filter(
    (c) => c.status === 'CLOSED' || c.status === 'RESOLVED' || c.status === 'STUDENT_CONFIRMED'
  ).length;
  const notSolvedCount = displayList.length - solvedCount;

  // Confirm problem is solved
  const handleConfirmSolved = (complaint: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    ComplaintService.confirmResolution(complaint.id, {
      name: displayName,
      role: currentUser.role,
      id: currentUser.id,
    });

    try {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    } catch (err) {}

    showToast(`Marked #${complaint.code} as SOLVED!`, 'success');
    window.dispatchEvent(new CustomEvent('complaints:refresh'));
  };

  // Mark problem as NOT solved
  const handleConfirmNotSolved = (complaintId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!reopenReason.trim()) return;

    ComplaintService.reopenComplaint(complaintId, reopenReason, {
      name: displayName,
      role: currentUser.role,
      id: currentUser.id,
    });

    setReopenTargetId(null);
    setReopenReason('');
    showToast('Problem marked as NOT SOLVED.', 'warning');
    window.dispatchEvent(new CustomEvent('complaints:refresh'));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header: Simple and Direct */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Hello, {firstName}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Room {currentUser.roomNumber || 'B-203'} · {currentUser.block || 'Block B'}
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} weight="bold" />
          <span>Report a Problem</span>
        </button>
      </div>

      {/* Filter Tabs: Strictly Solved or Not Solved */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            All ({displayList.length})
          </button>

          <button
            onClick={() => setFilter('NOT_SOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'NOT_SOLVED'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-red-600 dark:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Not Solved ({notSolvedCount})</span>
          </button>

          <button
            onClick={() => setFilter('SOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'SOLVED'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle size={14} weight="bold" />
            <span>Solved ({solvedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Focus: Problem Status (Solved or Not Solved) */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <CheckCircle size={42} className="mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {filter === 'NOT_SOLVED'
                ? 'No unsolved problems!'
                : filter === 'SOLVED'
                ? 'No solved problems yet'
                : 'No problems reported'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {filter === 'NOT_SOLVED'
                ? 'All your reported problems have been resolved.'
                : 'Report any issue in your room and check its solved status here.'}
            </p>
            {filter === 'ALL' && (
              <button
                onClick={onOpenNewModal}
                className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                + Report a Problem
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const isSolved =
              item.status === 'CLOSED' ||
              item.status === 'RESOLVED' ||
              item.status === 'STUDENT_CONFIRMED';
            const isPendingConfirmation = item.status === 'RESOLUTION_PENDING';

            return (
              <div
                key={item.id}
                onClick={() => onSelectComplaint(item)}
                className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm transition-all cursor-pointer space-y-4 ${
                  isSolved
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isPendingConfirmation
                    ? 'border-amber-500/40 hover:border-amber-500/60'
                    : 'border-red-500/30 hover:border-red-500/50'
                }`}
              >
                {/* 1. Clear "Solved or Not Solved" Status Banner */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    {isSolved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <CheckCircle size={15} weight="fill" />
                        <span>SOLVED</span>
                      </span>
                    ) : isPendingConfirmation ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock size={15} weight="bold" />
                        <span>NEEDS CONFIRMATION</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span>NOT SOLVED</span>
                      </span>
                    )}

                    <span className="text-xs font-mono text-zinc-400">
                      #{item.code}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 capitalize font-mono">
                    {item.category.toLowerCase().replace('_', ' ')}
                  </span>
                </div>

                {/* 2. Problem Title */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* 3. Problem Status Card (Solved or Not Solved) */}
                {isSolved ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                    <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
                    <span>Status: Problem is SOLVED and verified.</span>
                  </div>
                ) : isPendingConfirmation ? (
                  /* Immediate Resident Confirmation Box */
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-3">
                    <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <Warning size={16} weight="bold" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Staff reported this problem fixed.</strong>
                        <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                          {item.staffNotes ? `Note: "${item.staffNotes}"` : 'Please verify if the problem is completely solved.'}
                        </p>
                      </div>
                    </div>

                    {reopenTargetId !== item.id ? (
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          onClick={(e) => handleConfirmSolved(item, e)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Check size={14} weight="bold" />
                          <span>Yes, It's Solved</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReopenTargetId(item.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <X size={14} weight="bold" />
                          <span>No, Still Not Solved</span>
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => handleConfirmNotSolved(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="space-y-2.5 pt-1"
                      >
                        <input
                          type="text"
                          required
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="What is still not working? e.g. Still no power"
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Submit Feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => setReopenTargetId(null)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Active / Not Solved */
                  <div className="p-3.5 rounded-2xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                    <span>Status: Problem is NOT solved yet.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
