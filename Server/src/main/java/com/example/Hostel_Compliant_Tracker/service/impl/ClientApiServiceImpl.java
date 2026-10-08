package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.dto.client.*;
import com.example.Hostel_Compliant_Tracker.entity.*;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.exception.ComplaintNotFoundException;
import com.example.Hostel_Compliant_Tracker.repository.*;
import com.example.Hostel_Compliant_Tracker.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientApiServiceImpl implements ClientApiService {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final AssignmentRepository assignmentRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final EscalationRepository escalationRepository;
    private final NotificationRepository notificationRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final SlaService slaService;
    private final AssignmentService assignmentService;
    private final EscalationService escalationService;
    private final NotificationService notificationService;
    private final ComplaintHistoryService complaintHistoryService;

    @Override
    @Transactional(readOnly = true)
    public ClientLoginResponse login(ClientLoginRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail().equalsIgnoreCase(email))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + request.getEmail())));

        String token = "hct-jwt-" + user.getId();
        return ClientLoginResponse.builder()
                .token(token)
                .user(toUserDto(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ClientUserDto getCurrentUser(String token) {
        User user = resolveUserFromToken(token);
        return toUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientComplaintDto> getAllComplaints(String status, String category) {
        List<Complaint> list = complaintRepository.findAll();
        // sort by newest first
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        List<ClientComplaintDto> dtos = new ArrayList<>();
        for (Complaint c : list) {
            if (status != null && !status.trim().isEmpty() && !c.getStatus().name().equalsIgnoreCase(status.trim())) {
                continue;
            }
            if (category != null && !category.trim().isEmpty() && !c.getCategory().name().equalsIgnoreCase(category.trim())) {
                continue;
            }
            dtos.add(toComplaintDto(c));
        }
        return dtos;
    }

    @Override
    @Transactional(readOnly = true)
    public ClientComplaintDto getComplaintById(String id) {
        Complaint complaint = findComplaintByIdOrCode(id);
        return toComplaintDto(complaint);
    }

    @Override
    @Transactional
    public ClientComplaintDto createComplaint(ClientCreateComplaintRequest request, String token) {
        User student = resolveUserFromToken(token);
        if (student == null) {
            student = userRepository.findByRoleAndActiveTrue(UserRole.STUDENT).stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No registered student found."));
        }

        ComplaintCategory category = parseCategory(request.getCategory());
        String title = request.getTitle() != null && !request.getTitle().trim().isEmpty()
                ? request.getTitle().trim()
                : (request.getDescription() != null && !request.getDescription().trim().isEmpty()
                    ? request.getDescription().trim().split("\n")[0]
                    : "Maintenance Request");
        if (title.length() > 60) {
            title = title.substring(0, 60);
        }

        Priority priority = inferPriority(title, request.getDescription(), category);

        long count = complaintRepository.count();
        String code = "CMP-" + (1000 + count + 1);

        String room = request.getRoomNumber() != null ? request.getRoomNumber().trim() : (student.getRoomNumber() != null ? student.getRoomNumber() : "B-203");
        String block = request.getBlock() != null ? request.getBlock().trim() : (student.getBlock() != null ? student.getBlock() : "Block B");

        // Check if repeated issue in same room
        boolean isRepeated = complaintRepository.findAll().stream()
                .anyMatch(c -> c.getRoom() != null && c.getRoom().equalsIgnoreCase(room) && c.getCategory() == category);

        Complaint complaint = Complaint.builder()
                .complaintNumber(code)
                .student(student)
                .category(category)
                .title(title)
                .description(request.getDescription())
                .location(block + " - Room " + room)
                .hostel(block)
                .room(room)
                .priority(priority)
                .status(ComplaintStatus.SUBMITTED)
                .evidenceUrl(request.getEvidenceUrl())
                .isRepeatedIssue(isRepeated)
                .isEscalated(false)
                .build();

        complaint = complaintRepository.save(complaint);

        // Calculate SLA
        Instant deadline = slaService.calculateDeadline(complaint);
        complaint.setSlaDeadline(deadline);
        complaint = complaintRepository.save(complaint);

        // Record history
        complaintHistoryService.recordHistory(
                complaint,
                student,
                HistoryAction.CREATED,
                null,
                ComplaintStatus.SUBMITTED.name(),
                "Complaint registered by " + student.getName()
        );

        // Auto assignment if enabled
        Assignment assignment = assignmentService.assignComplaint(complaint, "Automatic routing for category: " + category);
        if (assignment != null && complaint.getAssignee() != null) {
            complaint = complaintRepository.save(complaint);

            notificationService.sendNotification(
                    complaint.getAssignee(),
                    complaint,
                    NotificationType.ASSIGNED,
                    "New Assignment: " + complaint.getComplaintNumber(),
                    category + " complaint assigned in Room " + room
            );
            notificationService.sendNotification(
                    student,
                    complaint,
                    NotificationType.ASSIGNED,
                    "Staff Assigned: " + complaint.getComplaintNumber(),
                    complaint.getAssignee().getName() + " has been assigned to handle your complaint."
            );
        }

        return toComplaintDto(complaint);
    }

    @Override
    @Transactional
    public ClientComplaintDto handleComplaintAction(String id, ClientActionRequest request, String token) {
        Complaint complaint = findComplaintByIdOrCode(id);
        User actor = resolveUserFromToken(token);

        String action = request.getAction() != null ? request.getAction().trim().toUpperCase(Locale.ROOT) : "";
        ComplaintStatus oldStatus = complaint.getStatus();

        switch (action) {
            case "ACCEPT" -> {
                complaint.setStatus(ComplaintStatus.ACKNOWLEDGED);
                complaint.setUpdatedAt(Instant.now());
                complaint = complaintRepository.save(complaint);

                complaintHistoryService.recordHistory(
                        complaint,
                        actor,
                        HistoryAction.STATUS_CHANGED,
                        oldStatus.name(),
                        ComplaintStatus.ACKNOWLEDGED.name(),
                        "Job accepted by " + (actor != null ? actor.getName() : "Technician")
                );

                if (complaint.getStudent() != null) {
                    notificationService.sendNotification(
                            complaint.getStudent(),
                            complaint,
                            NotificationType.STATUS_CHANGED,
                            "Job Accepted: " + complaint.getComplaintNumber(),
                            (actor != null ? actor.getName() : "Worker") + " has acknowledged your complaint."
                    );
                }
            }
            case "START_WORK" -> {
                complaint.setStatus(ComplaintStatus.IN_PROGRESS);
                if (request.getNotes() != null) {
                    complaint.setStaffNotes(request.getNotes());
                }
                complaint.setUpdatedAt(Instant.now());
                complaint = complaintRepository.save(complaint);

                complaintHistoryService.recordHistory(
                        complaint,
                        actor,
                        HistoryAction.STATUS_CHANGED,
                        oldStatus.name(),
                        ComplaintStatus.IN_PROGRESS.name(),
                        "Work commenced on-site: " + (request.getNotes() != null ? request.getNotes() : "Inspection initiated")
                );

                if (complaint.getStudent() != null) {
                    notificationService.sendNotification(
                            complaint.getStudent(),
                            complaint,
                            NotificationType.STATUS_CHANGED,
                            "Work Started: " + complaint.getComplaintNumber(),
                            (actor != null ? actor.getName() : "Worker") + " has started work on your complaint."
                    );
                }
            }
            case "MARK_RESOLUTION_PENDING" -> {
                complaint.setStatus(ComplaintStatus.RESOLUTION_PENDING);
                if (request.getNotes() != null) {
                    complaint.setStaffNotes(request.getNotes());
                }
                if (request.getProofUrl() != null && !request.getProofUrl().trim().isEmpty()) {
                    complaint.setCompletionProofUrl(request.getProofUrl().trim());
                }
                complaint.setUpdatedAt(Instant.now());
                complaint = complaintRepository.save(complaint);

                complaintHistoryService.recordHistory(
                        complaint,
                        actor,
                        HistoryAction.RESOLVED,
                        oldStatus.name(),
                        ComplaintStatus.RESOLUTION_PENDING.name(),
                        "Staff reported completion. Note: " + request.getNotes() + ". Awaiting student confirmation."
                );

                if (complaint.getStudent() != null) {
                    notificationService.sendNotification(
                            complaint.getStudent(),
                            complaint,
                            NotificationType.RESOLUTION_PENDING,
                            "Confirm Resolution: " + complaint.getComplaintNumber(),
                            (actor != null ? actor.getName() : "Staff") + " has marked your complaint as resolved. Please review and confirm."
                    );
                }
            }
            default -> throw new IllegalArgumentException("Unknown worker action: " + action);
        }

        return toComplaintDto(complaint);
    }

    @Override
    @Transactional
    public ClientComplaintDto confirmComplaintResolution(String id, String token) {
        Complaint complaint = findComplaintByIdOrCode(id);
        User actor = resolveUserFromToken(token);

        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(Instant.now());
        complaint.setUpdatedAt(Instant.now());
        complaint = complaintRepository.save(complaint);

        complaintHistoryService.recordHistory(
                complaint,
                actor,
                HistoryAction.CLOSED,
                oldStatus.name(),
                ComplaintStatus.CLOSED.name(),
                "Resident " + (actor != null ? actor.getName() : "Student") + " confirmed resolution. Complaint closed."
        );

        if (complaint.getAssignee() != null) {
            notificationService.sendNotification(
                    complaint.getAssignee(),
                    complaint,
                    NotificationType.CLOSED,
                    "Resolved: " + complaint.getComplaintNumber(),
                    "Student verified and confirmed resolution for Room " + complaint.getRoom() + "."
            );
        }

        return toComplaintDto(complaint);
    }

    @Override
    @Transactional
    public ClientComplaintDto reopenComplaint(String id, ClientReopenRequest request, String token) {
        Complaint complaint = findComplaintByIdOrCode(id);
        User actor = resolveUserFromToken(token);

        String reason = request != null && request.getReason() != null ? request.getReason().trim() : "Issue remains unresolved.";
        ComplaintStatus oldStatus = complaint.getStatus();

        complaint.setStatus(ComplaintStatus.REOPENED);
        complaint.setReopenReason(reason);
        complaint.setUpdatedAt(Instant.now());
        complaint = complaintRepository.save(complaint);

        complaintHistoryService.recordHistory(
                complaint,
                actor,
                HistoryAction.REOPENED,
                oldStatus.name(),
                ComplaintStatus.REOPENED.name(),
                "Student rejected resolution: " + reason
        );

        if (complaint.getAssignee() != null) {
            notificationService.sendNotification(
                    complaint.getAssignee(),
                    complaint,
                    NotificationType.REOPENED,
                    "Alert: " + complaint.getComplaintNumber() + " Reopened",
                    "Student reported issue remains unresolved: " + reason
            );
        }

        return toComplaintDto(complaint);
    }

    @Override
    @Transactional
    public ClientComplaintDto assignComplaintStaff(String id, ClientAssignRequest request, String token) {
        Complaint complaint = findComplaintByIdOrCode(id);
        User actor = resolveUserFromToken(token);

        if (request == null || request.getStaffId() == null || request.getStaffId().trim().isEmpty()) {
            throw new IllegalArgumentException("Staff member ID is required.");
        }

        User staff = resolveUserByIdOrString(request.getStaffId());
        String reason = request.getReason() != null ? request.getReason().trim() : "Manual assignment";

        User oldAssignee = complaint.getAssignee();
        boolean isReassign = oldAssignee != null;

        assignmentService.reassignComplaint(complaint, staff, actor, reason);
        complaint.setAssignee(staff);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedAt(Instant.now());
        complaint = complaintRepository.save(complaint);

        complaintHistoryService.recordHistory(
                complaint,
                actor,
                isReassign ? HistoryAction.REASSIGNED : HistoryAction.ASSIGNED,
                oldAssignee != null ? oldAssignee.getName() : "UNASSIGNED",
                staff.getName() + " (" + staff.getRole() + ")",
                reason
        );

        notificationService.sendNotification(
                staff,
                complaint,
                isReassign ? NotificationType.REASSIGNED : NotificationType.ASSIGNED,
                (isReassign ? "Reassigned Job: " : "New Assignment: ") + complaint.getComplaintNumber(),
                "You have been assigned " + complaint.getTitle() + " in Room " + complaint.getRoom() + "."
        );

        if (complaint.getStudent() != null) {
            notificationService.sendNotification(
                    complaint.getStudent(),
                    complaint,
                    NotificationType.ASSIGNED,
                    "Staff Update: " + complaint.getComplaintNumber(),
                    "Your complaint is now assigned to " + staff.getName() + " (" + staff.getRole() + ")."
            );
        }

        return toComplaintDto(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ClientSystemSettingsDto getSystemSettings() {
        boolean auto = systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED")
                .map(s -> Boolean.parseBoolean(s.getValue()))
                .orElse(true);

        SystemSetting setting = systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED").orElse(null);
        String updatedBy = setting != null && setting.getUpdatedBy() != null ? setting.getUpdatedBy().getName() : "Priya Sharma (Office Admin)";
        String updatedAt = setting != null ? setting.getUpdatedAt().toString() : Instant.now().toString();

        return ClientSystemSettingsDto.builder()
                .assignmentAutomationEnabled(auto)
                .updatedBy(updatedBy)
                .updatedAt(updatedAt)
                .build();
    }

    @Override
    @Transactional
    public ClientSystemSettingsDto toggleAutomation(ClientToggleAutomationRequest request, String token) {
        boolean enabled = request != null && Boolean.TRUE.equals(request.getEnabled());
        User actor = resolveUserFromToken(token);

        SystemSetting setting = systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED")
                .orElseGet(() -> SystemSetting.builder()
                        .key("ASSIGNMENT_AUTOMATION_ENABLED")
                        .build());

        setting.setValue(String.valueOf(enabled));
        setting.setUpdatedBy(actor);
        setting.setUpdatedAt(Instant.now());
        setting = systemSettingRepository.save(setting);

        return ClientSystemSettingsDto.builder()
                .assignmentAutomationEnabled(enabled)
                .updatedBy(actor != null ? actor.getName() : "Hostel Office Admin")
                .updatedAt(setting.getUpdatedAt().toString())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientNotificationDto> getNotifications(String token) {
        User user = resolveUserFromToken(token);
        List<Notification> list = user != null
                ? notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findAll();

        List<ClientNotificationDto> dtos = new ArrayList<>();
        for (Notification n : list) {
            dtos.add(ClientNotificationDto.builder()
                    .id(String.valueOf(n.getId()))
                    .recipientId(n.getUser() != null ? String.valueOf(n.getUser().getId()) : null)
                    .type(n.getType() != null ? n.getType().name() : "STATUS_CHANGED")
                    .title(n.getTitle())
                    .message(n.getMessage())
                    .complaintId(n.getComplaint() != null ? String.valueOf(n.getComplaint().getId()) : null)
                    .isRead(n.isRead())
                    .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : Instant.now().toString())
                    .build());
        }
        return dtos;
    }

    @Override
    @Transactional
    public void markNotificationRead(String id) {
        try {
            Long nid = Long.parseLong(id);
            notificationRepository.findById(nid).ifPresent(n -> {
                n.setRead(true);
                notificationRepository.save(n);
            });
        } catch (NumberFormatException ignored) {}
    }

    @Override
    @Transactional
    public void markAllNotificationsRead(String token) {
        User user = resolveUserFromToken(token);
        if (user != null) {
            List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            for (Notification n : list) {
                n.setRead(true);
            }
            notificationRepository.saveAll(list);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientAuditLogDto> getAuditLogs() {
        List<ComplaintHistory> histories = complaintHistoryRepository.findAll();
        histories.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        List<ClientAuditLogDto> logs = new ArrayList<>();
        for (ComplaintHistory h : histories) {
            String actorName = h.getActor() != null ? h.getActor().getName() : "System Engine";
            String actorRole = h.getActor() != null && h.getActor().getRole() != null ? h.getActor().getRole().name() : "HOSTEL_OFFICE";
            String entityId = h.getComplaint() != null ? h.getComplaint().getComplaintNumber() : "CMP";

            logs.add(ClientAuditLogDto.builder()
                    .id(String.valueOf(h.getId()))
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(h.getAction() != null ? h.getAction().name() : "UPDATE")
                    .entity("COMPLAINT")
                    .entityId(entityId)
                    .oldValue(h.getOldValue())
                    .newValue(h.getNewValue())
                    .reason(h.getReason())
                    .timestamp(h.getCreatedAt() != null ? h.getCreatedAt().toString() : Instant.now().toString())
                    .build());
        }
        return logs;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientStaffDto> getStaffList() {
        List<UserRole> staffRoles = List.of(
                UserRole.ELECTRICIAN,
                UserRole.CLEANING_WORKER,
                UserRole.MASTER,
                UserRole.WATCHMAN,
                UserRole.HOSTEL_OFFICE
        );

        List<User> staffUsers = userRepository.findByRoleIn(staffRoles);
        List<ClientStaffDto> result = new ArrayList<>();

        for (User u : staffUsers) {
            long activeJobs = complaintRepository.findAll().stream()
                    .filter(c -> c.getAssignee() != null && c.getAssignee().getId().equals(u.getId()) &&
                            c.getStatus() != ComplaintStatus.CLOSED && c.getStatus() != ComplaintStatus.STUDENT_CONFIRMED)
                    .count();

            List<String> categories = switch (u.getRole()) {
                case ELECTRICIAN -> List.of("ELECTRICAL");
                case CLEANING_WORKER -> List.of("CLEANING_HYGIENE");
                case MASTER -> List.of("FOOD_MESS");
                case WATCHMAN -> List.of("SECURITY");
                case HOSTEL_OFFICE -> List.of("ROOM_FURNITURE", "WATER_PLUMBING", "INTERNET", "GENERAL");
                default -> List.of("GENERAL");
            };

            result.add(ClientStaffDto.builder()
                    .id(String.valueOf(u.getId()))
                    .name(u.getName())
                    .role(u.getRole().name())
                    .categoryHandled(categories)
                    .phone(u.getPhone() != null ? u.getPhone() : "+91 98450 00000")
                    .activeJobsCount(activeJobs)
                    .isAvailable(activeJobs < 3)
                    .build());
        }
        return result;
    }

    // --- Helper Mappers ---

    private ClientUserDto toUserDto(User user) {
        if (user == null) return null;
        return ClientUserDto.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getName())
                .fullName(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .phoneNumber(user.getPhone())
                .role(user.getRole().name())
                .active(user.getActive())
                .enabled(user.getActive())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .updatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null)
                .roomNumber(user.getRoomNumber())
                .block(user.getBlock())
                .studentId(user.getStudentId())
                .avatarUrl(user.getAvatarUrl())
                .username(user.getUsername() != null ? user.getUsername() : user.getEmail())
                .build();
    }

    private ClientComplaintDto toComplaintDto(Complaint c) {
        if (c == null) return null;

        Priority priority = c.getPriority() != null ? c.getPriority() : Priority.MEDIUM;
        long totalHours = switch (priority) {
            case EMERGENCY, CRITICAL -> 4;
            case HIGH -> 12;
            case MEDIUM -> 24;
            case LOW -> 48;
        };
        long totalMinutes = totalHours * 60;

        Instant now = Instant.now();
        Instant deadline = c.getSlaDeadline() != null ? c.getSlaDeadline() : c.getCreatedAt().plus(totalHours, ChronoUnit.HOURS);

        long remainingMinutes = Duration.between(now, deadline).toMinutes();

        String slaState;
        if (c.getStatus() == ComplaintStatus.CLOSED || c.getStatus() == ComplaintStatus.STUDENT_CONFIRMED) {
            slaState = "MET";
            remainingMinutes = Math.max(0, remainingMinutes);
        } else if (remainingMinutes <= 0 || c.getStatus() == ComplaintStatus.SLA_BREACHED) {
            slaState = "BREACHED";
        } else if (remainingMinutes <= totalMinutes * 0.25) {
            slaState = "APPROACHING";
        } else {
            slaState = "RUNNING";
        }

        String assignedId = c.getAssignee() != null ? String.valueOf(c.getAssignee().getId()) : null;
        String assignedName = c.getAssignee() != null ? c.getAssignee().getName() : null;
        String assignedRole = c.getAssignee() != null && c.getAssignee().getRole() != null ? c.getAssignee().getRole().name() : null;

        return ClientComplaintDto.builder()
                .id(String.valueOf(c.getId()))
                .code(c.getComplaintNumber())
                .studentId(c.getStudent() != null ? String.valueOf(c.getStudent().getId()) : "")
                .studentName(c.getStudent() != null ? c.getStudent().getName() : "Resident")
                .roomNumber(c.getRoom() != null ? c.getRoom() : "B-203")
                .block(c.getHostel() != null ? c.getHostel() : "Block B")
                .category(c.getCategory() != null ? c.getCategory().name() : "GENERAL")
                .title(c.getTitle() != null ? c.getTitle() : "Issue in Room " + c.getRoom())
                .description(c.getDescription())
                .priority(priority.name())
                .status(c.getStatus() != null ? c.getStatus().name() : "SUBMITTED")
                .assignedStaffId(assignedId)
                .assignedStaffName(assignedName)
                .assignedStaffRole(assignedRole)
                .evidenceUrl(c.getEvidenceUrl())
                .completionProofUrl(c.getCompletionProofUrl())
                .staffNotes(c.getStaffNotes())
                .reopenReason(c.getReopenReason())
                .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : now.toString())
                .updatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : now.toString())
                .slaDeadline(deadline.toString())
                .slaTotalMinutes(totalMinutes)
                .slaRemainingMinutes(remainingMinutes)
                .slaState(slaState)
                .isEscalated(Boolean.TRUE.equals(c.getIsEscalated()) || c.getStatus() == ComplaintStatus.ESCALATED)
                .escalationLevel(c.getEscalationLevel())
                .escalationReason(c.getEscalationReason())
                .escalatedAt(c.getEscalatedAt() != null ? c.getEscalatedAt().toString() : null)
                .isRepeatedIssue(Boolean.TRUE.equals(c.getIsRepeatedIssue()))
                .build();
    }

    private User resolveUserFromToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        String cleanToken = token.replace("Bearer ", "").trim();
        // Check "hct-jwt-1" or "demo-jwt-usr-student-1" or number
        if (cleanToken.startsWith("hct-jwt-")) {
            String idStr = cleanToken.substring("hct-jwt-".length());
            try {
                Long id = Long.parseLong(idStr);
                return userRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (cleanToken.startsWith("demo-jwt-")) {
            String demoId = cleanToken.substring("demo-jwt-".length());
            return resolveUserByIdOrString(demoId);
        }
        // Try direct parse
        try {
            Long id = Long.parseLong(cleanToken);
            return userRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {}

        // Fallback: search by email if token is email
        return userRepository.findByEmail(cleanToken).orElse(null);
    }

    private User resolveUserByIdOrString(String idOrIdentifier) {
        try {
            Long id = Long.parseLong(idOrIdentifier);
            return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found: " + idOrIdentifier));
        } catch (NumberFormatException e) {
            // Check username or seed ID e.g. "usr-student-1"
            return userRepository.findAll().stream()
                    .filter(u -> (u.getUsername() != null && u.getUsername().equalsIgnoreCase(idOrIdentifier)) ||
                                 (u.getEmail() != null && u.getEmail().toLowerCase().startsWith(idOrIdentifier.toLowerCase())))
                    .findFirst()
                    .orElseGet(() -> userRepository.findAll().stream().findFirst().orElseThrow(() -> new IllegalArgumentException("No users available")));
        }
    }

    private Complaint findComplaintByIdOrCode(String id) {
        try {
            Long numericId = Long.parseLong(id);
            return complaintRepository.findById(numericId)
                    .orElseThrow(() -> new ComplaintNotFoundException("Complaint not found with ID: " + id));
        } catch (NumberFormatException e) {
            return complaintRepository.findByComplaintNumber(id)
                    .orElseThrow(() -> new ComplaintNotFoundException("Complaint not found with code: " + id));
        }
    }

    private ComplaintCategory parseCategory(String raw) {
        if (raw == null || raw.trim().isEmpty()) return ComplaintCategory.GENERAL;
        try {
            return ComplaintCategory.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return switch (raw.trim().toUpperCase(Locale.ROOT)) {
                case "ELECTRICAL" -> ComplaintCategory.ELECTRICAL;
                case "PLUMBING", "WATER_PLUMBING" -> ComplaintCategory.WATER_PLUMBING;
                case "CLEANING", "CLEANING_HYGIENE" -> ComplaintCategory.CLEANING_HYGIENE;
                case "MESS", "FOOD", "FOOD_MESS" -> ComplaintCategory.FOOD_MESS;
                case "SECURITY" -> ComplaintCategory.SECURITY;
                case "FURNITURE", "ROOM_FURNITURE" -> ComplaintCategory.ROOM_FURNITURE;
                case "INTERNET", "INTERNET_WIFI", "WIFI" -> ComplaintCategory.INTERNET;
                default -> ComplaintCategory.GENERAL;
            };
        }
    }

    private Priority inferPriority(String title, String description, ComplaintCategory category) {
        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase(Locale.ROOT);
        if (text.contains("short circuit") || text.contains("sparking") || text.contains("fire") ||
            text.contains("smoke") || text.contains("flooding") || text.contains("gushing") ||
            text.contains("electric shock") || text.contains("emergency")) {
            return Priority.CRITICAL;
        }
        if (text.contains("broken latch") || text.contains("leakage") || text.contains("offline") ||
            text.contains("jammed") || text.contains("broken lock") || text.contains("overflowing") ||
            category == ComplaintCategory.SECURITY) {
            return Priority.HIGH;
        }
        if (text.contains("fan") || text.contains("light") || text.contains("cleaning") ||
            text.contains("rice") || text.contains("food") || text.contains("odor") || text.contains("smell")) {
            return Priority.MEDIUM;
        }
        return Priority.LOW;
    }
}
