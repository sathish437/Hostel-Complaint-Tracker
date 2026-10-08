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
@Schema(description = "Request payload for raising a new complaint")
public class ComplaintCreateRequest {

    @NotBlank(message = "student is required")
    @Schema(
        description = "Student identifier, email, or name",
        example = "arun.student@elevix.edu",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String student;

    @NotBlank(message = "hostel is required")
    @Schema(
        description = "Hostel name or block",
        example = "Cauvery Hostel",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String hostel;

    @NotBlank(message = "room is required")
    @Schema(
        description = "Room number",
        example = "302",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String room;

    @NotBlank(message = "category is required")
    @Pattern(
        regexp = "(?i)^(electrical|plumbing|cleaning|other)$",
        message = "category must be one of: electrical, plumbing, cleaning, other"
    )
    @Schema(
        description = "Complaint category",
        allowableValues = {"electrical", "plumbing", "cleaning", "other"},
        example = "electrical",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String category;

    @NotBlank(message = "text is required")
    @Schema(
        description = "Detailed text description of the complaint",
        example = "Switch board sparking and burning smell",
        requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String text;

    @Pattern(
        regexp = "(?i)^(low|normal|high)$",
        message = "priority must be one of: low, normal, high"
    )
    @Schema(
        description = "Optional priority level",
        allowableValues = {"low", "normal", "high"},
        example = "normal",
        requiredMode = Schema.RequiredMode.NOT_REQUIRED
    )
    private String priority;
}
