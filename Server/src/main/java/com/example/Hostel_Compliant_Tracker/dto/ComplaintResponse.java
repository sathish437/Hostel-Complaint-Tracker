package com.example.Hostel_Compliant_Tracker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response representation of a complaint")
public class ComplaintResponse {

    @Schema(description = "Unique complaint ID (string)", example = "1042")
    private String id;

    @Schema(description = "Student identifier or name", example = "Arun Kumar")
    private String student;

    @Schema(description = "Hostel name or block", example = "Cauvery Hostel")
    private String hostel;

    @Schema(description = "Room number", example = "302")
    private String room;

    @Schema(
        description = "Complaint category",
        allowableValues = {"electrical", "plumbing", "cleaning", "other"},
        example = "electrical"
    )
    private String category;

    @Schema(description = "Complaint text description", example = "Switch board sparking and burning smell")
    private String text;

    @Schema(
        description = "Priority level",
        allowableValues = {"low", "normal", "high"},
        example = "high"
    )
    private String priority;

    @Schema(
        description = "Current lifecycle status",
        allowableValues = {"open", "in_progress", "escalated", "closed"},
        example = "open"
    )
    private String status;

    @JsonProperty("sla_due_at")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "SLA resolution deadline in ISO-8601 format", example = "2026-10-08T18:00:00Z")
    private Instant slaDueAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Whether the complaint has breached its SLA deadline", example = "false")
    private Boolean breached;

    @JsonProperty("created_at")
    @Schema(description = "Complaint creation timestamp in ISO-8601 format", example = "2026-10-08T15:00:00Z")
    private Instant createdAt;
}
