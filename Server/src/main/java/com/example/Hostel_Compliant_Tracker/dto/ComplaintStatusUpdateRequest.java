package com.example.Hostel_Compliant_Tracker.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for updating complaint status")
public class ComplaintStatusUpdateRequest {

    @NotBlank(message = "status is required")
    @Pattern(
        regexp = "(?i)^(open|in_progress|escalated|closed)$",
        message = "status must be one of: open, in_progress, escalated, closed"
    )
    @Schema(
        description = "Target status",
        allowableValues = {"open", "in_progress", "escalated", "closed"},
        example = "in_progress",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String status;

    @Schema(
        description = "Optional note or reason explaining the status update",
        example = "Electrician started repair work",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String note;
}
