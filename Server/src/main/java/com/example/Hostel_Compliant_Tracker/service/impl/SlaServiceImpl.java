package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.SystemSetting;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.EscalationTriggerType;
import com.example.Hostel_Compliant_Tracker.enums.HistoryAction;
import com.example.Hostel_Compliant_Tracker.enums.NotificationType;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import com.example.Hostel_Compliant_Tracker.repository.ComplaintRepository;
import com.example.Hostel_Compliant_Tracker.repository.EscalationRepository;
import com.example.Hostel_Compliant_Tracker.repository.SystemSettingRepository;
import com.example.Hostel_Compliant_Tracker.service.ComplaintHistoryService;
import com.example.Hostel_Compliant_Tracker.service.EscalationService;
import com.example.Hostel_Compliant_Tracker.service.NotificationService;
import com.example.Hostel_Compliant_Tracker.service.SlaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class SlaServiceImpl implements SlaService {

    private final ComplaintRepository complaintRepository;
    private final EscalationRepository escalationRepository;
    private final EscalationService escalationService;
    private final ComplaintHistoryService complaintHistoryService;
    private final NotificationService notificationService;
    private final SystemSettingRepository systemSettingRepository;
    private Clock clock;

    public SlaServiceImpl(
            ComplaintRepository complaintRepository,
            EscalationRepository escalationRepository,
            EscalationService escalationService,
            ComplaintHistoryService complaintHistoryService,
            NotificationService notificationService,
            SystemSettingRepository systemSettingRepository,
            @Autowired(required = false) Clock clock
    ) {
        this.complaintRepository = complaintRepository;
        this.escalationRepository = escalationRepository;
        this.escalationService = escalationService;
        this.complaintHistoryService = complaintHistoryService;
        this.notificationService = notificationService;
        this.systemSettingRepository = systemSettingRepository;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    @Override
    public Instant calculateDeadline(Complaint complaint) {
        Instant baseTime = complaint.getCreatedAt() != null ? complaint.getCreatedAt() : Instant.now(clock);
        Priority priority = complaint.getPriority();

        long hours = resolveSlaHours(priority);
        return baseTime.plus(hours, ChronoUnit.HOURS);
    }

    @Override
    public boolean isBreached(Complaint complaint) {
        if (complaint == null || complaint.getSlaDeadline() == null) {
            return false;
        }
        if (complaint.getStatus() == ComplaintStatus.CLOSED ||
            complaint.getStatus() == ComplaintStatus.STUDENT_CONFIRMED) {
            return false;
        }
        if (complaint.getStatus() == ComplaintStatus.SLA_BREACHED) {
            return true;
        }
        return Instant.now(clock).isAfter(complaint.getSlaDeadline());
    }

    @Override
    @Transactional
    public List<Complaint> processSlaBreaches() {
        Instant now = Instant.now(clock);
        List<ComplaintStatus> nonBreachEligibleStatuses = List.of(
                ComplaintStatus.CLOSED,
                ComplaintStatus.STUDENT_CONFIRMED
        );

        List<Complaint> overdueComplaints = complaintRepository.findBySlaDeadlineBeforeAndStatusNotIn(now, nonBreachEligibleStatuses);
        List<Complaint> processed = new ArrayList<>();

        for (Complaint complaint : overdueComplaints) {
            if (!isBreached(complaint)) {
                continue;
            }

            // Prevent duplicate breach processing
            boolean alreadyEscalatedForBreach = escalationRepository.existsByComplaintIdAndTriggerType(
                    complaint.getId(),
                    EscalationTriggerType.SLA_BREACH
            );
            if (alreadyEscalatedForBreach) {
                continue;
            }

            ComplaintStatus oldStatus = complaint.getStatus();
            complaint.setStatus(ComplaintStatus.SLA_BREACHED);
            complaint.setUpdatedAt(now);
            complaint = complaintRepository.save(complaint);

            // Record history
            complaintHistoryService.recordHistory(
                    complaint,
                    null,
                    HistoryAction.STATUS_CHANGED,
                    oldStatus != null ? oldStatus.name() : null,
                    ComplaintStatus.SLA_BREACHED.name(),
                    "SLA deadline breached (" + complaint.getSlaDeadline() + ")"
            );

            // Notify student and assignee of SLA breach
            if (complaint.getStudent() != null) {
                notificationService.sendNotification(
                        complaint.getStudent(),
                        complaint,
                        NotificationType.SLA_BREACHED,
                        "SLA Breached",
                        "Resolution deadline expired for complaint #" + complaint.getComplaintNumber() + ". Escalating immediately."
                );
            }
            if (complaint.getAssignee() != null) {
                notificationService.sendNotification(
                        complaint.getAssignee(),
                        complaint,
                        NotificationType.SLA_BREACHED,
                        "SLA Breached",
                        "Complaint #" + complaint.getComplaintNumber() + " has breached SLA deadline."
                );
            }

            // Escalate to next administrative level
            escalationService.escalate(
                    complaint,
                    "SLA deadline exceeded (" + complaint.getSlaDeadline() + ")",
                    EscalationTriggerType.SLA_BREACH
            );

            processed.add(complaint);
        }

        return processed;
    }

    private long resolveSlaHours(Priority priority) {
        if (priority == null) {
            return 24;
        }

        String settingKey = "SLA_HOURS_" + priority.name();
        Optional<SystemSetting> setting = systemSettingRepository.findByKey(settingKey);
        if (setting.isPresent()) {
            try {
                return Long.parseLong(setting.get().getValue().trim());
            } catch (NumberFormatException e) {
                log.warn("Invalid SLA hours setting for {}: {}", settingKey, setting.get().getValue());
            }
        }

        return switch (priority) {
            case CRITICAL, EMERGENCY -> 1;
            case HIGH -> 4;
            case MEDIUM -> 24;
            case LOW -> 48;
        };
    }
}
