package com.example.Hostel_Compliant_Tracker.controller;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintCreateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintStatusUpdateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ErrorResponse;
import com.example.Hostel_Compliant_Tracker.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints", description = "Hostel complaint lifecycle management APIs")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    @Operation(
        summary = "List or filter complaints",
        description = "Retrieve all complaints with optional filtering by status and hostel block.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Complaints retrieved successfully",
                content = @Content(
                    mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = ComplaintResponse.class))
                )
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid filter parameters",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            )
        }
    )
    public ResponseEntity<List<ComplaintResponse>> getComplaints(
            @Parameter(
                description = "Filter complaints by status",
                schema = @Schema(allowableValues = {"open", "in_progress", "escalated", "closed"})
            )
            @RequestParam(required = false) String status,

            @Parameter(description = "Filter complaints by hostel block", example = "Cauvery Hostel")
            @RequestParam(required = false) String hostel
    ) {
        List<ComplaintResponse> complaints = complaintService.getComplaints(status, hostel);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get complaint by ID",
        description = "Retrieve a single complaint by its unique identifier.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Complaint found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ComplaintResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid complaint ID format",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Complaint not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            )
        }
    )
    public ResponseEntity<ComplaintResponse> getComplaintById(
            @Parameter(description = "Complaint ID (string)", required = true, example = "1042")
            @PathVariable String id
    ) {
        ComplaintResponse complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }

    @PostMapping
    @Operation(
        summary = "Create a new complaint",
        description = "Submit a new student complaint for automatic categorization and routing.",
        responses = {
            @ApiResponse(
                responseCode = "201",
                description = "Complaint created successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ComplaintResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Validation failure or student not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            )
        }
    )
    public ResponseEntity<ComplaintResponse> createComplaint(
            @Valid @RequestBody ComplaintCreateRequest request
    ) {
        ComplaintResponse created = complaintService.createComplaint(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    @Operation(
        summary = "Update complaint status",
        description = "Update the complaint status lifecycle with state transition validation.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Complaint status updated successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ComplaintResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Validation failure, invalid ID, or illegal status transition",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Complaint not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            )
        }
    )
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @Parameter(description = "Complaint ID (string)", required = true, example = "1042")
            @PathVariable String id,

            @Valid @RequestBody ComplaintStatusUpdateRequest request
    ) {
        ComplaintResponse updated = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(updated);
    }
}
