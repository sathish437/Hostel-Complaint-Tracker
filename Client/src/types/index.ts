export type UserRole =
  | 'STUDENT'
  | 'HOSTEL_OFFICE'
  | 'ELECTRICIAN'
  | 'CLEANING_WORKER'
  | 'MASTER'
  | 'WATCHMAN'
  | 'DEPUTY_WARDEN'
  | 'WARDEN';

export type ComplaintCategory =
  | 'ELECTRICAL'
  | 'WATER_PLUMBING'
  | 'CLEANING_HYGIENE'
  | 'FOOD_MESS'
  | 'SECURITY'
  | 'ROOM_FURNITURE'
  | 'INTERNET'
  | 'GENERAL';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLUTION_PENDING'
  | 'RESOLVED'
  | 'STUDENT_CONFIRMED'
  | 'CLOSED'
  | 'REOPENED'
  | 'SLA_BREACHED'
  | 'ESCALATED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export type SlaStatusState = 'RUNNING' | 'APPROACHING' | 'BREACHED' | 'MET';

export type NotificationType =
  | 'COMPLAINT_CREATED'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'STATUS_CHANGED'
  | 'SLA_APPROACHING'
  | 'SLA_BREACHED'
  | 'ESCALATED'
  | 'RESOLUTION_PENDING'
  | 'REOPENED'
  | 'CLOSED';

// Single authenticated User entity model matching backend contract
export interface User {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: UserRole;
  active?: boolean;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Residential and identity context fields
  roomNumber?: string;
  block?: string;
  studentId?: string;
  avatarUrl?: string;
  username?: string;
}

export interface TimelineEvent {
  id: string;
  complaintId: string;
  action: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  extraData?: Record<string, any>;
}

export interface Complaint {
  id: string;
  code: string; // e.g. CMP-1024
  studentId: string;
  studentName: string;
  roomNumber: string;
  block: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: UserRole;
  evidenceUrl?: string;
  completionProofUrl?: string;
  staffNotes?: string;
  reopenReason?: string;
  
  // SLA Fields
  createdAt: string;
  updatedAt: string;
  slaDeadline: string; // ISO string
  slaTotalMinutes: number;
  slaRemainingMinutes: number;
  slaState: SlaStatusState;
  
  // Escalation Fields
  isEscalated: boolean;
  escalationLevel?: 'DEPUTY_WARDEN' | 'WARDEN';
  escalationReason?: string;
  escalatedAt?: string;

  // Metadata
  isRepeatedIssue?: boolean;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  assignmentAutomationEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  categoryHandled: ComplaintCategory[];
  phone: string;
  activeJobsCount: number;
  isAvailable: boolean;
}
