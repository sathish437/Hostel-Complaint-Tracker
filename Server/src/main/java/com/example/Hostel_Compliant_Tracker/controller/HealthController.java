package com.example.Hostel_Compliant_Tracker.controller;

import com.example.Hostel_Compliant_Tracker.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health", description = "Service health check endpoint")
public class HealthController {

    @GetMapping("/health")
    @Operation(
        summary = "Health check",
        description = "Lightweight health check endpoint returning service status",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Service is healthy",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = HealthResponse.class)
                )
            )
        }
    )
    public ResponseEntity<HealthResponse> getHealth() {
        return ResponseEntity.ok(new HealthResponse("ok"));
    }
}
