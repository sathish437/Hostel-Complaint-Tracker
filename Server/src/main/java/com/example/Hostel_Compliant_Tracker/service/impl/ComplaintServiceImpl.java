package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintCreateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintStatusUpdateRequest;
import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.*;
import com.example.Hostel_Compliant_Tracker.exception.ComplaintNotFoundException;
import com.example.Hostel_Compliant_Tracker.exception.IllegalStatusTransitionException;
import com.example.Hostel_Compliant_Tracker.exception.StudentNotFoundException;
import com.example.Hostel_Compliant_Tracker.mapper.ComplaintMapper;
import com.example.Hostel_Compliant_Tracker.repository.ComplaintRepository;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
import com.example.Hostel_Compliant_Tracker.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintMapper complaintMapper;
    private final ClassificationService classificationService;
    private final PriorityService priorityService;
    private final AssignmentService assignmentService;
    private final SlaService slaService;
    private final EscalationService escalationService;
    private final NotificationService notificationService;
    private final ComplaintHistoryService complaintHistoryService;

    private static final AtomicLong COMPLAINT_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    @Override
    @Transactional
    public ComplaintResponse createComplaint(ComplaintCreateRequest request) {
        User student = resolveStudent(request.getStudent());

        ComplaintCategory category = classificationService.classify(request.getText(), request.getCategory());
        Priority priority = priorityService.calculatePriority(request.getText(), category, request.getPriority());

        String complaintNumber = "CMP-" + String.format("%04d", COMPLAINT_SEQ.incrementAndGet());

        String location = request.getHostel().trim() + " - Room " + request.getRoom().trim();

        Complaint complaint = Complaint.builder()
                .complaintNumber(complaintNumber)
                .student(student)
                .category(category)
                .description(request.getText())
                .hostel(request.getHostel().trim())
                .room(request.getRoom().trim())
                .location(location)
                .priority(priority)
                .status(ComplaintStatus.SUBMITTED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        complaint.setSlaDeadline(slaService.calculateDeadline(complaint));

        complaint = complaintRepository.save(complaint);

        complaintHistoryService.recordHistory(
                complaint,
                student,
                HistoryAction.CREATED,
                null,
                complaintMapper.toApiStatus(complaint.getStatus()),
                "Complaint created by student"
        );

        assignmentService.assignComplaint(complaint, "Automatic routing on creation");
        complaint = complaintRepository.save(complaint);

        notificationService.sendNotification(
                student,
                complaint,
                NotificationType.COMPLAINT_CREATED,
                "Complaint Submitted",
                "Your complaint #" + complaint.getComplaintNumber() + " has been submitted."
        );

        if (complaint.getAssignee() != null) {
            notificationService.sendNotification(
                    complaint.getAssignee(),
                    complaint,
                    NotificationType.ASSIGNED,
                    "New Complaint Assigned",
                    "Complaint #" + complaint.getComplaintNumber() + " assigned to you."
            );
        }

        return complaintMapper.toResponse(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(String status, String hostel) {
        List<Complaint> complaints;

        boolean hasStatus = status != null && !status.trim().isEmpty();
        boolean hasHostel = hostel != null && !hostel.trim().isEmpty();

        if (hasStatus && hasHostel) {
            List<ComplaintStatus> internalStatuses = complaintMapper.toInternalStatusesForFilter(status);
            complaints = complaintRepository.findByStatusInAndHostel(internalStatuses, hostel.trim());
        } else if (hasStatus) {
            List<ComplaintStatus> internalStatuses = complaintMapper.toInternalStatusesForFilter(status);
            complaints = complaintRepository.findByStatusIn(internalStatuses);
        } else if (hasHostel) {
            complaints = complaintRepository.findByHostel(hostel.trim());
        } else {
            complaints = complaintRepository.findAll();
        }

        return complaints.stream()
                .map(complaintMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(String id) {
        Long numericId = complaintMapper.parseComplaintId(id);
        Complaint complaint = complaintRepository.findById(numericId)
                .orElseThrow(() -> new ComplaintNotFoundException("Complaint not found with ID: " + id));
        return complaintMapper.toResponse(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponse updateComplaintStatus(String id, ComplaintStatusUpdateRequest request) {
        Long numericId = complaintMapper.parseComplaintId(id);
        Complaint complaint = complaintRepository.findById(numericId)
                .orElseThrow(() -> new ComplaintNotFoundException("Complaint not found with ID: " + id));

        ComplaintStatus currentStatus = complaint.getStatus();
        ComplaintStatus targetStatus = complaintMapper.toInternalTargetStatus(request.getStatus(), complaint);

        validateStatusTransition(currentStatus, targetStatus, request.getStatus());

        String oldApiStatus = complaintMapper.toApiStatus(currentStatus);

        complaint.setStatus(targetStatus);
        complaint.setUpdatedAt(Instant.now());

        if (targetStatus == ComplaintStatus.CLOSED) {
            complaint.setClosedAt(Instant.now());
            if (complaint.getResolvedAt() == null) {
                complaint.setResolvedAt(Instant.now());
            }
        } else if (targetStatus == ComplaintStatus.ESCALATED) {
            escalationService.escalate(complaint, request.getNote(), EscalationTriggerType.MANUAL);
        }

        complaint = complaintRepository.save(complaint);

        complaintHistoryService.recordHistory(
                complaint,
                null,
                HistoryAction.STATUS_CHANGED,
                oldApiStatus,
                request.getStatus(),
                request.getNote()
        );

        if (complaint.getStudent() != null) {
            notificationService.sendNotification(
                    complaint.getStudent(),
                    complaint,
                    NotificationType.STATUS_CHANGED,
                    "Complaint Status Changed",
                    "Your complaint status was updated to " + request.getStatus()
            );
        }

        return complaintMapper.toResponse(complaint);
    }

    private User resolveStudent(String studentIdentifier) {
        if (studentIdentifier == null || studentIdentifier.trim().isEmpty()) {
            throw new StudentNotFoundException("Student identifier must not be empty");
        }

        String trimmed = studentIdentifier.trim();

        Optional<User> byEmail = userRepository.findByEmail(trimmed);
        if (byEmail.isPresent()) {
            return byEmail.get();
        }

        try {
            long numericId = Long.parseLong(trimmed);
            Optional<User> byId = userRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {
        }

        List<User> students = userRepository.findByRole(UserRole.STUDENT);
        for (User u : students) {
            if (trimmed.equalsIgnoreCase(u.getName()) || trimmed.equalsIgnoreCase(u.getEmail())) {
                return u;
            }
        }

        throw new StudentNotFoundException("Student not found for identifier: " + studentIdentifier);
    }

    private void validateStatusTransition(ComplaintStatus current, ComplaintStatus target, String apiStatus) {
        if (current == target) {
            return;
        }

        if (current == ComplaintStatus.CLOSED || current == ComplaintStatus.STUDENT_CONFIRMED) {
            if (target != ComplaintStatus.REOPENED) {
                throw new IllegalStatusTransitionException("Closed complaint cannot be transitioned to " + apiStatus + " directly without reopening");
            }
        }
    }
}
