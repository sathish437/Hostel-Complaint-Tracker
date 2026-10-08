import React, { useState } from 'react';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { SlaTimer } from '../components/ui/SlaTimer';
import { CheckCircle, MapPin, Clock, ArrowRight } from '@phosphor-icons/react';

interface StaffDashboardProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  complaints,
  onSelectComplaint,
}) => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  if (!currentUser) return null;

  // Trade category mapping per Section 12
  const getRoleCategory = (role: string) => {
    switch (role) {
      case 'ELECTRICIAN':
        return 'ELECTRICAL';
      case 'CLEANING_WORKER':
        return 'CLEANING_HYGIENE';
      case 'MASTER':
        return 'FOOD_MESS';
      case 'WATCHMAN':
        return 'SECURITY';
      default:
        return null;
    }
  };

  const tradeCategory = getRoleCategory(currentUser.role);

  // Filter complaints assigned to this worker, role, or matching trade category
  const workerJobs = complaints.filter((c) => {
    if (c.assignedStaffId === currentUser.id) return true;
    if (c.assignedStaffRole === currentUser.role) return true;
    if (tradeCategory && c.category === tradeCategory) return true;
    return false;
  });

  const displayList = workerJobs.length > 0 ? workerJobs : complaints;

  const criticalCount = displayList.filter(
    (c) => (c.priority === 'CRITICAL' || c.priority === 'EMERGENCY') && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  ).length;

  const highCount = displayList.filter(
    (c) => c.priority === 'HIGH' && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  ).length;

  const mediumCount = displayList.filter(
    (c) => c.priority === 'MEDIUM' && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  ).length;

  const lowCount = displayList.filter(
    (c) => c.priority === 'LOW' && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  ).length;

  const filtered = displayList.filter((c) => {
    if (filter === 'CRITICAL') {
      return (c.priority === 'CRITICAL' || c.priority === 'EMERGENCY') && c.status !== 'CLOSED';
    }
    if (filter === 'ACTIVE') {
      return c.status === 'ASSIGNED' || c.status === 'ACKNOWLEDGED' || c.status === 'IN_PROGRESS' || c.status === 'REOPENED';
    }
    if (filter === 'RESOLVED') {
      return c.status === 'CLOSED' || c.status === 'RESOLVED' || c.status === 'RESOLUTION_PENDING' || c.status === 'STUDENT_CONFIRMED';
    }
    return true;
  });

  const displayName = currentUser.name || currentUser.fullName || 'Technician';
  const workerFirstName = displayName.split(' ')[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Worker Header per Section 12 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
            {currentUser.role.replace('_', ' ')} FIELD QUEUE
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Good morning, {workerFirstName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your Work Queue
          </p>
        </div>

        {/* 2. Work Queue Priority Counters per Section 12 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => setFilter(filter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filter === 'CRITICAL'
                ? 'bg-red-500/10 border-red-500 shadow-sm'
                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Critical</span>
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-500 mt-1">
              {criticalCount}
            </div>
          </button>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="text-2xl font-black text-orange-500 mt-1">
              {highCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium</span>
            </div>
            <div className="text-2xl font-black text-amber-500 mt-1">
              {mediumCount}
            </div>
          </div>

          <div className="hidden sm:block p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Low</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {lowCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            All Work ({displayList.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'ACTIVE'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'RESOLVED'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* 3. Work Queue Complaint Cards per Section 12 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          /* Empty State per Section 24 */
          <div className="py-14 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
            <CheckCircle size={36} className="mx-auto text-emerald-500" />
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No pending work
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                You're all caught up.
              </p>
            </div>
          </div>
        ) : (
          filtered.map((job) => {
            const isCritical = job.priority === 'CRITICAL' || job.priority === 'EMERGENCY';
            const isHigh = job.priority === 'HIGH';
            const isMedium = job.priority === 'MEDIUM';

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isCritical
                          ? 'bg-red-600 animate-pulse'
                          : isHigh
                          ? 'bg-orange-500'
                          : isMedium
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      #{job.code}
                    </span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500 capitalize">
                      {job.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-semibold">
                      <MapPin size={13} className="text-red-600" />
                      Room {job.roomNumber} ({job.block})
                    </span>
                    <span>·</span>
                    <span>Student: {job.studentName}</span>
                  </div>
                </div>

                {/* SLA and View Complaint Button */}
                <div className="sm:text-right shrink-0 space-y-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-xs font-mono">
                    <SlaTimer
                      deadline={job.slaDeadline}
                      totalMinutes={job.slaTotalMinutes}
                      status={job.status}
                    />
                  </div>

                  <button
                    onClick={() => onSelectComplaint(job)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View Complaint</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

