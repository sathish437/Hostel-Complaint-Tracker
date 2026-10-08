package com.example.Hostel_Compliant_Tracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientActionRequest {
    private String action; // ACCEPT, START_WORK, MARK_RESOLUTION_PENDING
    private String notes;
    private String proofUrl;
}
