package com.example.Hostel_Compliant_Tracker.dto.client;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientUserDto {
    private String id;
    private String name;
    private String fullName;
    private String email;
    private String phone;
    private String phoneNumber;
    private String role;
    private Boolean active;
    private Boolean enabled;
    private String createdAt;
    private String updatedAt;
    private String roomNumber;
    private String block;
    private String studentId;
    private String avatarUrl;
    private String username;
}
