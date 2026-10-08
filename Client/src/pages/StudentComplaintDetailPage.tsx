import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Complaint, TimelineEvent } from '../types';
import { ComplaintService } from '../services/complaintService';
import { StorageService } from '../services/storage';
import { api } from '../services/api';
import { getStudentStatusConfig, PRIORITY_CONFIG } from '../utils/studentStatus';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowClockwise,
  CheckCircle,
  Warning,
  Clock,
  MapPin,
  CalendarBlank,
  Wrench,
  X,
  ShieldWarning,
  Check,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import type { Variants } from 'framer-motion';

// Framer motion variants
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const StudentComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  // Resolution & Reopen states
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Attachment preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchComplaintData = async () => {
    if (!id) return;
    setIsError(false);

    try {
      let data: Complaint | null = null;
      try {
        data = await api.complaints.getById(id);
      } catch (err) {
        data = ComplaintService.getComplaintById(id) || null;
      }

      if (!data) {
        setIsError(true);
        setIsLoading(false);
        return;
      }

      setComplaint(data);

      const events = StorageService.getTimeline(id);
      const sorted = [...events].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setTimeline(sorted);
    } catch (err) {
      console.error('Failed to load complaint:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();

    const handleRefresh = () => fetchComplaintData();
    window.addEventListener('complaints:refresh', handleRefresh);
    return () => window.removeEventListener('complaints:refresh', handleRefresh);
  }, [id]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchComplaintData();
    showToast('Complaint status refreshed', 'info');
  };

  // Student Confirm Resolution Flow
  const handleConfirmResolution = async () => {
    if (!complaint || !currentUser) return;
    setIsSubmittingAction(true);

    try {
      const displayName = currentUser.name || currentUser.fullName || 'Resident';
      ComplaintService.confirmResolution(complaint.id, {
        name: displayName,
        role: currentUser.role,
        id: currentUser.id,
      });

      try {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}

      showToast('Thank you! Complaint marked as RESOLVED and CLOSED.', 'success');
      await fetchComplaintData();
      window.dispatchEvent(new CustomEvent('complaints:refresh'));
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm resolution', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Student Reopen Flow
  const handleReopenComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !currentUser || !reopenReason.trim()) return;
    setIsSubmittingAction(true);

    try {
      const displayName = currentUser.name || currentUser.fullName || 'Resident';
      ComplaintService.reopenComplaint(complaint.id, reopenReason, {
        name: displayName,
        role: currentUser.role,
        id: currentUser.id,
      });

      setShowReopenInput(false);
      setReopenReason('');
      showToast('Problem marked as NOT SOLVED. Staff alerted for re-inspection.', 'warning');
      await fetchComplaintData();
      window.dispatchEvent(new CustomEvent('complaints:refresh'));
    } catch (err: any) {
      showToast(err.message || 'Failed to report problem still exists', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-48" />
        <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl w-full" />
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-3xl w-full" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl w-full" />
      </div>
    );
  }

  if (isError || !complaint) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
        <Warning size={40} className="mx-auto text-red-500" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Complaint Not Found
        </h2>
        <p className="text-xs text-zinc-500">
          Unable to locate this complaint or you may not have permission to view it.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/student/complaints')}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            Back to Complaints
          </button>
          <button
            onClick={fetchComplaintData}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStudentStatusConfig(complaint.status);
  const priorityInfo = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.MEDIUM;
  const isPendingResolution = complaint.status === 'RESOLUTION_PENDING';
  const isClosed =
    complaint.status === 'CLOSED' ||
    complaint.status === 'RESOLVED' ||
    complaint.status === 'STUDENT_CONFIRMED';

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto space-y-6 pb-12"
    >
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} weight="bold" />
          <span>Back to My Complaints</span>
        </Link>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-xs cursor-pointer transition-all"
        >
          <ArrowClockwise
            size={14}
            className={isRefreshing ? 'animate-spin text-red-600' : ''}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Top Section: Complaint #code, Title, Category, Priority, Status */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono text-xs font-extrabold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
              #{complaint.code}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${priorityInfo.badgeClass}`}>
              {priorityInfo.label} Priority
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <CalendarBlank size={14} />
            <span>Reported {formatDate(complaint.createdAt)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {complaint.title}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold">
            <MapPin size={14} className="text-red-600" />
            Room {complaint.roomNumber} ({complaint.block})
          </span>
          <span>·</span>
          <span className="capitalize">
            {complaint.category.toLowerCase().replace('_', ' ')} Issue
          </span>
        </div>
      </motion.div>

      {/* 1. CURRENT STATUS CARD */}
      <motion.div
        variants={itemVariants}
        className={`rounded-3xl p-6 sm:p-7 border shadow-xs space-y-3 ${statusConfig.bgClass} ${statusConfig.borderClass}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            CURRENT STATUS
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            <span>{statusConfig.label}</span>
          </span>
        </div>

        <div>
          <h2 className={`text-xl font-extrabold ${statusConfig.textClass}`}>
            {statusConfig.label}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
            {statusConfig.description}
          </p>
        </div>

        {/* Responsible technician info if available */}
        {complaint.assignedStaffName && (
          <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Wrench size={14} className="text-red-600" />
              <span>Assigned Technician: <strong>{complaint.assignedStaffName}</strong></span>
            </span>
            <span className="text-[11px] text-zinc-400 capitalize">
              {complaint.assignedStaffRole?.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        )}
      </motion.div>

      {/* 2. SLA & ESCALATION SECTION */}
      {(complaint.slaDeadline || complaint.isEscalated) && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SLA Card */}
          {complaint.slaDeadline && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 font-bold uppercase">
                  <Clock size={14} /> Service SLA
                </span>
                {complaint.slaState === 'BREACHED' || complaint.slaRemainingMinutes <= 0 ? (
                  <span className="text-red-600 font-bold">BREACHED</span>
                ) : isClosed ? (
                  <span className="text-emerald-500 font-bold">COMPLETED</span>
                ) : (
                  <span className="text-amber-500 font-bold">ON TARGET</span>
                )}
              </div>

              <div className="pt-1">
                {isClosed ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Completed within target resolution time
                  </p>
                ) : complaint.slaState === 'BREACHED' || complaint.slaRemainingMinutes <= 0 ? (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    Taking longer than expected — Supervisor alerted
                  </p>
                ) : (
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    Target resolution due by {formatTime(complaint.slaDeadline)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Escalation Card */}
          {complaint.isEscalated && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 shadow-xs space-y-1 text-red-700 dark:text-red-400">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase">
                <ShieldWarning size={16} weight="bold" />
                <span>ESCALATED</span>
              </div>
              <p className="text-xs font-semibold pt-1">
                This grievance has been escalated to hostel leadership for immediate supervision.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* 3. RESOLUTION FLOW ACTION CARD */}
      {isPendingResolution && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-500/10 dark:bg-amber-950/20 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-md shadow-amber-500/5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Warning size={22} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-amber-950 dark:text-amber-200">
                Resolution Pending
              </h3>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                The staff member has marked this complaint as resolved.
                {complaint.staffNotes && (
                  <span className="block mt-1 italic text-zinc-600 dark:text-zinc-400">
                    Technician note: "{complaint.staffNotes}"
                  </span>
                )}
              </p>
              <strong className="block text-xs text-zinc-900 dark:text-white mt-2">
                Was the problem in your room actually fixed?
              </strong>
            </div>
          </div>

          {!showReopenInput ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleConfirmResolution}
                disabled={isSubmittingAction}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check size={16} weight="bold" />
                <span>Confirm Resolution</span>
              </button>

              <button
                onClick={() => setShowReopenInput(true)}
                disabled={isSubmittingAction}
                className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <X size={16} weight="bold" />
                <span>Problem Still Exists</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleReopenComplaint} className="space-y-3 pt-1 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Please tell us what is still not working:
                </label>
                <input
                  type="text"
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Light bulb was replaced but switch still sparks"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Submit & Reopen Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowReopenInput(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* 4. ATTACHMENTS SECTION */}
      {(complaint.evidenceUrl || complaint.completionProofUrl) && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3"
        >
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <ImageIcon size={15} />
            <span>Attachments</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {complaint.evidenceUrl && (
              <div
                onClick={() => setPreviewImageUrl(complaint.evidenceUrl!)}
                className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-zinc-100 dark:bg-zinc-950 aspect-video flex items-center justify-center"
              >
                <img
                  src={complaint.evidenceUrl}
                  alt="Student Upload"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Resident Photo
                </span>
              </div>
            )}

            {complaint.completionProofUrl && (
              <div
                onClick={() => setPreviewImageUrl(complaint.completionProofUrl!)}
                className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-zinc-100 dark:bg-zinc-950 aspect-video flex items-center justify-center"
              >
                <img
                  src={complaint.completionProofUrl}
                  alt="Technician Resolution Proof"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Technician Proof
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 5. VISUAL STATUS PROGRESS TIMELINE */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Complaint Progress Timeline
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Live updates recorded from backend activity ledger
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {timeline.length} {timeline.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 font-mono">
            No history recorded yet. The timeline will populate as staff take actions.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {timeline.map((event, index) => {
              const isLast = index === timeline.length - 1;

              return (
                <div key={event.id || index} className="relative group">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      isLast
                        ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/30 animate-pulse'
                        : 'bg-emerald-600 border-emerald-600 text-white'
                    }`}
                  >
                    {isLast ? '●' : '✓'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                        {event.action.toLowerCase().replace(/_/g, ' ')}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {formatDate(event.timestamp)} · {formatTime(event.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {event.description}
                    </p>

                    {event.actorName && (
                      <div className="text-[11px] font-mono text-zinc-400 pt-0.5">
                        Recorded by {event.actorName} ({event.actorRole.toLowerCase().replace('_', ' ')})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Image Preview Lightbox Modal */}
      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
            >
              <img
                src={previewImageUrl}
                alt="Attachment Preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
