package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.Escalation;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.repository.ComplaintRepository;
import com.example.Hostel_Compliant_Tracker.repository.EscalationRepository;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
import com.example.Hostel_Compliant_Tracker.service.ComplaintHistoryService;
import com.example.Hostel_Compliant_Tracker.service.EscalationService;
import com.example.Hostel_Compliant_Tracker.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class EscalationServiceImpl implements EscalationService {

    private final EscalationRepository escalationRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintHistoryService complaintHistoryService;
    private final NotificationService notificationService;
    private Clock clock;

    public EscalationServiceImpl(
            EscalationRepository escalationRepository,
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            ComplaintHistoryService complaintHistoryService,
            NotificationService notificationService,
            @Autowired(required = false) Clock clock
    ) {
        this.escalationRepository = escalationRepository;
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.complaintHistoryService = complaintHistoryService;
        this.notificationService = notificationService;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canEscalate(Complaint complaint) {
        if (complaint == null) {
            return false;
        }
        if (complaint.getStatus() == ComplaintStatus.CLOSED ||
            complaint.getStatus() == ComplaintStatus.STUDENT_CONFIRMED) {
            return false;
        }
        UserRole currentRole = resolveCurrentRole(complaint);
        return currentRole != UserRole.WARDEN;
    }

    @Override
    @Transactional
    public Escalation escalate(Complaint complaint, String reason, EscalationTriggerType triggerType) {
        if (complaint == null) {
            return null;
        }

        final EscalationTriggerType effectiveTriggerType = (triggerType != null) ? triggerType : EscalationTriggerType.MANUAL;

        UserRole currentRole = resolveCurrentRole(complaint);

        // Check boundary: Warden cannot escalate further.
        if (currentRole == UserRole.WARDEN) {
            throw new IllegalStateException("Complaint #" + complaint.getComplaintNumber() + " cannot be escalated beyond WARDEN");
        }

        UserRole fromRole = currentRole;
        UserRole toRole = (currentRole == UserRole.DEPUTY_WARDEN) ? UserRole.WARDEN : UserRole.DEPUTY_WARDEN;

        // Check duplicate escalation for the same stage and trigger
        List<Escalation> pastEscalations = escalationRepository.findByComplaintIdOrderByIdDesc(complaint.getId());
        Optional<Escalation> duplicate = pastEscalations.stream()
                .filter(e -> (e.getToRole() == toRole && e.getTriggerType() == effectiveTriggerType) ||
                             (e.getTriggerType() == effectiveTriggerType &&
                              (effectiveTriggerType == EscalationTriggerType.SLA_BREACH ||
                               effectiveTriggerType == EscalationTriggerType.CRITICAL_EMERGENCY)))
                .findFirst();

        if (duplicate.isPresent()) {
            log.info("Duplicate escalation prevented for complaint {} (stage: {}, trigger: {})", complaint.getId(), toRole, effectiveTriggerType);
            return duplicate.get();
        }

        // Find recipient user for notification & reassignment
        List<User> targetUsers = userRepository.findByRoleAndActiveTrue(toRole);
        if (targetUsers.isEmpty()) {
            targetUsers = userRepository.findByRole(toRole);
        }
        User targetUser = !targetUsers.isEmpty() ? targetUsers.get(0) : null;

        if (targetUser != null) {
            complaint.setAssignee(targetUser);
        }

        Escalation escalation = Escalation.builder()
                .complaint(complaint)
                .fromRole(fromRole)
                .toRole(toRole)
                .triggerType(effectiveTriggerType)
                .reason(reason != null ? reason : "Escalated from " + fromRole + " to " + toRole)
                .createdAt(Instant.now(clock))
                .build();

        escalation = escalationRepository.save(escalation);

        complaint.setStatus(ComplaintStatus.ESCALATED);
        complaint.setUpdatedAt(Instant.now(clock));
        complaintRepository.save(complaint);

        // Record history
        complaintHistoryService.recordHistory(
                complaint,
                targetUser,
                HistoryAction.ESCALATED,
                fromRole.name(),
                toRole.name(),
                reason != null ? reason : "Escalated to " + toRole.name()
        );

        // Notify escalated recipient
        if (targetUser != null) {
            notificationService.sendNotification(
                    targetUser,
                    complaint,
                    NotificationType.ESCALATED,
                    "Complaint Escalated to " + toRole.name().replace('_', ' '),
                    "Complaint #" + complaint.getComplaintNumber() + " has been escalated to you (" + toRole.name() + "). Reason: " + (reason != null ? reason : "Administrative escalation")
            );
        }

        return escalation;
    }

    @Override
    @Transactional
    public Escalation escalateCritical(Complaint complaint, String reason) {
        if (complaint == null) {
            return null;
        }
        if (complaint.getPriority() != Priority.CRITICAL) {
            throw new IllegalArgumentException("Complaint #" + complaint.getComplaintNumber() + " is not CRITICAL priority");
        }

        // Prevent duplicate critical escalation
        List<Escalation> pastEscalations = escalationRepository.findByComplaintIdOrderByIdDesc(complaint.getId());
        Optional<Escalation> existingCritical = pastEscalations.stream()
                .filter(e -> e.getTriggerType() == EscalationTriggerType.CRITICAL_EMERGENCY)
                .findFirst();

        if (existingCritical.isPresent()) {
            return existingCritical.get();
        }

        return escalate(complaint, reason != null ? reason : "Emergency critical complaint", EscalationTriggerType.CRITICAL_EMERGENCY);
    }

    private UserRole resolveCurrentRole(Complaint complaint) {
        List<Escalation> pastEscalations = escalationRepository.findByComplaintIdOrderByIdDesc(complaint.getId());
        if (!pastEscalations.isEmpty()) {
            return pastEscalations.get(0).getToRole();
        }
        if (complaint.getAssignee() != null) {
            return complaint.getAssignee().getRole();
        }
        return UserRole.HOSTEL_OFFICE;
    }
}
