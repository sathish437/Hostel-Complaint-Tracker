package com.example.Hostel_Compliant_Tracker.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Health check response")
public class HealthResponse {

    @Schema(description = "Health status string", example = "ok")
    private String status;
}
