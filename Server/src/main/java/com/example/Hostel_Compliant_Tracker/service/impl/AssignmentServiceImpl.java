package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.entity.Assignment;
import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.SystemSetting;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.AssignmentType;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import com.example.Hostel_Compliant_Tracker.repository.AssignmentRepository;
import com.example.Hostel_Compliant_Tracker.repository.SystemSettingRepository;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
import com.example.Hostel_Compliant_Tracker.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;

    @Override
    @Transactional
    public Assignment assignComplaint(Complaint complaint, String reason) {
        boolean automationEnabled = systemSettingRepository.findByKey("ASSIGNMENT_AUTOMATION_ENABLED")
                .map(setting -> Boolean.parseBoolean(setting.getValue()))
                .orElse(true);

        if (!automationEnabled) {
            return null;
        }

        UserRole targetRole = getTargetRoleForCategory(complaint.getCategory());
        List<User> eligibleStaff = userRepository.findByRoleAndActiveTrue(targetRole);

        if (eligibleStaff.isEmpty() && targetRole != UserRole.HOSTEL_OFFICE) {
            eligibleStaff = userRepository.findByRoleAndActiveTrue(UserRole.HOSTEL_OFFICE);
        }

        if (eligibleStaff.isEmpty()) {
            return null;
        }

        User assignedStaff = eligibleStaff.get(0);

        Assignment assignment = Assignment.builder()
                .complaint(complaint)
                .assignedTo(assignedStaff)
                .assignmentType(AssignmentType.AUTOMATIC)
                .reason(reason != null ? reason : "Auto-assigned by category " + complaint.getCategory())
                .assignedAt(Instant.now())
                .build();

        complaint.setAssignee(assignedStaff);
        complaint.setStatus(ComplaintStatus.ASSIGNED);

        return assignmentRepository.save(assignment);
    }

    @Override
    @Transactional
    public Assignment reassignComplaint(Complaint complaint, User newAssignee, User assignedBy, String reason) {
        Assignment assignment = Assignment.builder()
                .complaint(complaint)
                .assignedTo(newAssignee)
                .assignedBy(assignedBy)
                .assignmentType(AssignmentType.REASSIGNED)
                .reason(reason)
                .assignedAt(Instant.now())
                .build();

        complaint.setAssignee(newAssignee);
        return assignmentRepository.save(assignment);
    }

    private UserRole getTargetRoleForCategory(ComplaintCategory category) {
        if (category == null) {
            return UserRole.HOSTEL_OFFICE;
        }
        return switch (category) {
            case ELECTRICAL -> UserRole.ELECTRICIAN;
            case WATER_PLUMBING, ROOM_FURNITURE, INTERNET_WIFI, INTERNET, GENERAL, DISCIPLINE_HOSTEL_ENVIRONMENT, OTHER -> UserRole.HOSTEL_OFFICE;
            case CLEANING_HYGIENE -> UserRole.CLEANING_WORKER;
            case FOOD_MESS -> UserRole.MASTER;
            case SECURITY -> UserRole.WATCHMAN;
        };
    }
}
