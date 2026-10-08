import {
  User,
  Complaint,
  StaffMember,
  AuditLog,
  NotificationItem,
  SystemSettings,
  TimelineEvent,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COMPLAINTS,
  INITIAL_STAFF,
  INITIAL_TIMELINE,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
} from './seedData';

const KEYS = {
  USERS: 'hct_users',
  COMPLAINTS: 'hct_complaints',
  STAFF: 'hct_staff',
  TIMELINE: 'hct_timeline',
  AUDIT_LOGS: 'hct_audit_logs',
  SETTINGS: 'hct_settings',
  NOTIFICATIONS: 'hct_notifications',
  CURRENT_USER: 'hct_current_user',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const StorageService = {
  getUsers: (): User[] => getStored<User[]>(KEYS.USERS, INITIAL_USERS),
  saveUsers: (users: User[]) => setStored(KEYS.USERS, users),

  getComplaints: (): Complaint[] => getStored<Complaint[]>(KEYS.COMPLAINTS, INITIAL_COMPLAINTS),
  saveComplaints: (complaints: Complaint[]) => setStored(KEYS.COMPLAINTS, complaints),

  getStaff: (): StaffMember[] => getStored<StaffMember[]>(KEYS.STAFF, INITIAL_STAFF),
  saveStaff: (staff: StaffMember[]) => setStored(KEYS.STAFF, staff),

  getTimeline: (complaintId: string): TimelineEvent[] => {
    const all = getStored<Record<string, TimelineEvent[]>>(KEYS.TIMELINE, INITIAL_TIMELINE);
    return all[complaintId] || [];
  },
  addTimelineEvent: (event: TimelineEvent) => {
    const all = getStored<Record<string, TimelineEvent[]>>(KEYS.TIMELINE, INITIAL_TIMELINE);
    const list = all[event.complaintId] || [];
    all[event.complaintId] = [event, ...list];
    setStored(KEYS.TIMELINE, all);
  },

  getAuditLogs: (): AuditLog[] => getStored<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  addAuditLog: (log: AuditLog) => {
    const logs = getStored<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStored(KEYS.AUDIT_LOGS, [log, ...logs]);
  },

  getSettings: (): SystemSettings => getStored<SystemSettings>(KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: SystemSettings) => setStored(KEYS.SETTINGS, settings),

  getNotifications: (): NotificationItem[] => getStored<NotificationItem[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (items: NotificationItem[]) => setStored(KEYS.NOTIFICATIONS, items),

  getCurrentUser: (): User => {
    return getStored<User>(KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },
  saveCurrentUser: (user: User) => setStored(KEYS.CURRENT_USER, user),

  resetToDefaults: () => {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.COMPLAINTS);
    localStorage.removeItem(KEYS.STAFF);
    localStorage.removeItem(KEYS.TIMELINE);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    window.location.reload();
  },
};
