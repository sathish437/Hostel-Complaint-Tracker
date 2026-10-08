import React, { useState } from 'react';
import { Complaint } from '../../types';
import { StorageService } from '../../services/storage';
import { ComplaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { SlaTimer } from '../ui/SlaTimer';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  CalendarBlank,
  CheckCircle,
  Wrench,
  UserSwitch,
  Clock,
  ArrowCounterClockwise,
  Warning,
  Image as ImageIcon,
} from '@phosphor-icons/react';

interface ComplaintDetailModalProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdated: (complaint: Complaint) => void;
  onOpenAssignModal: (complaint: Complaint) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onUpdated,
  onOpenAssignModal,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isStudent = currentUser.role === 'STUDENT';
  const isWorker =
    currentUser.role === 'ELECTRICIAN' ||
    currentUser.role === 'CLEANING_WORKER' ||
    currentUser.role === 'MASTER' ||
    currentUser.role === 'WATCHMAN';
  const isOfficeOrWarden =
    currentUser.role === 'HOSTEL_OFFICE' ||
    currentUser.role === 'WARDEN' ||
    currentUser.role === 'DEPUTY_WARDEN';

  // Worker action states
  const [workerNotes, setWorkerNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Student reopen modal state
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // 1. Student Actions
  const handleStudentConfirmClose = () => {
    const updated = ComplaintService.confirmResolution(complaint.id, {
      name: currentUser.name || currentUser.fullName || 'Resident',
      role: currentUser.role,
      id: currentUser.id,
    });
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    showToast('Complaint confirmed resolved and closed! Thank you.', 'success');
    onUpdated(updated);
  };

  const handleStudentReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    const updated = ComplaintService.reopenComplaint(complaint.id, reopenReason, {
      name: currentUser.name || currentUser.fullName || 'Resident',
      role: currentUser.role,
      id: currentUser.id,
    });
    setShowReopenInput(false);
    showToast('Complaint reopened. Worker notified.', 'warning');
    onUpdated(updated);
  };

  // 2. Worker Actions
  const handleWorkerAccept = () => {
    const updated = ComplaintService.acknowledgeComplaint(complaint.id, {
      name: currentUser.name || currentUser.fullName || 'Worker',
      role: currentUser.role,
      id: currentUser.id,
    });
    showToast('Job accepted', 'success');
    onUpdated(updated);
  };

  const handleWorkerStart = () => {
    const updated = ComplaintService.startWork(complaint.id, 'Work started on-site', {
      name: currentUser.name || currentUser.fullName || 'Worker',
      role: currentUser.role,
      id: currentUser.id,
    });
    showToast('Work started on-site', 'info');
    onUpdated(updated);
  };

  const handleWorkerResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerNotes.trim()) return;
    const updated = ComplaintService.markResolutionPending(
      complaint.id,
      workerNotes,
      proofUrl.trim() || undefined,
      {
        name: currentUser.name || currentUser.fullName || 'Worker',
        role: currentUser.role,
        id: currentUser.id,
      }
    );
    setShowResolveForm(false);
    showToast('Marked as resolved! Sent to resident for confirmation.', 'success');
    onUpdated(updated);
  };

  // Simple Human Timeline Steps per Section 10 & 11
  const getTimelineSteps = () => {
    const s = complaint.status;
    return [
      {
        label: 'Complaint submitted',
        done: true,
        current: s === 'SUBMITTED',
      },
      {
        label: complaint.assignedStaffName ? `Assigned to ${complaint.assignedStaffName}` : 'Staff assigned',
        done: s !== 'SUBMITTED',
        current: s === 'ASSIGNED' || s === 'ACKNOWLEDGED',
      },
      {
        label: 'Work in progress',
        done: s === 'IN_PROGRESS' || s === 'RESOLUTION_PENDING' || s === 'CLOSED' || s === 'RESOLVED' || s === 'STUDENT_CONFIRMED',
        current: s === 'IN_PROGRESS',
      },
      {
        label: 'Resolution pending',
        done: s === 'RESOLUTION_PENDING' || s === 'CLOSED' || s === 'RESOLVED' || s === 'STUDENT_CONFIRMED',
        current: s === 'RESOLUTION_PENDING',
      },
      {
        label: 'Closed & Verified',
        done: s === 'CLOSED' || s === 'RESOLVED' || s === 'STUDENT_CONFIRMED',
        current: s === 'CLOSED',
      },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              #{complaint.code}
            </span>
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} size="sm" />
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Problem Title & Location per Section 11 */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {complaint.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <MapPin size={14} />
              {complaint.block}, Room {complaint.roomNumber}
            </span>
            <span>·</span>
            <span className="capitalize">{complaint.category.toLowerCase().replace('_', ' ')}</span>
            <span>·</span>
            <span>Student: {complaint.studentName}</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {complaint.description}
        </div>

        {/* Attached Photo Evidence if any */}
        {complaint.evidenceUrl && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono font-bold uppercase text-zinc-400">
              Resident Photo
            </div>
            <a
              href={complaint.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-48 group"
            >
              <img
                src={complaint.evidenceUrl}
                alt=""
                className="w-full h-48 object-cover group-hover:scale-102 transition-transform"
              />
            </a>
          </div>
        )}

        {/* If Student: Show ONLY Problem Status (Solved or Not Solved), No history or worker clutter */}
        {isStudent ? (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400">
              Problem Status
            </div>

            {complaint.status === 'CLOSED' || complaint.status === 'RESOLVED' || complaint.status === 'STUDENT_CONFIRMED' ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                <CheckCircle size={28} weight="fill" className="text-emerald-500 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">SOLVED</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This problem has been confirmed solved and closed.</div>
                </div>
              </div>
            ) : complaint.status === 'RESOLUTION_PENDING' ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center gap-3">
                <Clock size={28} weight="bold" className="text-amber-500 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-400">NEEDS YOUR CONFIRMATION</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Staff reported this problem fixed. Please confirm below if it is solved.</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 text-red-800 dark:text-red-300 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse shrink-0" />
                <div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">NOT SOLVED</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This problem is currently active and being attended to.</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Assigned Staff & Simple SLA Block for Staff/Wardens */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80">
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  Assigned Worker
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                  {complaint.assignedStaffName || 'Hostel Office Queue'}
                </div>
                <div className="text-[11px] text-red-600 dark:text-red-400 font-mono">
                  {complaint.assignedStaffRole || 'Pending Assignment'}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  Target SLA
                </div>
                <div className="mt-1">
                  <SlaTimer
                    deadline={complaint.slaDeadline}
                    totalMinutes={complaint.slaTotalMinutes}
                    status={complaint.status}
                    showBar={true}
                  />
                </div>
              </div>
            </div>

            {/* Simple Progress Stepper for Staff/Wardens */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-600 dark:text-zinc-400">
                Progress
              </div>

              {complaint.isEscalated && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Warning size={16} weight="bold" />
                  <span>⚠ Your complaint has been escalated for high-level supervision</span>
                </div>
              )}

              {complaint.status === 'REOPENED' && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>↻ Reopened: "{complaint.reopenReason}"</span>
                </div>
              )}

              <div className="space-y-2.5 pl-2 pt-1 font-mono text-xs">
                {steps.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        st.done
                          ? 'bg-emerald-600 text-white'
                          : st.current
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {st.done ? '✓' : st.current ? '●' : '○'}
                    </span>
                    <span
                      className={`${
                        st.done
                          ? 'text-zinc-900 dark:text-zinc-200 font-semibold'
                          : st.current
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : 'text-zinc-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Student Resolution Confirmation Box per Section 11 */}
        {complaint.status === 'RESOLUTION_PENDING' && (
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono">
              Has your complaint been resolved?
            </h4>
            {complaint.staffNotes && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                Worker note: "{complaint.staffNotes}"
              </p>
            )}

            {!showReopenInput ? (
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={handleStudentConfirmClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>Yes, it's resolved</span>
                </button>

                <button
                  onClick={() => setShowReopenInput(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowCounterClockwise size={15} weight="bold" />
                  <span>No, still a problem</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleStudentReopen} className="space-y-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain what is still not working..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Reopen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReopenInput(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Worker Actions per Section 13 */}
        {isWorker && complaint.status !== 'CLOSED' && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold uppercase font-mono text-zinc-500">
              Worker Action ({currentUser.role})
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {complaint.status === 'ASSIGNED' && (
                <button
                  onClick={handleWorkerAccept}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={14} weight="bold" />
                  <span>Accept Job</span>
                </button>
              )}

              {(complaint.status === 'ASSIGNED' || complaint.status === 'ACKNOWLEDGED') && (
                <button
                  onClick={handleWorkerStart}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Wrench size={14} weight="bold" />
                  <span>Start Work</span>
                </button>
              )}

              {(complaint.status === 'IN_PROGRESS' || complaint.status === 'REOPENED') && (
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={14} weight="fill" />
                  <span>Mark Resolution Pending</span>
                </button>
              )}
            </div>

            {showResolveForm && (
              <form onSubmit={handleWorkerResolve} className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 animate-fade-in">
                <input
                  type="text"
                  required
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder="What work was completed? e.g. Replaced capacitor"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Optional photo proof link: https://..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-red-600"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Resolution
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResolveForm(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Office Reassign trigger */}
        {isOfficeOrWarden && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onOpenAssignModal(complaint)}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserSwitch size={14} />
              <span>{complaint.assignedStaffId ? 'Reassign Worker' : 'Assign Worker'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
