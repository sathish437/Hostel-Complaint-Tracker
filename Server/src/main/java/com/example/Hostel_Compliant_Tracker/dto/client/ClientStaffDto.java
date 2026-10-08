package com.example.Hostel_Compliant_Tracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientStaffDto {
    private String id;
    private String name;
    private String role;
    private List<String> categoryHandled;
    private String phone;
    private Long activeJobsCount;
    private Boolean isAvailable;
}
