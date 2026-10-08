package com.example.Hostel_Compliant_Tracker.controller;

import com.example.Hostel_Compliant_Tracker.dto.client.*;
import com.example.Hostel_Compliant_Tracker.service.ClientApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Client Portal API", description = "Endpoints serving the ELEVIX frontend application")
public class ClientApiController {

    private final ClientApiService clientApiService;

    // --- Authentication ---

    @PostMapping("/auth/login")
    @Operation(summary = "Login user with email and password")
    public ResponseEntity<ClientLoginResponse> login(@RequestBody ClientLoginRequest request) {
        ClientLoginResponse response = clientApiService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ClientUserDto> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        ClientUserDto user = clientApiService.getCurrentUser(token);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/auth/logout")
    @Operation(summary = "Logout user session")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }

    // --- Complaints ---

    @GetMapping("/complaints")
    @Operation(summary = "List all complaints matching frontend model")
    public ResponseEntity<List<ClientComplaintDto>> getComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category
    ) {
        List<ClientComplaintDto> complaints = clientApiService.getAllComplaints(status, category);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/complaints/{id}")
    @Operation(summary = "Get complaint by ID or code")
    public ResponseEntity<ClientComplaintDto> getComplaintById(@PathVariable String id) {
        ClientComplaintDto complaint = clientApiService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }

    @PostMapping("/complaints")
    @Operation(summary = "Create complaint from resident modal")
    public ResponseEntity<ClientComplaintDto> createComplaint(
            @RequestBody ClientCreateComplaintRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientComplaintDto created = clientApiService.createComplaint(request, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/complaints/{id}/action")
    @Operation(summary = "Technician action: ACCEPT, START_WORK, MARK_RESOLUTION_PENDING")
    public ResponseEntity<ClientComplaintDto> handleAction(
            @PathVariable String id,
            @RequestBody ClientActionRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientComplaintDto updated = clientApiService.handleComplaintAction(id, request, token);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/complaints/{id}/confirm")
    @Operation(summary = "Resident confirms resolution & closes complaint")
    public ResponseEntity<ClientComplaintDto> confirmResolution(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientComplaintDto closed = clientApiService.confirmComplaintResolution(id, token);
        return ResponseEntity.ok(closed);
    }

    @PostMapping("/complaints/{id}/reopen")
    @Operation(summary = "Resident rejects resolution & reopens complaint")
    public ResponseEntity<ClientComplaintDto> reopenComplaint(
            @PathVariable String id,
            @RequestBody(required = false) ClientReopenRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientComplaintDto reopened = clientApiService.reopenComplaint(id, request, token);
        return ResponseEntity.ok(reopened);
    }

    @PostMapping("/complaints/{id}/assign")
    @Operation(summary = "Hostel Office assigns or reassigns staff technician")
    public ResponseEntity<ClientComplaintDto> assignStaff(
            @PathVariable String id,
            @RequestBody ClientAssignRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientComplaintDto assigned = clientApiService.assignComplaintStaff(id, request, token);
        return ResponseEntity.ok(assigned);
    }

    // --- Settings ---

    @GetMapping("/settings")
    @Operation(summary = "Get system settings (assignment automation, etc.)")
    public ResponseEntity<ClientSystemSettingsDto> getSettings() {
        ClientSystemSettingsDto settings = clientApiService.getSystemSettings();
        return ResponseEntity.ok(settings);
    }

    @PostMapping("/settings/automation")
    @Operation(summary = "Toggle assignment automation mode")
    public ResponseEntity<ClientSystemSettingsDto> toggleAutomation(
            @RequestBody ClientToggleAutomationRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        ClientSystemSettingsDto updated = clientApiService.toggleAutomation(request, token);
        return ResponseEntity.ok(updated);
    }

    // --- Notifications ---

    @GetMapping("/notifications")
    @Operation(summary = "Get user notifications")
    public ResponseEntity<List<ClientNotificationDto>> getNotifications(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        List<ClientNotificationDto> notifications = clientApiService.getNotifications(token);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/notifications/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<Void> markNotificationRead(@PathVariable String id) {
        clientApiService.markNotificationRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/read-all")
    @Operation(summary = "Mark all notifications read")
    public ResponseEntity<Void> markAllNotificationsRead(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        clientApiService.markAllNotificationsRead(token);
        return ResponseEntity.ok().build();
    }

    // --- Audit Logs & Staff ---

    @GetMapping("/audit-logs")
    @Operation(summary = "Get audit trail ledger")
    public ResponseEntity<List<ClientAuditLogDto>> getAuditLogs() {
        List<ClientAuditLogDto> logs = clientApiService.getAuditLogs();
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/staff")
    @Operation(summary = "Get staff technicians directory")
    public ResponseEntity<List<ClientStaffDto>> getStaffList() {
        List<ClientStaffDto> staff = clientApiService.getStaffList();
        return ResponseEntity.ok(staff);
    }
}
