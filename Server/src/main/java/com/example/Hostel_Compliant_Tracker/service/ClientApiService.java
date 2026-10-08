package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.dto.client.*;

import java.util.List;

public interface ClientApiService {
    ClientLoginResponse login(ClientLoginRequest request);
    ClientUserDto getCurrentUser(String token);

    List<ClientComplaintDto> getAllComplaints(String status, String category);
    ClientComplaintDto getComplaintById(String id);
    ClientComplaintDto createComplaint(ClientCreateComplaintRequest request, String token);
    ClientComplaintDto handleComplaintAction(String id, ClientActionRequest request, String token);
    ClientComplaintDto confirmComplaintResolution(String id, String token);
    ClientComplaintDto reopenComplaint(String id, ClientReopenRequest request, String token);
    ClientComplaintDto assignComplaintStaff(String id, ClientAssignRequest request, String token);

    ClientSystemSettingsDto getSystemSettings();
    ClientSystemSettingsDto toggleAutomation(ClientToggleAutomationRequest request, String token);

    List<ClientNotificationDto> getNotifications(String token);
    void markNotificationRead(String id);
    void markAllNotificationsRead(String token);

    List<ClientAuditLogDto> getAuditLogs();
    List<ClientStaffDto> getStaffList();
}
