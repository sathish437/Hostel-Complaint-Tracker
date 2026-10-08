import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ComplaintService } from '../services/complaintService';
import { api } from '../services/api';
import { getStudentStatusConfig, PRIORITY_CONFIG } from '../utils/studentStatus';
import {
  MapPin,
  ArrowRight,
  CheckCircle,
  Plus,
  ArrowClockwise,
  Warning,
  Clock,
  ShieldWarning,
  CalendarBlank,
} from '@phosphor-icons/react';

interface StudentComplaintsPageProps {
  onOpenNewModal: () => void;
}

export const StudentComplaintsPage: React.FC<StudentComplaintsPageProps> = ({
  onOpenNewModal,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchStudentComplaints = async () => {
    if (!currentUser) return;
    setIsError(false);

    try {
      let list: Complaint[] = [];
      try {
        list = await api.complaints.getAll();
      } catch (err) {
        list = ComplaintService.getComplaints();
      }

      const displayName = currentUser.name || currentUser.fullName || 'Student';
      // Filter strictly to current authenticated student
      const userComplaints = list.filter(
        (c) => c.studentId === currentUser.id || c.studentName === displayName
      );

      setComplaints(userComplaints);
    } catch (err) {
      console.error('Failed to load student complaints:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentComplaints();

    const handleRefresh = () => fetchStudentComplaints();
    window.addEventListener('complaints:refresh', handleRefresh);
    return () => window.removeEventListener('complaints:refresh', handleRefresh);
  }, [currentUser]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStudentComplaints();
    showToast('Complaints refreshed', 'info');
  };

  const isComplaintActive = (status: string) => {
    return (
      status !== 'CLOSED' &&
      status !== 'RESOLVED' &&
      status !== 'STUDENT_CONFIRMED'
    );
  };

  const filteredComplaints = complaints.filter((item) => {
    if (filter === 'ACTIVE') return isComplaintActive(item.status);
    if (filter === 'RESOLVED') return !isComplaintActive(item.status);
    return true;
  });

  const activeCount = complaints.filter((c) => isComplaintActive(c.status)).length;
  const resolvedCount = complaints.length - activeCount;

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            My Complaints
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {complaints.length} registered grievances · Room {currentUser?.roomNumber || 'B-203'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white shadow-xs cursor-pointer transition-all"
            title="Refresh Complaints"
          >
            <ArrowClockwise
              size={16}
              className={isRefreshing ? 'animate-spin text-red-600' : ''}
            />
          </button>

          <button
            onClick={onOpenNewModal}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} weight="bold" />
            <span>New Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Section 16: All, Active, Resolved/Closed) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          All ({complaints.length})
        </button>

        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'ACTIVE'
              ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Active ({activeCount})</span>
        </button>

        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'
          }`}
        >
          <CheckCircle size={14} weight="bold" />
          <span>Resolved/Closed ({resolvedCount})</span>
        </button>
      </div>

      {/* Loading Skeleton State (Section 18) */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-3"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/4" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Error State (Section 19) */
        <div className="py-14 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <Warning size={36} className="mx-auto text-red-500" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Unable to load your complaints.
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            There was a problem reaching the server. Please check your connection and try again.
          </p>
          <button
            onClick={fetchStudentComplaints}
            className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        /* Empty State (Section 17) */
        <div className="py-16 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <CheckCircle size={42} className="mx-auto text-emerald-500" />
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              No complaints yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Submit a complaint and track its progress here.
            </p>
          </div>
          <button
            onClick={onOpenNewModal}
            className="mt-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-600/20"
          >
            Create Complaint
          </button>
        </div>
      ) : (
        /* Complaints List */
        <div className="space-y-3">
          {filteredComplaints.map((item) => {
            const statusConfig = getStudentStatusConfig(item.status);
            const priorityInfo = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.MEDIUM;
            const isClosed =
              item.status === 'CLOSED' ||
              item.status === 'RESOLVED' ||
              item.status === 'STUDENT_CONFIRMED';

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -1 }}
                onClick={() => navigate(`/student/complaints/${item.id}`)}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-600/40 hover:shadow-md cursor-pointer transition-all space-y-3.5 group"
              >
                {/* Top Row: Code, Category, Date */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                      #{item.code}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize font-mono">
                      {item.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <CalendarBlank size={13} />
                    <span>{formatDate(item.createdAt)} · {formatTime(item.createdAt)}</span>
                  </div>
                </div>

                {/* Middle: Title, Short Description, Room */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-zinc-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0 mt-0.5">
                      <ArrowRight size={16} weight="bold" />
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono pt-1">
                    <MapPin size={13} className="text-red-600" />
                    <span>Room {item.roomNumber} ({item.block})</span>
                  </div>
                </div>

                {/* Bottom Row: Status Badge, Priority, SLA State */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Clear Status Badge (Section 2) */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                      <span>{statusConfig.label}</span>
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${priorityInfo.badgeClass}`}
                    >
                      {priorityInfo.label}
                    </span>

                    {/* Escalation Flag */}
                    {item.isEscalated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-600/15 text-red-600 dark:text-red-400 border border-red-600/30 font-mono">
                        <ShieldWarning size={12} weight="bold" />
                        <span>ESCALATED</span>
                      </span>
                    )}
                  </div>

                  {/* SLA / Last Updated */}
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                    {item.slaDeadline && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {isClosed ? (
                          <span className="text-emerald-500 font-semibold">Completed</span>
                        ) : item.slaState === 'BREACHED' || item.slaRemainingMinutes <= 0 ? (
                          <span className="text-red-500 font-semibold">Taking longer than expected</span>
                        ) : (
                          <span>Due {formatTime(item.slaDeadline)}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
