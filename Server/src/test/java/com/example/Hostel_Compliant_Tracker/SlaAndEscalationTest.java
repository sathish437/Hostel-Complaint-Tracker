package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.entity.*;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.repository.*;
import com.example.Hostel_Compliant_Tracker.service.ComplaintHistoryService;
import com.example.Hostel_Compliant_Tracker.service.EscalationService;
import com.example.Hostel_Compliant_Tracker.service.NotificationService;
import com.example.Hostel_Compliant_Tracker.service.SlaService;
import com.example.Hostel_Compliant_Tracker.service.impl.EscalationServiceImpl;
import com.example.Hostel_Compliant_Tracker.service.impl.SlaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class SlaAndEscalationTest {

    @Autowired
    private SlaService slaService;

    @Autowired
    private EscalationService escalationService;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EscalationRepository escalationRepository;

    @Autowired
    private ComplaintHistoryRepository complaintHistoryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    private User student;
    private User electrician;
    private User deputyWarden;
    private User warden;

    private final Instant baseTime = Instant.parse("2026-10-08T10:00:00Z");
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(baseTime, ZoneOffset.UTC);

        if (slaService instanceof SlaServiceImpl slaServiceImpl) {
            slaServiceImpl.setClock(fixedClock);
        }
        if (escalationService instanceof EscalationServiceImpl escalationServiceImpl) {
            escalationServiceImpl.setClock(fixedClock);
        }

        student = userRepository.save(User.builder()
                .name("Student User")
                .email("student.sla@elevix.edu")
                .passwordHash("hash")
                .role(UserRole.STUDENT)
                .active(true)
                .build());

        electrician = userRepository.save(User.builder()
                .name("Electrician User")
                .email("electrician.sla@elevix.edu")
                .passwordHash("hash")
                .role(UserRole.ELECTRICIAN)
                .active(true)
                .build());

        deputyWarden = userRepository.save(User.builder()
                .name("Deputy Warden")
                .email("deputy.warden@elevix.edu")
                .passwordHash("hash")
                .role(UserRole.DEPUTY_WARDEN)
                .active(true)
                .build());

        warden = userRepository.save(User.builder()
                .name("Chief Warden")
                .email("chief.warden@elevix.edu")
                .passwordHash("hash")
                .role(UserRole.WARDEN)
                .active(true)
                .build());
    }

    private Complaint createBaseComplaint(Priority priority, ComplaintStatus status) {
        Complaint complaint = Complaint.builder()
                .complaintNumber("CMP-TEST-" + System.nanoTime())
                .student(student)
                .assignee(electrician)
                .category(ComplaintCategory.ELECTRICAL)
                .description("Test complaint")
                .hostel("Hostel 1")
                .room("101")
                .location("Hostel 1 - Room 101")
                .priority(priority)
                .status(status)
                .createdAt(baseTime)
                .updatedAt(baseTime)
                .build();
        complaint.setSlaDeadline(slaService.calculateDeadline(complaint));
        return complaintRepository.save(complaint);
    }

    @Nested
    @DisplayName("SLA Engine Tests")
    class SlaEngineTests {

        @Test
        @DisplayName("SLA deadline is calculated correctly based on priority")
        void testSlaDeadlineCalculatedCorrectly() {
            Complaint criticalComplaint = Complaint.builder().createdAt(baseTime).priority(Priority.CRITICAL).build();
            assertThat(slaService.calculateDeadline(criticalComplaint)).isEqualTo(baseTime.plus(1, ChronoUnit.HOURS));

            Complaint highComplaint = Complaint.builder().createdAt(baseTime).priority(Priority.HIGH).build();
            assertThat(slaService.calculateDeadline(highComplaint)).isEqualTo(baseTime.plus(4, ChronoUnit.HOURS));

            Complaint mediumComplaint = Complaint.builder().createdAt(baseTime).priority(Priority.MEDIUM).build();
            assertThat(slaService.calculateDeadline(mediumComplaint)).isEqualTo(baseTime.plus(24, ChronoUnit.HOURS));

            Complaint lowComplaint = Complaint.builder().createdAt(baseTime).priority(Priority.LOW).build();
            assertThat(slaService.calculateDeadline(lowComplaint)).isEqualTo(baseTime.plus(48, ChronoUnit.HOURS));

            Complaint nullPriorityComplaint = Complaint.builder().createdAt(baseTime).priority(null).build();
            assertThat(slaService.calculateDeadline(nullPriorityComplaint)).isEqualTo(baseTime.plus(24, ChronoUnit.HOURS));
        }

        @Test
        @DisplayName("SLA deadline honors SystemSetting when configured")
        void testSlaDeadlineConfigurableViaSystemSetting() {
            systemSettingRepository.save(SystemSetting.builder()
                    .key("SLA_HOURS_HIGH")
                    .value("8")
                    .build());

            Complaint highComplaint = Complaint.builder().createdAt(baseTime).priority(Priority.HIGH).build();
            assertThat(slaService.calculateDeadline(highComplaint)).isEqualTo(baseTime.plus(8, ChronoUnit.HOURS));
        }

        @Test
        @DisplayName("SLA deadline is persisted in Complaint entity")
        void testSlaDeadlinePersisted() {
            Complaint complaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.ASSIGNED);
            assertThat(complaint.getSlaDeadline()).isNotNull();

            Complaint persisted = complaintRepository.findById(complaint.getId()).orElseThrow();
            assertThat(persisted.getSlaDeadline()).isEqualTo(baseTime.plus(4, ChronoUnit.HOURS));
        }

        @Test
        @DisplayName("Non-breached complaint returns false")
        void testNonBreachedComplaintReturnsFalse() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);
            // Deadline is baseTime + 24h, clock is at baseTime
            assertThat(slaService.isBreached(complaint)).isFalse();
        }

        @Test
        @DisplayName("Overdue complaint is detected as breached")
        void testOverdueComplaintDetected() {
            Complaint complaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.ASSIGNED);
            // Move clock forward to baseTime + 5 hours (past 4h deadline)
            Instant futureTime = baseTime.plus(5, ChronoUnit.HOURS);
            if (slaService instanceof SlaServiceImpl slaServiceImpl) {
                slaServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }

            assertThat(slaService.isBreached(complaint)).isTrue();
        }

        @Test
        @DisplayName("Closed and confirmed complaints are not marked as breached even if past deadline")
        void testClosedComplaintNotBreached() {
            Complaint closedComplaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.CLOSED);
            Complaint confirmedComplaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.STUDENT_CONFIRMED);

            Instant futureTime = baseTime.plus(10, ChronoUnit.HOURS);
            if (slaService instanceof SlaServiceImpl slaServiceImpl) {
                slaServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }

            assertThat(slaService.isBreached(closedComplaint)).isFalse();
            assertThat(slaService.isBreached(confirmedComplaint)).isFalse();
        }

        @Test
        @DisplayName("Already breached complaint is not processed twice by SLA processor")
        void testAlreadyBreachedComplaintNotProcessedTwice() {
            Complaint complaint = createBaseComplaint(Priority.CRITICAL, ComplaintStatus.ASSIGNED);
            // Move clock to baseTime + 2 hours (past 1h deadline)
            Instant futureTime = baseTime.plus(2, ChronoUnit.HOURS);
            if (slaService instanceof SlaServiceImpl slaServiceImpl) {
                slaServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }
            if (escalationService instanceof EscalationServiceImpl escalationServiceImpl) {
                escalationServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }

            // First run: processes breach and escalates
            List<Complaint> processedFirstRun = slaService.processSlaBreaches();
            assertThat(processedFirstRun).extracting(Complaint::getId).contains(complaint.getId());

            List<Escalation> escalationsAfterFirst = escalationRepository.findByComplaintId(complaint.getId());
            assertThat(escalationsAfterFirst).hasSize(1);
            assertThat(escalationsAfterFirst.get(0).getTriggerType()).isEqualTo(EscalationTriggerType.SLA_BREACH);

            // Second run: must skip already processed breach
            List<Complaint> processedSecondRun = slaService.processSlaBreaches();
            assertThat(processedSecondRun).extracting(Complaint::getId).doesNotContain(complaint.getId());

            List<Escalation> escalationsAfterSecond = escalationRepository.findByComplaintId(complaint.getId());
            assertThat(escalationsAfterSecond).hasSize(1); // Duplicate prevented
        }
    }

    @Nested
    @DisplayName("Escalation Engine Tests")
    class EscalationEngineTests {

        @Test
        @DisplayName("Staff escalates to Deputy Warden")
        void testEscalateStaffToDeputyWarden() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);
            assertThat(complaint.getAssignee().getRole()).isEqualTo(UserRole.ELECTRICIAN);

            Escalation escalation = escalationService.escalate(complaint, "Staff could not fix within time", EscalationTriggerType.MANUAL);

            assertThat(escalation).isNotNull();
            assertThat(escalation.getFromRole()).isEqualTo(UserRole.ELECTRICIAN);
            assertThat(escalation.getToRole()).isEqualTo(UserRole.DEPUTY_WARDEN);
            assertThat(escalation.getTriggerType()).isEqualTo(EscalationTriggerType.MANUAL);
            assertThat(complaint.getStatus()).isEqualTo(ComplaintStatus.ESCALATED);
            assertThat(complaint.getAssignee().getRole()).isEqualTo(UserRole.DEPUTY_WARDEN);
        }

        @Test
        @DisplayName("Deputy Warden escalates to Warden")
        void testEscalateDeputyWardenToWarden() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);

            // Step 1: Staff -> Deputy Warden
            escalationService.escalate(complaint, "First level escalation", EscalationTriggerType.MANUAL);

            // Step 2: Deputy Warden -> Warden
            Escalation secondEscalation = escalationService.escalate(complaint, "Complex structural hazard", EscalationTriggerType.MANUAL);

            assertThat(secondEscalation).isNotNull();
            assertThat(secondEscalation.getFromRole()).isEqualTo(UserRole.DEPUTY_WARDEN);
            assertThat(secondEscalation.getToRole()).isEqualTo(UserRole.WARDEN);
            assertThat(complaint.getAssignee().getRole()).isEqualTo(UserRole.WARDEN);
        }

        @Test
        @DisplayName("Warden cannot escalate further and throws IllegalStateException")
        void testWardenCannotEscalateFurther() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);

            // Escalate to Deputy Warden
            escalationService.escalate(complaint, "L1 escalation", EscalationTriggerType.MANUAL);
            // Escalate to Warden
            escalationService.escalate(complaint, "L2 escalation", EscalationTriggerType.MANUAL);

            assertThat(escalationService.canEscalate(complaint)).isFalse();

            assertThatThrownBy(() -> escalationService.escalate(complaint, "L3 impossible", EscalationTriggerType.MANUAL))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("cannot be escalated beyond WARDEN");
        }

        @Test
        @DisplayName("SLA breach triggers escalation")
        void testSlaBreachTriggersEscalation() {
            Complaint complaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.ASSIGNED);

            // Move clock past deadline
            Instant futureTime = baseTime.plus(6, ChronoUnit.HOURS);
            if (slaService instanceof SlaServiceImpl slaServiceImpl) {
                slaServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }
            if (escalationService instanceof EscalationServiceImpl escalationServiceImpl) {
                escalationServiceImpl.setClock(Clock.fixed(futureTime, ZoneOffset.UTC));
            }

            slaService.processSlaBreaches();

            List<Escalation> escalations = escalationRepository.findByComplaintId(complaint.getId());
            assertThat(escalations).hasSize(1);
            Escalation esc = escalations.get(0);
            assertThat(esc.getTriggerType()).isEqualTo(EscalationTriggerType.SLA_BREACH);
            assertThat(esc.getFromRole()).isEqualTo(UserRole.ELECTRICIAN);
            assertThat(esc.getToRole()).isEqualTo(UserRole.DEPUTY_WARDEN);
        }

        @Test
        @DisplayName("Critical complaint can trigger escalation")
        void testCriticalComplaintCanTriggerEscalation() {
            Complaint complaint = createBaseComplaint(Priority.CRITICAL, ComplaintStatus.ASSIGNED);

            Escalation escalation = escalationService.escalateCritical(complaint, "Emergency fire hazard in switchboard");

            assertThat(escalation).isNotNull();
            assertThat(escalation.getTriggerType()).isEqualTo(EscalationTriggerType.CRITICAL_EMERGENCY);
            assertThat(escalation.getToRole()).isEqualTo(UserRole.DEPUTY_WARDEN);

            // Calling on non-critical complaint throws IllegalArgumentException
            Complaint normalComplaint = createBaseComplaint(Priority.LOW, ComplaintStatus.ASSIGNED);
            assertThatThrownBy(() -> escalationService.escalateCritical(normalComplaint, "Not critical"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Manual escalation works properly")
        void testManualEscalationWorks() {
            Complaint complaint = createBaseComplaint(Priority.LOW, ComplaintStatus.ASSIGNED);

            Escalation escalation = escalationService.escalate(complaint, "Student requested manual administrative escalation", EscalationTriggerType.MANUAL);

            assertThat(escalation).isNotNull();
            assertThat(escalation.getTriggerType()).isEqualTo(EscalationTriggerType.MANUAL);
            assertThat(escalation.getReason()).contains("manual administrative escalation");
        }

        @Test
        @DisplayName("Duplicate escalation for the same stage and trigger is prevented")
        void testDuplicateEscalationPrevented() {
            Complaint complaint = createBaseComplaint(Priority.CRITICAL, ComplaintStatus.ASSIGNED);

            Escalation esc1 = escalationService.escalateCritical(complaint, "Critical escalation");
            Escalation esc2 = escalationService.escalateCritical(complaint, "Duplicate critical escalation attempt");

            assertThat(esc1.getId()).isEqualTo(esc2.getId());
            assertThat(escalationRepository.findByComplaintId(complaint.getId())).hasSize(1);

            // Verify duplicate SLA_BREACH escalation prevention
            Complaint slaComplaint = createBaseComplaint(Priority.HIGH, ComplaintStatus.ASSIGNED);
            Escalation slaEsc1 = escalationService.escalate(slaComplaint, "SLA breach", EscalationTriggerType.SLA_BREACH);
            Escalation slaEsc2 = escalationService.escalate(slaComplaint, "Duplicate SLA breach", EscalationTriggerType.SLA_BREACH);

            assertThat(slaEsc1.getId()).isEqualTo(slaEsc2.getId());
            assertThat(escalationRepository.findByComplaintId(slaComplaint.getId())).hasSize(1);
        }

        @Test
        @DisplayName("Escalation history is created upon escalation")
        void testEscalationHistoryCreated() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);

            escalationService.escalate(complaint, "Staff unresponsive", EscalationTriggerType.MANUAL);

            List<ComplaintHistory> histories = complaintHistoryRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
            assertThat(histories).anySatisfy(h -> {
                assertThat(h.getAction()).isEqualTo(HistoryAction.ESCALATED);
                assertThat(h.getOldValue()).isEqualTo(UserRole.ELECTRICIAN.name());
                assertThat(h.getNewValue()).isEqualTo(UserRole.DEPUTY_WARDEN.name());
                assertThat(h.getReason()).contains("Staff unresponsive");
            });
        }

        @Test
        @DisplayName("Escalation notification is sent to the target role")
        void testEscalationNotificationTriggered() {
            Complaint complaint = createBaseComplaint(Priority.MEDIUM, ComplaintStatus.ASSIGNED);

            // Escalate to Deputy Warden
            escalationService.escalate(complaint, "Urgent review required", EscalationTriggerType.MANUAL);

            List<Notification> deputyNotifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(deputyWarden.getId());
            assertThat(deputyNotifications).isNotEmpty();
            assertThat(deputyNotifications.get(0).getType()).isEqualTo(NotificationType.ESCALATED);
            assertThat(deputyNotifications.get(0).getTitle()).contains("DEPUTY WARDEN");

            // Escalate to Warden
            escalationService.escalate(complaint, "Further intervention needed", EscalationTriggerType.MANUAL);

            List<Notification> wardenNotifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(warden.getId());
            assertThat(wardenNotifications).isNotEmpty();
            assertThat(wardenNotifications.get(0).getType()).isEqualTo(NotificationType.ESCALATED);
            assertThat(wardenNotifications.get(0).getTitle()).contains("WARDEN");
        }
    }
}
