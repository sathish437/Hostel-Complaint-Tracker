package com.example.Hostel_Compliant_Tracker.mapper;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import com.example.Hostel_Compliant_Tracker.exception.InvalidComplaintIdException;
import com.example.Hostel_Compliant_Tracker.exception.InvalidEnumValueException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
public class ComplaintMapper {

    public Long parseComplaintId(String idStr) {
        if (idStr == null || idStr.trim().isEmpty()) {
            throw new InvalidComplaintIdException("Complaint ID must not be empty");
        }
        try {
            long id = Long.parseLong(idStr.trim());
            if (id <= 0) {
                throw new InvalidComplaintIdException("Complaint ID must be a positive number: " + idStr);
            }
            return id;
        } catch (NumberFormatException e) {
            throw new InvalidComplaintIdException("Invalid complaint ID format: " + idStr);
        }
    }

    public String toApiCategory(ComplaintCategory internalCategory) {
        if (internalCategory == null) {
            return "other";
        }
        return switch (internalCategory) {
            case ELECTRICAL -> "electrical";
            case WATER_PLUMBING -> "plumbing";
            case CLEANING_HYGIENE -> "cleaning";
            case ROOM_FURNITURE, INTERNET_WIFI, FOOD_MESS, SECURITY,
                 DISCIPLINE_HOSTEL_ENVIRONMENT, OTHER -> "other";
        };
    }

    public ComplaintCategory toInternalCategory(String apiCategory) {
        if (apiCategory == null || apiCategory.trim().isEmpty()) {
            return ComplaintCategory.OTHER;
        }
        return switch (apiCategory.trim().toLowerCase()) {
            case "electrical" -> ComplaintCategory.ELECTRICAL;
            case "plumbing" -> ComplaintCategory.WATER_PLUMBING;
            case "cleaning" -> ComplaintCategory.CLEANING_HYGIENE;
            case "other" -> ComplaintCategory.OTHER;
            default -> throw new InvalidEnumValueException("Invalid category: " + apiCategory);
        };
    }

    public String toApiPriority(Priority internalPriority) {
        if (internalPriority == null) {
            return "normal";
        }
        return switch (internalPriority) {
            case LOW -> "low";
            case MEDIUM -> "normal";
            case HIGH, CRITICAL -> "high";
        };
    }

    public Priority toInternalPriority(String apiPriority) {
        if (apiPriority == null || apiPriority.trim().isEmpty()) {
            return null;
        }
        return switch (apiPriority.trim().toLowerCase()) {
            case "low" -> Priority.LOW;
            case "normal" -> Priority.MEDIUM;
            case "high" -> Priority.HIGH;
            default -> throw new InvalidEnumValueException("Invalid priority: " + apiPriority);
        };
    }

    public String toApiStatus(ComplaintStatus internalStatus) {
        if (internalStatus == null) {
            return "open";
        }
        return switch (internalStatus) {
            case SUBMITTED, ASSIGNED, ACKNOWLEDGED, REOPENED -> "open";
            case IN_PROGRESS, RESOLUTION_PENDING -> "in_progress";
            case SLA_BREACHED, ESCALATED -> "escalated";
            case STUDENT_CONFIRMED, CLOSED -> "closed";
        };
    }

    public List<ComplaintStatus> toInternalStatusesForFilter(String apiStatus) {
        if (apiStatus == null || apiStatus.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return switch (apiStatus.trim().toLowerCase()) {
            case "open" -> List.of(
                    ComplaintStatus.SUBMITTED,
                    ComplaintStatus.ASSIGNED,
                    ComplaintStatus.ACKNOWLEDGED,
                    ComplaintStatus.REOPENED
            );
            case "in_progress" -> List.of(
                    ComplaintStatus.IN_PROGRESS,
                    ComplaintStatus.RESOLUTION_PENDING
            );
            case "escalated" -> List.of(
                    ComplaintStatus.SLA_BREACHED,
                    ComplaintStatus.ESCALATED
            );
            case "closed" -> List.of(
                    ComplaintStatus.STUDENT_CONFIRMED,
                    ComplaintStatus.CLOSED
            );
            default -> throw new InvalidEnumValueException("Invalid status filter: " + apiStatus);
        };
    }

    public ComplaintStatus toInternalTargetStatus(String apiStatus, Complaint existing) {
        if (apiStatus == null || apiStatus.trim().isEmpty()) {
            throw new InvalidEnumValueException("Status cannot be empty");
        }
        return switch (apiStatus.trim().toLowerCase()) {
            case "open" -> {
                if (existing != null && (existing.getStatus() == ComplaintStatus.CLOSED ||
                        existing.getStatus() == ComplaintStatus.STUDENT_CONFIRMED)) {
                    yield ComplaintStatus.REOPENED;
                }
                yield ComplaintStatus.SUBMITTED;
            }
            case "in_progress" -> ComplaintStatus.IN_PROGRESS;
            case "escalated" -> ComplaintStatus.ESCALATED;
            case "closed" -> ComplaintStatus.CLOSED;
            default -> throw new InvalidEnumValueException("Invalid status: " + apiStatus);
        };
    }

    public ComplaintResponse toResponse(Complaint complaint) {
        if (complaint == null) {
            return null;
        }

        String hostel = complaint.getHostel();
        String room = complaint.getRoom();
        if ((hostel == null || room == null) && complaint.getLocation() != null) {
            String[] parts = complaint.getLocation().split(" - Room | - room | Room | room |:|,");
            if (hostel == null && parts.length > 0) {
                hostel = parts[0].trim();
            }
            if (room == null && parts.length > 1) {
                room = parts[1].trim();
            }
        }

        String studentName = "Unknown";
        if (complaint.getStudent() != null) {
            studentName = complaint.getStudent().getName();
        }

        boolean isBreached = false;
        if (complaint.getStatus() == ComplaintStatus.SLA_BREACHED) {
            isBreached = true;
        } else if (complaint.getSlaDeadline() != null &&
                Instant.now().isAfter(complaint.getSlaDeadline()) &&
                complaint.getStatus() != ComplaintStatus.CLOSED &&
                complaint.getStatus() != ComplaintStatus.STUDENT_CONFIRMED) {
            isBreached = true;
        }

        return ComplaintResponse.builder()
                .id(String.valueOf(complaint.getId()))
                .student(studentName)
                .hostel(hostel != null ? hostel : "N/A")
                .room(room != null ? room : "N/A")
                .category(toApiCategory(complaint.getCategory()))
                .text(complaint.getDescription())
                .priority(toApiPriority(complaint.getPriority()))
                .status(toApiStatus(complaint.getStatus()))
                .slaDueAt(complaint.getSlaDeadline())
                .breached(isBreached)
                .createdAt(complaint.getCreatedAt())
                .build();
    }
}
