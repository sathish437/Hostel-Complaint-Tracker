import React from 'react';
import { StorageService } from '../services/storage';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import {
  ChartPie,
  UsersThree,
} from '@phosphor-icons/react';

export const AnalyticsPage: React.FC = () => {
  const complaints = StorageService.getComplaints();
  const staffList = StorageService.getStaff();

  const total = complaints.length;
  const breachedCount = complaints.filter(
    (c) =>
      c.status === 'SLA_BREACHED' ||
      (c.status !== 'CLOSED' && c.status !== 'RESOLVED' && c.slaRemainingMinutes <= 0)
  ).length;

  const onTimeCount = total - breachedCount;
  const complianceRate = total > 0 ? Math.round((onTimeCount / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] uppercase font-mono font-bold text-red-600 dark:text-red-500">
            Hostel Intelligence & Reporting
          </span>
          <span className="text-zinc-400">·</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Performance Telemetry</span>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <ChartPie size={26} className="text-red-600 dark:text-red-500" />
          SLA Performance & Resolution Analytics
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
          Granular SLA compliance metrics, trade specialization turnaround times, and field technician dispatch efficiency.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
          <div className="text-xs uppercase font-mono font-bold text-zinc-500">Total Grievances Processed</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">{total}</div>
          <div className="text-xs text-zinc-400 font-mono">Across 5 hostel blocks</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
          <div className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">On-Time SLA Delivery</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{complianceRate}%</div>
          <div className="text-xs text-zinc-400 font-mono">{onTimeCount} delivered on schedule</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
          <div className="text-xs uppercase font-mono font-bold text-red-600 dark:text-red-500">SLA Breach Frequency</div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-500">
            {total > 0 ? Math.round((breachedCount / total) * 100) : 0}%
          </div>
          <div className="text-xs text-zinc-400 font-mono">{breachedCount} tickets breached</div>
        </div>
      </div>

      {/* Staff Dispatch Velocity Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <UsersThree size={18} className="text-red-600 dark:text-red-500" />
          Field Technician Workload & Response Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <th className="py-2.5 px-3">Technician</th>
                <th className="py-2.5 px-3">Trade Role</th>
                <th className="py-2.5 px-3">Active Tickets</th>
                <th className="py-2.5 px-3">Categories Handled</th>
                <th className="py-2.5 px-3">Duty Status</th>
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
