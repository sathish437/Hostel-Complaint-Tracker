package com.example.Hostel_Compliant_Tracker.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientLoginRequest {
    private String email;
    private String password;
}
