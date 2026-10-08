package com.example.Hostel_Compliant_Tracker.dto.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientNotificationDto {
    private String id;
    private String recipientId;
    private String type;
    private String title;
    private String message;
    private String complaintId;

    @JsonProperty("isRead")
    private Boolean isRead;

    private String createdAt;
}
