import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  Priority,
  TimelineEvent,
  AuditLog,
  NotificationItem,
  UserRole,
  StaffMember,
} from '../types';
import { StorageService } from './storage';

// SLA rule mapping in minutes based on priority (Section 17 & 18)
export const SLA_HOURS: Record<Priority, number> = {
  CRITICAL: 4,
  EMERGENCY: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
};

// Category to staff role mapping from Section 6 of Readme.md
export const CATEGORY_ROUTING: Record<ComplaintCategory, UserRole> = {
  ELECTRICAL: 'ELECTRICIAN',
  CLEANING_HYGIENE: 'CLEANING_WORKER',
  FOOD_MESS: 'MASTER',
  SECURITY: 'WATCHMAN',
  ROOM_FURNITURE: 'HOSTEL_OFFICE',
  WATER_PLUMBING: 'HOSTEL_OFFICE',
  INTERNET: 'HOSTEL_OFFICE',
  GENERAL: 'HOSTEL_OFFICE',
};

export const ComplaintService = {
  getComplaints: (): Complaint[] => {
    return StorageService.getComplaints();
  },

  getComplaintById: (id: string): Complaint | undefined => {
    return StorageService.getComplaints().find((c) => c.id === id);
  },

  checkRepeatedIssue: (roomNumber: string, category: ComplaintCategory): boolean => {
    const list = StorageService.getComplaints();
    return list.some(
      (c) =>
        c.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase() &&
        c.category === category
    );
  },

  // Rule-based Priority Classification Engine (Section 17)
  inferPriority: (title: string, description: string, category: ComplaintCategory): Priority => {
    const text = `${title} ${description}`.toLowerCase();

    // Critical trigger patterns
    if (
      text.includes('short circuit') ||
      text.includes('sparking') ||
      text.includes('fire') ||
      text.includes('smoke') ||
      text.includes('flooding') ||
      text.includes('gushing') ||
      text.includes('no water in entire') ||
      text.includes('foreign object') ||
      text.includes('electric shock') ||
      text.includes('emergency')
    ) {
      return 'CRITICAL';
    }

    // High priority trigger patterns
    if (
      text.includes('broken latch') ||
      text.includes('leakage') ||
      text.includes('offline') ||
      text.includes('jammed') ||
      text.includes('broken lock') ||
      text.includes('overflowing') ||
      category === 'SECURITY'
    ) {
      return 'HIGH';
    }

    // Medium priority
    if (
      text.includes('fan') ||
      text.includes('light') ||
      text.includes('cleaning') ||
      text.includes('rice') ||
      text.includes('food') ||
      text.includes('odor') ||
      text.includes('smell')
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  },

  createComplaint: (payload: {
    studentId: string;
    studentName: string;
    roomNumber: string;
    block: string;
    category: ComplaintCategory;
    title: string;
    description: string;
    priority?: Priority;
    evidenceUrl?: string;
  }): Complaint => {
    const complaints = StorageService.getComplaints();
    const settings = StorageService.getSettings();
    const staffList = StorageService.getStaff();

    const id = `cmp-${Date.now()}`;
    const code = `CMP-${1000 + complaints.length + 1}`;
    const createdAt = new Date().toISOString();

    // Priority inferred automatically if not explicitly passed
    const priority =
      payload.priority ||
      ComplaintService.inferPriority(payload.title, payload.description, payload.category);

    const slaHours = SLA_HOURS[priority] || 24;
    const slaTotalMinutes = slaHours * 60;
    const slaDeadline = new Date(Date.now() + slaTotalMinutes * 60 * 1000).toISOString();

    const isRepeated = ComplaintService.checkRepeatedIssue(payload.roomNumber, payload.category);

    let status: ComplaintStatus = 'SUBMITTED';
    let assignedStaff: StaffMember | undefined;

    // Check Automation Setting & Workload
    if (settings.assignmentAutomationEnabled) {
      const targetRole = CATEGORY_ROUTING[payload.category];
      // Workload-aware assignment: find available staff with lowest active load
      const availableStaff = staffList
        .filter((s) => s.role === targetRole && s.isAvailable)
        .sort((a, b) => a.activeJobsCount - b.activeJobsCount);

      assignedStaff = availableStaff[0];
      if (assignedStaff) {
        status = 'ASSIGNED';
      }
    }

    const newComplaint: Complaint = {
      id,
      code,
      studentId: payload.studentId,
      studentName: payload.studentName,
      roomNumber: payload.roomNumber,
      block: payload.block,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      priority,
      status,
      assignedStaffId: assignedStaff?.id,
      assignedStaffName: assignedStaff?.name,
      assignedStaffRole: assignedStaff?.role,
      evidenceUrl: payload.evidenceUrl,
      createdAt,
      updatedAt: createdAt,
      slaDeadline,
      slaTotalMinutes,
      slaRemainingMinutes: slaTotalMinutes,
      slaState: 'RUNNING',
      isEscalated: false,
      isRepeatedIssue: isRepeated,
    };

    StorageService.saveComplaints([newComplaint, ...complaints]);

    // Add initial timeline event
    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}-1`,
      complaintId: id,
      action: 'COMPLAINT_CREATED',
      description: `Complaint submitted by ${payload.studentName} (${payload.block}, Room ${payload.roomNumber}).`,
      actorId: payload.studentId,
      actorName: payload.studentName,
      actorRole: 'STUDENT',
      timestamp: createdAt,
    });

    if (assignedStaff) {
      StorageService.addTimelineEvent({
        id: `tl-${Date.now()}-2`,
        complaintId: id,
        action: 'AUTOMATICALLY_ASSIGNED',
        description: `Automatically routed to ${assignedStaff.name} (${assignedStaff.role}).`,
        actorId: 'system',
        actorName: 'Assignment Automation Engine',
        actorRole: 'HOSTEL_OFFICE',
        timestamp: createdAt,
      });

      ComplaintService.sendNotification({
        recipientId: assignedStaff.id,
        type: 'ASSIGNED',
        title: `New Assignment: ${code}`,
        message: `${payload.category} complaint assigned in Room ${payload.roomNumber}.`,
        complaintId: id,
      });

      ComplaintService.sendNotification({
        recipientId: payload.studentId,
        type: 'ASSIGNED',
        title: `Staff Assigned: ${code}`,
        message: `${assignedStaff.name} has been assigned to handle your complaint.`,
        complaintId: id,
      });

      StorageService.addAuditLog({
        id: `aud-${Date.now()}`,
        actorName: 'Assignment Automation Engine',
        actorRole: 'HOSTEL_OFFICE',
        action: 'AUTO_ASSIGN',
        entity: 'COMPLAINT',
        entityId: code,
        oldValue: 'UNASSIGNED',
        newValue: `${assignedStaff.role} (${assignedStaff.name})`,
        reason: `Auto routing rule for ${payload.category}`,
        timestamp: createdAt,
      });
    }

    return newComplaint;
  },

  assignStaff: (
    complaintId: string,
    staffId: string,
    actor: { name: string; role: UserRole; id: string },
    reason?: string
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const staffList = StorageService.getStaff();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) throw new Error('Staff member not found');

    const oldAssignee = complaint.assignedStaffName || 'UNASSIGNED';
    const isReassign = complaint.status !== 'SUBMITTED';

    complaint.assignedStaffId = staff.id;
    complaint.assignedStaffName = staff.name;
    complaint.assignedStaffRole = staff.role;
    complaint.status = 'ASSIGNED';
    complaint.updatedAt = new Date().toISOString();

    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: isReassign ? 'REASSIGNED' : 'MANUALLY_ASSIGNED',
      description: isReassign
        ? `Reassigned to ${staff.name} (${staff.role}). Reason: ${reason || 'Administrative re-allocation'}`
        : `Assigned to ${staff.name} (${staff.role}) by ${actor.name}.`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    StorageService.addAuditLog({
      id: `aud-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: isReassign ? 'OVERRIDE_REASSIGN' : 'MANUAL_ASSIGN',
      entity: 'COMPLAINT',
      entityId: complaint.code,
      oldValue: oldAssignee,
      newValue: `${staff.name} (${staff.role})`,
      reason: reason || (isReassign ? 'Office Override' : 'Manual Queue Assignment'),
      timestamp: complaint.updatedAt,
    });

    ComplaintService.sendNotification({
      recipientId: staff.id,
      type: isReassign ? 'REASSIGNED' : 'ASSIGNED',
      title: `${isReassign ? 'Reassigned Job' : 'New Assignment'}: ${complaint.code}`,
      message: `You have been assigned ${complaint.title} in Room ${complaint.roomNumber}.`,
      complaintId,
    });

    ComplaintService.sendNotification({
      recipientId: complaint.studentId,
      type: 'ASSIGNED',
      title: `Staff Update: ${complaint.code}`,
      message: `Your complaint is now assigned to ${staff.name} (${staff.role}).`,
      complaintId,
    });

    return complaint;
  },

  acknowledgeComplaint: (complaintId: string, actor: { name: string; role: UserRole; id: string }): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'ACKNOWLEDGED';
    complaint.updatedAt = new Date().toISOString();
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'ACKNOWLEDGED',
      description: `Job acknowledged by ${actor.name}.`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    ComplaintService.sendNotification({
      recipientId: complaint.studentId,
      type: 'STATUS_CHANGED',
      title: `Job Accepted: ${complaint.code}`,
      message: `${actor.name} has acknowledged your complaint.`,
      complaintId,
    });

    return complaint;
  },

  startWork: (
    complaintId: string,
    notes: string,
    actor: { name: string; role: UserRole; id: string }
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'IN_PROGRESS';
    complaint.staffNotes = notes;
    complaint.updatedAt = new Date().toISOString();
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'WORK_STARTED',
      description: `Work commenced on-site. Note: ${notes || 'Inspection initiated'}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    ComplaintService.sendNotification({
      recipientId: complaint.studentId,
      type: 'STATUS_CHANGED',
      title: `Work Started: ${complaint.code}`,
      message: `${actor.name} has started work on your complaint.`,
      complaintId,
    });

    return complaint;
  },

  markResolutionPending: (
    complaintId: string,
    notes: string,
    proofUrl: string | undefined,
    actor: { name: string; role: UserRole; id: string }
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'RESOLUTION_PENDING';
    complaint.staffNotes = notes;
    if (proofUrl) complaint.completionProofUrl = proofUrl;
    complaint.updatedAt = new Date().toISOString();
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'RESOLUTION_PENDING',
      description: `Staff reported completion. Note: ${notes}. Awaiting student confirmation.`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    ComplaintService.sendNotification({
      recipientId: complaint.studentId,
      type: 'RESOLUTION_PENDING',
      title: `Confirm Resolution: ${complaint.code}`,
      message: `${actor.name} has marked your complaint as resolved. Please review and confirm.`,
      complaintId,
    });

    return complaint;
  },

  confirmResolution: (
    complaintId: string,
    actor: { name: string; role: UserRole; id: string }
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'CLOSED';
    complaint.slaState = 'MET';
    complaint.updatedAt = new Date().toISOString();
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'CLOSED',
      description: `Resident ${actor.name} confirmed resolution. Complaint closed.`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    StorageService.addAuditLog({
      id: `aud-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CONFIRM_RESOLUTION',
      entity: 'COMPLAINT',
      entityId: complaint.code,
      oldValue: 'RESOLUTION_PENDING',
      newValue: 'CLOSED',
      reason: 'Resident confirmed satisfaction',
      timestamp: complaint.updatedAt,
    });

    if (complaint.assignedStaffId) {
      ComplaintService.sendNotification({
        recipientId: complaint.assignedStaffId,
        type: 'CLOSED',
        title: `Resolved: ${complaint.code}`,
        message: `Student verified and confirmed resolution for Room ${complaint.roomNumber}.`,
        complaintId,
      });
    }

    return complaint;
  },

  reopenComplaint: (
    complaintId: string,
    reason: string,
    actor: { name: string; role: UserRole; id: string }
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'REOPENED';
    complaint.reopenReason = reason;
    complaint.updatedAt = new Date().toISOString();
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'REOPENED',
      description: `Student rejected resolution: "${reason}".`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    StorageService.addAuditLog({
      id: `aud-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REOPEN_COMPLAINT',
      entity: 'COMPLAINT',
      entityId: complaint.code,
      oldValue: 'RESOLUTION_PENDING',
      newValue: 'REOPENED',
      reason,
      timestamp: complaint.updatedAt,
    });

    if (complaint.assignedStaffId) {
      ComplaintService.sendNotification({
        recipientId: complaint.assignedStaffId,
        type: 'REOPENED',
        title: `Alert: ${complaint.code} Reopened`,
        message: `Student reported issue remains unresolved: "${reason}".`,
        complaintId,
      });
    }

    return complaint;
  },

  escalateComplaint: (
    complaintId: string,
    reason: string,
    level: 'DEPUTY_WARDEN' | 'WARDEN',
    actor: { name: string; role: UserRole; id: string }
  ): Complaint => {
    const complaints = StorageService.getComplaints();
    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    complaint.status = 'ESCALATED';
    complaint.isEscalated = true;
    complaint.escalationLevel = level;
    complaint.escalationReason = reason;
    complaint.escalatedAt = new Date().toISOString();
    complaint.updatedAt = complaint.escalatedAt;
    StorageService.saveComplaints(complaints);

    StorageService.addTimelineEvent({
      id: `tl-${Date.now()}`,
      complaintId,
      action: 'ESCALATED',
      description: `Escalated to ${level === 'WARDEN' ? 'Chief Warden' : 'Deputy Warden'}. Reason: ${reason}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: complaint.updatedAt,
    });

    StorageService.addAuditLog({
      id: `aud-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ESCALATE',
      entity: 'COMPLAINT',
      entityId: complaint.code,
      oldValue: complaint.assignedStaffRole || 'NORMAL',
      newValue: `ESCALATED to ${level}`,
      reason,
      timestamp: complaint.updatedAt,
    });

    const targetUsers = StorageService.getUsers().filter((u) => u.role === level);
    targetUsers.forEach((target) => {
      ComplaintService.sendNotification({
        recipientId: target.id,
        type: 'ESCALATED',
        title: `Escalation Notice: ${complaint.code}`,
        message: `High priority escalation requires review: ${reason}`,
        complaintId,
      });
    });

    return complaint;
  },

  toggleAutomationMode: (
    enabled: boolean,
    actor: { name: string; role: UserRole }
  ) => {
    const settings = StorageService.getSettings();
    const oldVal = settings.assignmentAutomationEnabled ? 'ON' : 'OFF';
    const newVal = enabled ? 'ON' : 'OFF';

    settings.assignmentAutomationEnabled = enabled;
    settings.updatedAt = new Date().toISOString();
    settings.updatedBy = `${actor.name} (${actor.role})`;
    StorageService.saveSettings(settings);

    StorageService.addAuditLog({
      id: `aud-${Date.now()}`,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SETTINGS_CHANGED',
      entity: 'SYSTEM_SETTINGS',
      entityId: 'ASSIGNMENT_AUTOMATION_ENABLED',
      oldValue: oldVal,
      newValue: newVal,
      reason: `Hostel Office modified assignment mode from ${oldVal} to ${newVal}.`,
      timestamp: settings.updatedAt,
    });

    return settings;
  },

  sendNotification: (payload: {
    recipientId: string;
    type: NotificationItem['type'];
    title: string;
    message: string;
    complaintId?: string;
  }) => {
    const list = StorageService.getNotifications();
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      complaintId: payload.complaintId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveNotifications([item, ...list]);
  },

  markNotificationRead: (id: string) => {
    const list = StorageService.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    StorageService.saveNotifications(updated);
  },

  markAllNotificationsRead: (recipientId: string) => {
    const list = StorageService.getNotifications();
    const updated = list.map((n) => (n.recipientId === recipientId ? { ...n, isRead: true } : n));
    StorageService.saveNotifications(updated);
  },
};
