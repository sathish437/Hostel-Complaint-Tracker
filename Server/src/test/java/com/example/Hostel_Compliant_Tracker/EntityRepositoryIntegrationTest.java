package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.entity.*;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class EntityRepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private ComplaintHistoryRepository complaintHistoryRepository;

    @Autowired
    private EscalationRepository escalationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Test
    @DisplayName("Verify User, Complaint, Assignment, History, Escalation, Notification, Attachment, and SystemSetting persistence")
    void testFullPersistenceWorkflow() {
        // 1. Create Student and Staff Users
        User student = User.builder()
                .name("Arun Kumar")
                .email("arun.student@elevix.edu")
                .phone("+919876543210")
                .passwordHash("$2a$12$e8Y4vFz...hash")
                .role(UserRole.STUDENT)
                .active(true)
                .build();
        student = userRepository.save(student);
        assertThat(student.getId()).isNotNull();
        assertThat(userRepository.findByEmail("arun.student@elevix.edu")).isPresent();

        User electrician = User.builder()
                .name("Murugan (Electrician)")
                .email("murugan.elec@elevix.edu")
                .phone("+919876543211")
                .passwordHash("$2a$12$e8Y4vFz...hash")
                .role(UserRole.ELECTRICIAN)
                .active(true)
                .build();
        electrician = userRepository.save(electrician);
        assertThat(electrician.getId()).isNotNull();

        User officeAdmin = User.builder()
                .name("Hostel Office Incharge")
                .email("office@elevix.edu")
                .phone("+919876543212")
                .passwordHash("$2a$12$e8Y4vFz...hash")
                .role(UserRole.HOSTEL_OFFICE)
                .active(true)
                .build();
        officeAdmin = userRepository.save(officeAdmin);

        // 2. Create Complaint
        Complaint complaint = Complaint.builder()
                .complaintNumber("CMP-1042")
                .student(student)
                .category(ComplaintCategory.ELECTRICAL)
                .description("Fan sparking and burning smell in room 203")
                .location("Block B - Room 203")
                .priority(Priority.CRITICAL)
                .status(ComplaintStatus.SUBMITTED)
                .slaDeadline(Instant.now().plusSeconds(7200))
                .build();
        complaint = complaintRepository.save(complaint);
        assertThat(complaint.getId()).isNotNull();

        Optional<Complaint> foundComplaint = complaintRepository.findByComplaintNumber("CMP-1042");
        assertThat(foundComplaint).isPresent();
        assertThat(foundComplaint.get().getCategory()).isEqualTo(ComplaintCategory.ELECTRICAL);

        // 3. Create Initial Assignment
        Assignment initialAssignment = Assignment.builder()
                .complaint(complaint)
                .assignedTo(electrician)
                .assignedBy(officeAdmin)
                .assignmentType(AssignmentType.AUTOMATIC)
                .reason("Auto-assigned by workload and category")
                .build();
        initialAssignment = assignmentRepository.save(initialAssignment);
        assertThat(initialAssignment.getId()).isNotNull();

        // 4. Update Complaint current assignee & status
        complaint.setAssignee(electrician);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaintRepository.save(complaint);

        // 5. Test Reassignment Rule (same staff follow-up or different staff)
        Assignment reAssignment = Assignment.builder()
                .complaint(complaint)
                .assignedTo(electrician)
                .assignedBy(officeAdmin)
                .assignmentType(AssignmentType.REASSIGNED)
                .reason("Follow-up work required for same electrician")
                .build();
        reAssignment = assignmentRepository.save(reAssignment);
        assertThat(reAssignment.getId()).isNotNull();
        assertThat(reAssignment.getAssignmentType()).isEqualTo(AssignmentType.REASSIGNED);

        List<Assignment> assignments = assignmentRepository.findByComplaintId(complaint.getId());
        assertThat(assignments).hasSize(2);

        // 6. Create Complaint History
        ComplaintHistory historyCreated = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(student)
                .action(HistoryAction.CREATED)
                .newValue("SUBMITTED")
                .reason("New student complaint submitted")
                .build();
        complaintHistoryRepository.save(historyCreated);

        ComplaintHistory historyAssigned = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(officeAdmin)
                .action(HistoryAction.ASSIGNED)
                .oldValue("SUBMITTED")
                .newValue("ASSIGNED")
                .reason("Assigned to Electrician")
                .build();
        complaintHistoryRepository.save(historyAssigned);

        List<ComplaintHistory> histories = complaintHistoryRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
        assertThat(histories).hasSize(2);

        // 7. Create Escalation
        Escalation escalation = Escalation.builder()
                .complaint(complaint)
                .fromRole(UserRole.ELECTRICIAN)
                .toRole(UserRole.DEPUTY_WARDEN)
                .triggerType(EscalationTriggerType.SLA_BREACH)
                .reason("SLA breached without resolution")
                .build();
        escalation = escalationRepository.save(escalation);
        assertThat(escalation.getId()).isNotNull();
        assertThat(escalationRepository.findByComplaintId(complaint.getId())).hasSize(1);

        // 8. Create Notification
        Notification notification = Notification.builder()
                .user(electrician)
                .complaint(complaint)
                .type(NotificationType.ASSIGNED)
                .title("New Complaint Assigned")
                .message("Complaint CMP-1042 assigned to you")
                .read(false)
                .build();
        notification = notificationRepository.save(notification);
        assertThat(notification.getId()).isNotNull();
        assertThat(notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(electrician.getId())).hasSize(1);

        // 9. Create Attachment
        Attachment attachment = Attachment.builder()
                .complaint(complaint)
                .fileName("sparking_fan.jpg")
                .fileUrl("/uploads/cmp-1042/sparking_fan.jpg")
                .contentType("image/jpeg")
                .uploadedBy(student)
                .build();
        attachment = attachmentRepository.save(attachment);
        assertThat(attachment.getId()).isNotNull();
        assertThat(attachmentRepository.findByComplaintId(complaint.getId())).hasSize(1);

        // 10. Create System Setting
        SystemSetting automationSetting = SystemSetting.builder()
                .key("ASSIGNMENT_AUTOMATION_ENABLED")
                .value("true")
                .updatedBy(officeAdmin)
                .build();
        automationSetting = systemSettingRepository.save(automationSetting);
        assertThat(automationSetting.getId()).isNotNull();

        Optional<SystemSetting> foundSetting = systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED");
        assertThat(foundSetting).isPresent();
        assertThat(foundSetting.get().getValue()).isEqualTo("true");
    }
}
