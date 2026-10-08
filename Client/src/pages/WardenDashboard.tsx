import React from 'react';
import { Complaint, ComplaintCategory } from '../types';
import { StorageService } from '../services/storage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import {
  ChartBar,
  ShieldCheck,
  WarningOctagon,
  UsersThree,
  ArrowClockwise,
  CheckCircle,
  FileText,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

interface WardenDashboardProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export const WardenDashboard: React.FC<WardenDashboardProps> = ({
  complaints,
  onSelectComplaint,
}) => {
  const staffList = StorageService.getStaff();
  const auditLogs = StorageService.getAuditLogs().slice(0, 5);

  const total = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'SUBMITTED').length;
  const assignedCount = complaints.filter((c) => c.status === 'ASSIGNED' || c.status === 'ACKNOWLEDGED').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'RESOLUTION_PENDING').length;
  const closedCount = complaints.filter((c) => c.status === 'CLOSED').length;
  const escalatedCount = complaints.filter((c) => c.isEscalated || c.status === 'ESCALATED').length;
  const slaBreachedCount = complaints.filter(
    (c) =>
      c.status === 'SLA_BREACHED' ||
      (c.status !== 'CLOSED' && c.status !== 'RESOLVED' && c.slaRemainingMinutes <= 0)
  ).length;

  const resolutionRate = total > 0 ? Math.round(((closedCount + resolvedCount) / total) * 100) : 0;
  const slaCompliance = total > 0 ? Math.round(((total - slaBreachedCount) / total) * 100) : 100;
  const slaBreachRate = total > 0 ? Math.round((slaBreachedCount / total) * 100) : 0;

  const categories: ComplaintCategory[] = [
    'ELECTRICAL',
    'WATER_PLUMBING',
    'CLEANING_HYGIENE',
    'FOOD_MESS',
    'SECURITY',
    'ROOM_FURNITURE',
    'INTERNET',
    'GENERAL',
  ];

  const categoryStats = categories.map((cat) => {
    const count = complaints.filter((c) => c.category === cat).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { category: cat, count, percentage };
  });

  const repeatedComplaints = complaints.filter((c) => c.isRepeatedIssue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase font-mono font-bold text-red-600 dark:text-red-500">
              Institutional Governance
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Chief Warden Console</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Institutional Operations & SLA Analytics
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
            Complete institutional visibility across category distribution, recurring defects, staff resolution velocities, and compliance audit logs.
          </p>
        </div>

        <Link
          to="/audit-logs"
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FileText size={16} />
          <span>Full Audit Ledger</span>
        </Link>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Tickets', val: total, color: 'text-zinc-900 dark:text-white' },
          { label: 'Unassigned Open', val: openCount, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Assigned', val: assignedCount, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'In Progress', val: inProgressCount, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Pending Review', val: resolvedCount, color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Closed / Done', val: closedCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Escalated', val: escalatedCount, color: 'text-red-600 dark:text-red-500' },
          { label: 'SLA Breached', val: slaBreachedCount, color: 'text-red-600 dark:text-red-500' },
        ].map((item, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-zinc-500 line-clamp-1">{item.label}</div>
            <div className={`text-xl font-bold mt-1 ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Dual Meters: SLA Compliance & Breach Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldCheck size={16} /> SLA Compliance Rate
            </span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white">{slaCompliance}%</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${slaCompliance}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {total - slaBreachedCount} of {total} grievances handled within deadline.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
              <WarningOctagon size={16} /> SLA Breach Rate
            </span>
            <span className="text-lg font-bold font-mono text-red-600 dark:text-red-400">{slaBreachRate}%</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-700"
              style={{ width: `${slaBreachRate}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {slaBreachedCount} tickets exceeded SLA duration.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <CheckCircle size={16} /> Gross Resolution Rate
            </span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white">{resolutionRate}%</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-700"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {closedCount + resolvedCount} completed tickets.
          </p>
        </div>
      </div>

      {/* Category Breakdown & Recurring Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <ChartBar size={18} className="text-red-600 dark:text-red-500" />
            Category Incident Distribution
          </h3>

          <div className="space-y-3">
            {categoryStats.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <CategoryBadge category={item.category} />
                  <span className="text-xs font-mono text-zinc-500">
                    {item.count} tickets ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-red-600 dark:bg-red-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeated Complaints Hotspots */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <ArrowClockwise size={18} className="text-amber-600 dark:text-amber-500" />
            Recurring Infrastructure Hotspots
          </h3>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Rule-based detection flags rooms with repeated defects for systemic overhaul.
          </p>

          <div className="space-y-2.5">
            {repeatedComplaints.length === 0 ? (
              <div className="text-xs text-zinc-500 py-6 text-center font-mono">
                No repeated defects detected in current log.
              </div>
            ) : (
              repeatedComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectComplaint(c)}
                  className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 hover:border-amber-400 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400 font-mono">
                      {c.block} - Room {c.roomNumber}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      Repeated
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">{c.title}</p>
                  <div className="text-[10px] text-zinc-500 font-mono">Category: {c.category}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Staff Workload Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <UsersThree size={18} className="text-red-600 dark:text-red-500" />
          Technician Fleet Workload Distribution
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Active Work Orders</th>
                <th className="py-2.5 px-3">Categories Handled</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-white">{st.name}</td>
                  <td className="py-3 px-3 text-red-600 dark:text-red-400">{st.role}</td>
                  <td className="py-3 px-3 font-bold">{st.activeJobsCount}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 flex-wrap">
                      {st.categoryHandled.map((c) => (
                        <CategoryBadge key={c} category={c} showIcon={false} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        st.isAvailable
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {st.isAvailable ? 'AVAILABLE' : 'BUSY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
