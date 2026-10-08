import React, { useState } from 'react';
import { Complaint } from '../../types';
import { ComplaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import { CheckCircle, ArrowCounterClockwise, SealCheck, Image as ImageIcon } from '@phosphor-icons/react';

interface ResolutionConfirmationBannerProps {
  complaint: Complaint;
  onUpdated: (complaint: Complaint) => void;
}

export const ResolutionConfirmationBanner: React.FC<ResolutionConfirmationBannerProps> = ({
  complaint,
  onUpdated,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (complaint.status !== 'RESOLUTION_PENDING') {
    return null;
  }

  const handleConfirmClose = () => {
    setLoading(true);
    const updated = ComplaintService.confirmResolution(complaint.id, {
      name: currentUser.name || currentUser.fullName || 'Resident',
      role: currentUser.role,
      id: currentUser.id,
    });

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#dc2626', '#ef4444', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // safe fallback
    }

    setLoading(false);
    showToast(`Complaint ${complaint.code} confirmed resolved and closed!`, 'success');
    onUpdated(updated);
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    setLoading(true);
    const updated = ComplaintService.reopenComplaint(complaint.id, reopenReason, {
      name: currentUser.name || currentUser.fullName || 'Resident',
      role: currentUser.role,
      id: currentUser.id,
    });
    setLoading(false);
    setShowReopenModal(false);
    showToast(`Complaint ${complaint.code} reopened. Staff alerted.`, 'warning');
    onUpdated(updated);
  };

  return (
    <>
      <div className="relative overflow-hidden bg-zinc-950 dark:bg-black text-white border border-red-500/40 rounded-2xl p-5 shadow-lg shadow-black/20 my-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Action Required from Resident
              </span>
            </div>
            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <SealCheck size={20} className="text-red-500" />
              Has your complaint been resolved satisfactorily?
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
              Assigned technician <strong className="text-white">{complaint.assignedStaffName}</strong> has completed the repair:
              {complaint.staffNotes && (
                <span className="block mt-1 italic text-zinc-300 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs font-mono">
                  "{complaint.staffNotes}"
                </span>
              )}
            </p>

            {complaint.completionProofUrl && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={complaint.completionProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 underline font-mono"
                >
                  <ImageIcon size={14} /> View Technician Completion Photo
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowReopenModal(true)}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>NO, REOPEN COMPLAINT</span>
            </button>

            <button
              onClick={handleConfirmClose}
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={15} weight="fill" />
              <span>YES, CLOSE COMPLAINT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-900 dark:text-zinc-100">
            <h3 className="font-bold text-base mb-1 flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ArrowCounterClockwise size={18} />
              Reopen Grievance {complaint.code}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Please state why the problem is still unresolved. This will immediately reset status to REOPENED and dispatch high-priority notifications.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Reopen Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Fan still makes grinding sounds; leak started again..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reopenReason.trim() || loading}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
