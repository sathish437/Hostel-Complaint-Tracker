import React, { useState } from 'react';
import { Complaint, SystemSettings, StaffMember } from '../types';
import { StorageService } from '../services/storage';
import { ComplaintService, CATEGORY_ROUTING } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SlaTimer } from '../components/ui/SlaTimer';
import {
  Plus,
  Robot,
  HandGrabbing,
  UserSwitch,
  MapPin,
  Clock,
  CheckCircle,
  Warning,
  MagnifyingGlass,
  UsersThree,
} from '@phosphor-icons/react';

interface HostelOfficeDashboardProps {
  complaints: Complaint[];
  settings: SystemSettings;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenAssignModal: (complaint: Complaint) => void;
}

type OfficeTab = 'NEEDS_ATTENTION' | 'UNASSIGNED' | 'SLA_RISK' | 'ESCALATED' | 'ALL_ACTIVE' | 'RESOLVED';

export const HostelOfficeDashboard: React.FC<HostelOfficeDashboardProps> = ({
  complaints,
  settings,
  onSettingsUpdated,
  onSelectComplaint,
  onOpenAssignModal,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<OfficeTab>('NEEDS_ATTENTION');
  const [search, setSearch] = useState('');
  const [showStaffWorkload, setShowStaffWorkload] = useState(false);

  const staffMembers = StorageService.getStaff();

  // Metrics computation per Section 14
  const activeComplaints = complaints.filter(
    (c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED' && c.status !== 'STUDENT_CONFIRMED'
  );

  const unassignedList = complaints.filter(
    (c) => (c.status === 'SUBMITTED' || !c.assignedStaffId) && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  );

  const slaRiskList = complaints.filter(
    (c) =>
      c.status !== 'CLOSED' &&
      c.status !== 'RESOLVED' &&
      (c.status === 'SLA_BREACHED' ||
        c.slaRemainingMinutes <= 0 ||
        (c.slaRemainingMinutes > 0 && c.slaRemainingMinutes <= Math.max(120, c.slaTotalMinutes * 0.25)))
  );

  const escalatedList = complaints.filter(
    (c) => (c.isEscalated || c.status === 'ESCALATED') && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
  );

  const needsAttentionList = complaints.filter(
    (c) =>
      c.status !== 'CLOSED' &&
      c.status !== 'RESOLVED' &&
      (c.status === 'SUBMITTED' ||
        !c.assignedStaffId ||
        c.isEscalated ||
        c.status === 'ESCALATED' ||
        c.status === 'SLA_BREACHED' ||
        c.status === 'REOPENED' ||
        c.slaRemainingMinutes <= Math.max(120, c.slaTotalMinutes * 0.25))
  );

  const resolvedList = complaints.filter(
    (c) => c.status === 'CLOSED' || c.status === 'RESOLVED' || c.status === 'STUDENT_CONFIRMED'
  );

  // Toggle Automation per Section 15
  const isAuto = settings.assignmentAutomationEnabled;

  const handleToggleAutomation = () => {
    const newMode = !isAuto;
    const updated = ComplaintService.toggleAutomationMode(newMode, {
      name: currentUser.name || currentUser.fullName || 'Admin',
      role: currentUser.role,
    });
    onSettingsUpdated(updated);
    showToast(
      `Assignment Automation is now ${newMode ? 'ON' : 'OFF'}`,
      newMode ? 'success' : 'info'
    );
  };

  // Filter based on active tab & search
  const getTabList = () => {
    switch (activeTab) {
      case 'NEEDS_ATTENTION':
        return needsAttentionList;
      case 'UNASSIGNED':
        return unassignedList;
      case 'SLA_RISK':
        return slaRiskList;
      case 'ESCALATED':
        return escalatedList;
      case 'ALL_ACTIVE':
        return activeComplaints;
      case 'RESOLVED':
        return resolvedList;
      default:
        return activeComplaints;
    }
  };

  const currentTabItems = getTabList();

  const filtered = search.trim()
    ? currentTabItems.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
          (c.assignedStaffName && c.assignedStaffName.toLowerCase().includes(search.toLowerCase()))
      )
    : currentTabItems;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Top Section per Section 14 & 15 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
            Operations Console
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Hostel Office
          </h1>
          <p className="text-sm text-zinc-500">
            Dispatch, assignment control & SLA management
          </p>
        </div>

        {/* Action Buttons & Automation Toggle per Section 14 & 15 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Assignment Automation Toggle */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
              Assignment Automation:
            </span>
            <button
              onClick={handleToggleAutomation}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAuto
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAuto ? 'bg-white animate-pulse' : 'bg-zinc-500'}`} />
              <span>{isAuto ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Quick Assign / Workload Button */}
          <button
            onClick={() => setShowStaffWorkload((prev) => !prev)}
            className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <UsersThree size={16} />
            <span>Staff Workload</span>
          </button>

          {unassignedList.length > 0 && (
            <button
              onClick={() => onOpenAssignModal(unassignedList[0])}
              className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={16} weight="bold" />
              <span>+ New Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Staff Workload Drawer (Section 16: Workload-Aware Assignment) */}
      {showStaffWorkload && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Worker Workload & Availability (Section 16)
              </h3>
              <p className="text-xs text-zinc-500">
                Live capacity tracking ensures complaints are not blindly assigned to overloaded workers.
              </p>
            </div>
            <button
              onClick={() => setShowStaffWorkload(false)}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {staffMembers.map((staff) => {
              const activeCount = complaints.filter(
                (c) => c.assignedStaffId === staff.id && c.status !== 'CLOSED' && c.status !== 'RESOLVED'
              ).length;
              const isBusy = activeCount >= 3;

              return (
                <div
                  key={staff.id}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {staff.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isBusy
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {isBusy ? 'Busy' : 'Available'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 capitalize">
                    {staff.role.toLowerCase().replace('_', ' ')}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-400 font-mono">Active Work:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{activeCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Important Numbers per Section 14 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active */}
        <button
          onClick={() => setActiveTab('ALL_ACTIVE')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ALL_ACTIVE'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="text-xs font-mono font-bold uppercase opacity-75">
            Active
          </div>
          <div className="text-3xl font-black mt-1">
            {activeComplaints.length}
          </div>
        </button>

        {/* Unassigned */}
        <button
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'UNASSIGNED'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="text-xs font-mono font-bold uppercase opacity-75 flex items-center justify-between">
            <span>Unassigned</span>
            {unassignedList.length > 0 && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
          </div>
          <div className="text-3xl font-black mt-1">
            {unassignedList.length}
          </div>
        </button>

        {/* SLA Risk */}
        <button
          onClick={() => setActiveTab('SLA_RISK')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'SLA_RISK'
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="text-xs font-mono font-bold uppercase opacity-75">
            SLA Risk
          </div>
          <div className="text-3xl font-black mt-1">
            {slaRiskList.length}
          </div>
        </button>

        {/* Escalated */}
        <button
          onClick={() => setActiveTab('ESCALATED')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'ESCALATED'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="text-xs font-mono font-bold uppercase opacity-75">
            Escalated
          </div>
          <div className="text-3xl font-black mt-1">
            {escalatedList.length}
          </div>
        </button>
      </div>

      {/* 4. Queue Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('NEEDS_ATTENTION')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'NEEDS_ATTENTION'
                ? 'bg-red-600 text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Needs Attention ({needsAttentionList.length})
          </button>

          <button
            onClick={() => setActiveTab('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'UNASSIGNED'
                ? 'bg-red-600 text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Unassigned ({unassignedList.length})
          </button>

          <button
            onClick={() => setActiveTab('ALL_ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'ALL_ACTIVE'
                ? 'bg-red-600 text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            All Active ({activeComplaints.length})
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'RESOLVED'
                ? 'bg-red-600 text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Resolved ({resolvedList.length})
          </button>
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room, title, ID..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>
      </div>

      {/* 5. Complaint Queue Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-14 px-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-2">
            <CheckCircle size={36} className="mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              All caught up
            </h3>
            <p className="text-xs text-zinc-500">
              No complaints in this queue view.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnassigned = !item.assignedStaffId || item.status === 'SUBMITTED';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div
                  onClick={() => onSelectComplaint(item)}
                  className="space-y-2 flex-1 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      #{item.code}
                    </span>
                    <PriorityBadge priority={item.priority} size="sm" />
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500 capitalize">
                      {item.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-semibold">
                      <MapPin size={13} className="text-red-600" />
                      {item.block}, Room {item.roomNumber}
                    </span>
                    <span>·</span>
                    <span>Student: {item.studentName}</span>
                    <span>·</span>
                    <span>
                      Worker: {item.assignedStaffName || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Right Action & SLA Box */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                  <div className="text-xs font-mono">
                    <SlaTimer
                      deadline={item.slaDeadline}
                      totalMinutes={item.slaTotalMinutes}
                      status={item.status}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isUnassigned ? (
                      <button
                        onClick={() => onOpenAssignModal(item)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserSwitch size={14} weight="bold" />
                        <span>Assign Worker</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenAssignModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <UserSwitch size={13} />
                        <span>Reassign</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectComplaint(item)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
