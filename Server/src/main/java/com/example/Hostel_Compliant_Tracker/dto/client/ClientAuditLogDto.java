package com.example.Hostel_Compliant_Tracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientAuditLogDto {
    private String id;
    private String actorName;
    private String actorRole;
    private String action;
    private String entity;
    private String entityId;
    private String oldValue;
    private String newValue;
    private String reason;
    private String timestamp;
}
