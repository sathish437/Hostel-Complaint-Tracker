package com.example.Hostel_Compliant_Tracker.config;

import com.example.Hostel_Compliant_Tracker.entity.*;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final NotificationRepository notificationRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;

    @Override
    public void run(String... args) {
        initializeSettings();
        initializeUsers();
        initializeComplaints();
    }

    private void initializeSettings() {
        if (systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED").isEmpty()) {
            systemSettingRepository.save(SystemSetting.builder()
                    .key("ASSIGNMENT_AUTOMATION_ENABLED")
                    .value("true")
                    .build());
        }
    }

    private void initializeUsers() {
        seedUserIfNotExists("usr-student-1", "Rajesh Kumar", "rajesh_k", "rajesh@hostel.edu", "+91 98765 43210", UserRole.STUDENT, "B-203", "Block B", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-student-2", "Sneha Patel", "sneha_p", "sneha@hostel.edu", "+91 98765 11223", UserRole.STUDENT, "A-104", "Block A", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-office-1", "Priya Sharma (Office Admin)", "office_admin", "office@hostel.edu", "+91 98765 88990", UserRole.HOSTEL_OFFICE, null, null, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-electrician-1", "Murugan E. (Lead Electrician)", "electrician_murugan", "electrician@hostel.edu", "+91 98450 12345", UserRole.ELECTRICIAN, null, null, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-cleaner-1", "Ramesh S. (Sanitation Officer)", "cleaner_ramesh", "cleaning@hostel.edu", "+91 98450 67890", UserRole.CLEANING_WORKER, null, null, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-master-1", "Chef Suresh (Mess Master)", "mess_master", "master@hostel.edu", "+91 98450 54321", UserRole.MASTER, null, null, "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-watchman-1", "Bahadur Singh (Chief Guard)", "watchman_bahadur", "watchman@hostel.edu", "+91 98450 99887", UserRole.WATCHMAN, null, null, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-deputy-1", "Dr. Ananya Sen (Deputy Warden)", "deputy_warden", "deputy@hostel.edu", "+91 98111 22334", UserRole.DEPUTY_WARDEN, null, null, "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80");
        seedUserIfNotExists("usr-warden-1", "Prof. K. Venkatesh (Chief Warden)", "chief_warden", "warden@hostel.edu", "+91 98111 99887", UserRole.WARDEN, null, null, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80");
    }

    private void seedUserIfNotExists(String idOrName, String name, String username, String email, String phone, UserRole role, String room, String block, String avatarUrl) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .name(name)
                    .username(username)
                    .email(email)
                    .phone(phone)
                    .passwordHash("password123")
                    .role(role)
                    .roomNumber(room)
                    .block(block)
                    .avatarUrl(avatarUrl)
                    .active(true)
                    .build();
            userRepository.save(user);
        }
    }

    private void initializeComplaints() {
        if (complaintRepository.count() > 0) {
            return;
        }

        User student1 = userRepository.findByEmail("rajesh@hostel.edu").orElse(null);
        User student2 = userRepository.findByEmail("sneha@hostel.edu").orElse(null);
        User electrician = userRepository.findByEmail("electrician@hostel.edu").orElse(null);
        User cleaner = userRepository.findByEmail("cleaning@hostel.edu").orElse(null);
        User master = userRepository.findByEmail("master@hostel.edu").orElse(null);
        User watchman = userRepository.findByEmail("watchman@hostel.edu").orElse(null);

        if (student1 == null) return;

        Instant now = Instant.now();

        // 1. CMP-1024
        Complaint c1 = Complaint.builder()
                .complaintNumber("CMP-1024")
                .student(student1)
                .category(ComplaintCategory.ELECTRICAL)
                .title("Ceiling fan regulator not working and sparking")
                .description("The ceiling fan in Room B-203 stopped rotating. The speed regulator makes sparking sounds when turned.")
                .location("Block B - Room B-203")
                .hostel("Block B")
                .room("B-203")
                .priority(Priority.HIGH)
                .status(ComplaintStatus.ASSIGNED)
                .assignee(electrician)
                .evidenceUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80")
                .slaDeadline(now.plus(10, ChronoUnit.HOURS))
                .isRepeatedIssue(true)
                .isEscalated(false)
                .build();
        complaintRepository.save(c1);

        // 2. CMP-1025
        if (student2 != null) {
            Complaint c2 = Complaint.builder()
                    .complaintNumber("CMP-1025")
                    .student(student2)
                    .category(ComplaintCategory.WATER_PLUMBING)
                    .title("Severe pipeline leakage under bathroom sink")
                    .description("Water is gushing from the pipe under the bathroom sink since morning, flooding the entryway.")
                    .location("Block A - Room A-104")
                    .hostel("Block A")
                    .room("A-104")
                    .priority(Priority.EMERGENCY)
                    .status(ComplaintStatus.SUBMITTED)
                    .slaDeadline(now.plus(3, ChronoUnit.HOURS))
                    .isRepeatedIssue(false)
                    .isEscalated(false)
                    .build();
            complaintRepository.save(c2);
        }

        // 3. CMP-1026
        Complaint c3 = Complaint.builder()
                .complaintNumber("CMP-1026")
                .student(student1)
                .category(ComplaintCategory.CLEANING_HYGIENE)
                .title("Corridor garbage bin overflowing and bad odor")
                .description("The 2nd floor corridor garbage has not been cleared for 2 days. Bad odor entering rooms.")
                .location("Block B - Room B-203")
                .hostel("Block B")
                .room("B-203")
                .priority(Priority.MEDIUM)
                .status(ComplaintStatus.IN_PROGRESS)
                .assignee(cleaner)
                .staffNotes("Currently cleaning corridor 201-210. Will finish by 12:30 PM.")
                .slaDeadline(now.plus(16, ChronoUnit.HOURS))
                .isRepeatedIssue(false)
                .isEscalated(false)
                .build();
        complaintRepository.save(c3);

        // 4. CMP-1027
        Complaint c4 = Complaint.builder()
                .complaintNumber("CMP-1027")
                .student(student1)
                .category(ComplaintCategory.FOOD_MESS)
                .title("Dinner rice half-cooked and cold in South Mess")
                .description("Dinner served at South Mess counter 2 had uncooked rice and lukewarm dal.")
                .location("Block B - Room B-203")
                .hostel("Block B")
                .room("B-203")
                .priority(Priority.MEDIUM)
                .status(ComplaintStatus.RESOLUTION_PENDING)
                .assignee(master)
                .staffNotes("Inspected kitchen steam boilers. Rice batch replenished and calibration updated with kitchen team.")
                .completionProofUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80")
                .slaDeadline(now.plus(10, ChronoUnit.HOURS))
                .isRepeatedIssue(false)
                .isEscalated(false)
                .build();
        complaintRepository.save(c4);

        // 5. CMP-1028
        if (student2 != null) {
            Complaint c5 = Complaint.builder()
                    .complaintNumber("CMP-1028")
                    .student(student2)
                    .category(ComplaintCategory.SECURITY)
                    .title("Block A rear exit security gate latch broken")
                    .description("The emergency latch on the rear entrance remains unlocked at night, posing safety hazard.")
                    .location("Block A - Room A-104")
                    .hostel("Block A")
                    .room("A-104")
                    .priority(Priority.EMERGENCY)
                    .status(ComplaintStatus.ESCALATED)
                    .assignee(watchman)
                    .slaDeadline(now.minus(4, ChronoUnit.HOURS))
                    .isEscalated(true)
                    .escalationLevel("DEPUTY_WARDEN")
                    .escalationReason("SLA threshold (24h) breached without on-site resolution. Escalate to Deputy Warden for hardware procurement.")
                    .escalatedAt(now.minus(4, ChronoUnit.HOURS))
                    .isRepeatedIssue(false)
                    .build();
            complaintRepository.save(c5);
        }
    }
}
