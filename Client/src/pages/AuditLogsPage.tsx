import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { AuditLog } from '../types';
import {
  FileText,
  MagnifyingGlass,
  ArrowRight,
} from '@phosphor-icons/react';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const logs = StorageService.getAuditLogs();

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] uppercase font-mono font-bold text-red-600 dark:text-red-500">
            System Integrity & Compliance
          </span>
          <span className="text-zinc-400">·</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Immutable Audit Ledger</span>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileText size={26} className="text-red-600 dark:text-red-500" />
          Administrative Audit Trail
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
          Tamper-evident record of operational transitions including technician assignments, automation overrides, escalations, and resident sign-offs.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, ticket code, action, or reason..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-red-600 font-mono"
        >
          <option value="ALL">All Event Types</option>
          <option value="AUTO_ASSIGN">AUTO_ASSIGN</option>
          <option value="MANUAL_ASSIGN">MANUAL_ASSIGN</option>
          <option value="OVERRIDE_REASSIGN">OVERRIDE_REASSIGN</option>
          <option value="SETTINGS_CHANGED">SETTINGS_CHANGED</option>
          <option value="CONFIRM_RESOLUTION">CONFIRM_RESOLUTION</option>
          <option value="REOPEN_COMPLAINT">REOPEN_COMPLAINT</option>
          <option value="ESCALATE">ESCALATE</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Recorded Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const d = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                        {log.actorName}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-red-600 dark:text-red-400 bg-red-600/10 px-2 py-0.5 rounded border border-red-600/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-bold">{log.entityId}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.oldValue && log.newValue ? (
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <span>{log.oldValue}</span>
                            <ArrowRight size={12} className="text-red-600 dark:text-red-500" />
                            <span className="text-zinc-900 dark:text-white font-semibold">{log.newValue}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 italic max-w-xs truncate">
                        {log.reason || 'Operational update'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
