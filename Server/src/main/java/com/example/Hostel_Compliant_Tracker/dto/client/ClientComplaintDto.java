package com.example.Hostel_Compliant_Tracker.dto.client;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientComplaintDto {
    private String id;
    private String code;
    private String studentId;
    private String studentName;
    private String roomNumber;
    private String block;
    private String category;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffRole;
    private String evidenceUrl;
    private String completionProofUrl;
    private String staffNotes;
    private String reopenReason;

    // SLA fields
    private String createdAt;
    private String updatedAt;
    private String slaDeadline;
    private Long slaTotalMinutes;
    private Long slaRemainingMinutes;
    private String slaState; // 'RUNNING' | 'APPROACHING' | 'BREACHED' | 'MET'

    // Escalation fields
    private Boolean isEscalated;
    private String escalationLevel;
    private String escalationReason;
    private String escalatedAt;

    // Metadata
    private Boolean isRepeatedIssue;
}
