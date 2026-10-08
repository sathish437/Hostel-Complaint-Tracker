import { ComplaintStatus, Priority } from '../types';

export interface StatusConfig {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const STUDENT_STATUS_MAP: Record<ComplaintStatus, StatusConfig> = {
  SUBMITTED: {
    label: 'Submitted',
    description: 'Your complaint has been submitted and is queued for staff review.',
    bgClass: 'bg-zinc-100 dark:bg-zinc-800',
    textClass: 'text-zinc-700 dark:text-zinc-300',
    borderClass: 'border-zinc-300 dark:border-zinc-700',
    dotClass: 'bg-zinc-500',
  },
  ASSIGNED: {
    label: 'Assigned',
    description: 'Your complaint has been assigned to a trade technician.',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    description: 'The assigned technician has accepted the ticket and scheduled inspection.',
    bgClass: 'bg-sky-500/10',
    textClass: 'text-sky-700 dark:text-sky-400',
    borderClass: 'border-sky-500/30',
    dotClass: 'bg-sky-500',
  },
  IN_PROGRESS: {
    label: 'Work in Progress',
    description: 'Your complaint has been assigned and work is currently in progress on-site.',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-800 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  RESOLUTION_PENDING: {
    label: 'Waiting for Your Confirmation',
    description: 'The staff member has marked this complaint as resolved. Please verify if the problem was actually fixed.',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-800 dark:text-orange-400',
    borderClass: 'border-orange-500/40',
    dotClass: 'bg-orange-500 animate-pulse',
  },
  STUDENT_CONFIRMED: {
    label: 'Resolution Confirmed',
    description: 'You confirmed that the problem in your room is completely resolved.',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Closed & Resolved',
    description: 'This complaint has been verified and officially closed.',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  RESOLVED: {
    label: 'Resolved',
    description: 'Work on this grievance has been completed.',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-500/25',
    dotClass: 'bg-emerald-500',
  },
  REOPENED: {
    label: 'Reopened',
    description: 'You indicated that the problem still exists. Staff has been notified to re-inspect.',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-700 dark:text-rose-400',
    borderClass: 'border-rose-500/30',
    dotClass: 'bg-rose-500 animate-pulse',
  },
  SLA_BREACHED: {
    label: 'Taking Longer Than Expected',
    description: 'This issue has exceeded the standard turnaround time. Supervisory staff has been alerted.',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500/35',
    dotClass: 'bg-red-600 animate-pulse',
  },
  ESCALATED: {
    label: 'Escalated to Leadership',
    description: 'This complaint has been escalated to hostel leadership for immediate supervision.',
    bgClass: 'bg-red-600/20',
    textClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-600/40',
    dotClass: 'bg-red-600 animate-pulse',
  },
};

export const getStudentStatusConfig = (status: ComplaintStatus): StatusConfig => {
  return STUDENT_STATUS_MAP[status] || STUDENT_STATUS_MAP.SUBMITTED;
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string }> = {
  CRITICAL: {
    label: 'Critical',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  },
  EMERGENCY: {
    label: 'Emergency',
    badgeClass: 'bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/40',
  },
  HIGH: {
    label: 'High',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  },
  MEDIUM: {
    label: 'Medium',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  LOW: {
    label: 'Low',
    badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  },
};
