package com.example.Hostel_Compliant_Tracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientCreateComplaintRequest {
    private String category;
    private String title;
    private String description;
    private String roomNumber;
    private String block;
    private String evidenceUrl;
}
