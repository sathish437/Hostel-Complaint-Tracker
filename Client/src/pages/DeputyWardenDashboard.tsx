import React from 'react';
import { Complaint, StaffMember } from '../types';
import { StorageService } from '../services/storage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import {
  WarningOctagon,
  ShieldWarning,
  ArrowCounterClockwise,
  UsersThree,
  UserSwitch,
  ClockAfternoon,
} from '@phosphor-icons/react';

interface DeputyWardenDashboardProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenAssignModal: (complaint: Complaint) => void;
}

export const DeputyWardenDashboard: React.FC<DeputyWardenDashboardProps> = ({
  complaints,
  onSelectComplaint,
  onOpenAssignModal,
}) => {
  const staffList = StorageService.getStaff();

  const escalatedComplaints = complaints.filter(
    (c) => c.isEscalated || c.status === 'ESCALATED'
  );
  const slaBreachedComplaints = complaints.filter(
    (c) =>
      c.status === 'SLA_BREACHED' ||
      (c.status !== 'CLOSED' && c.status !== 'RESOLVED' && c.slaRemainingMinutes <= 0)
  );
  const highPriorityComplaints = complaints.filter(
    (c) => (c.priority === 'HIGH' || c.priority === 'CRITICAL' || c.priority === 'EMERGENCY') && c.status !== 'CLOSED'
  );
  const reopenedComplaints = complaints.filter((c) => c.status === 'REOPENED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] uppercase font-mono font-bold text-red-600 dark:text-red-500">
            Hostel Supervisory Authority
          </span>
          <span className="text-zinc-400">·</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Deputy Warden Console</span>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Incident Escalation & SLA Breach Desk
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
          Supervise critical escalations, arbitrate reopened complaints, monitor technician workload bottlenecks, and take emergency operational interventions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-500 uppercase font-mono">
            <ShieldWarning size={16} /> Active Escalations
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{escalatedComplaints.length}</div>
          <div className="text-[11px] text-zinc-400 font-mono">Requires leadership review</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-500 uppercase font-mono">
            <WarningOctagon size={16} /> SLA Breaches
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">{slaBreachedComplaints.length}</div>
          <div className="text-[11px] text-zinc-400 font-mono">Overdue resolution window</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase font-mono">
            <ClockAfternoon size={16} /> High & Critical
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{highPriorityComplaints.length}</div>
          <div className="text-[11px] text-zinc-400 font-mono">Fast-track response</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase font-mono">
            <ArrowCounterClockwise size={16} /> Reopened Cases
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{reopenedComplaints.length}</div>
          <div className="text-[11px] text-zinc-400 font-mono">Rejected by resident</div>
        </div>
      </div>

      {/* Escalated Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldWarning size={18} className="text-red-600 dark:text-red-500" />
            Active Escalations ({escalatedComplaints.length})
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Priority Intervention Queue</span>
        </div>

        {escalatedComplaints.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 text-xs font-mono">
            Zero active escalations. All departments operating within normal thresholds.
          </div>
        ) : (
          escalatedComplaints.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-red-500/40 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                    {item.code}
                  </span>
                  <CategoryBadge category={item.category} />
                  <PriorityBadge priority={item.priority} />
                  <StatusBadge status={item.status} />
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 font-mono font-bold">
                  Escalation Level: {item.escalationLevel || 'DEPUTY_WARDEN'}
                </span>
              </div>

              <div>
                <h3
                  onClick={() => onSelectComplaint(item)}
                  className="text-base font-bold text-zinc-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                >
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{item.description}</p>
              </div>

              {/* Justification */}
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 text-xs space-y-1">
                <div className="font-semibold text-red-700 dark:text-red-300">Escalation Justification:</div>
                <div className="text-zinc-600 dark:text-zinc-300 italic">
                  "{item.escalationReason || 'Automatic trigger due to SLA breach and unresolved risk.'}"
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-3 text-zinc-500">
                  <span>Current Technician: {item.assignedStaffName || 'Unassigned'}</span>
                  <span>·</span>
                  <span>Room: {item.block} - {item.roomNumber}</span>
                  <span>·</span>
                  <span>Resident: {item.studentName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAssignModal(item)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserSwitch size={14} /> Reassign Owner
                  </button>
                  <button
                    onClick={() => onSelectComplaint(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors cursor-pointer"
                  >
                    Manage Incident →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Staff Bottleneck Monitor */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <UsersThree size={18} className="text-red-600 dark:text-red-500" />
            Field Staff Workload & Availability Tracker
          </h3>
          <span className="text-xs text-zinc-500 font-mono">{staffList.length} Technicians</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staffList.map((st) => (
            <div
              key={st.id}
              className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-zinc-900 dark:text-white text-xs">{st.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{st.role}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Phone: {st.phone}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                  {st.activeJobsCount} Active
                </span>
                <span
                  className={`block text-[10px] font-semibold mt-0.5 ${
                    st.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {st.isAvailable ? 'AVAILABLE' : 'BUSY'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
