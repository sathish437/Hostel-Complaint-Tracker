package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.dto.client.*;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class ClientApiIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        if (userRepository.findByEmail("rajesh@hostel.edu").isEmpty()) {
            userRepository.save(User.builder()
                    .name("Rajesh Kumar")
                    .username("rajesh_k")
                    .email("rajesh@hostel.edu")
                    .passwordHash("password123")
                    .role(UserRole.STUDENT)
                    .roomNumber("B-203")
                    .block("Block B")
                    .active(true)
                    .build());
        }
    }

    @Test
    @DisplayName("POST /api/auth/login succeeds and returns user matching client model")
    void testClientLogin() throws Exception {
        ClientLoginRequest loginReq = ClientLoginRequest.builder()
                .email("rajesh@hostel.edu")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("rajesh@hostel.edu"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.roomNumber").value("B-203"));
    }

    @Test
    @DisplayName("GET /api/auth/me returns current user")
    void testClientAuthMe() throws Exception {
        User user = userRepository.findByEmail("rajesh@hostel.edu").orElseThrow();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer hct-jwt-" + user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("rajesh@hostel.edu"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    @DisplayName("GET /api/complaints returns list with all frontend expected fields")
    void testGetComplaints() throws Exception {
        mockMvc.perform(get("/api/complaints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].code").exists())
                .andExpect(jsonPath("$[0].category").exists())
                .andExpect(jsonPath("$[0].priority").exists())
                .andExpect(jsonPath("$[0].status").exists())
                .andExpect(jsonPath("$[0].slaTotalMinutes").isNumber())
                .andExpect(jsonPath("$[0].slaRemainingMinutes").isNumber())
                .andExpect(jsonPath("$[0].slaState").isString());
    }

    @Test
    @DisplayName("POST /api/complaints creates ticket and supports full lifecycle")
    void testComplaintLifecycle() throws Exception {
        User user = userRepository.findByEmail("rajesh@hostel.edu").orElseThrow();

        ClientCreateComplaintRequest createReq = ClientCreateComplaintRequest.builder()
                .category("ELECTRICAL")
                .title("Switch board sparking")
                .description("Sparking and smoke from main switch")
                .roomNumber("B-203")
                .block("Block B")
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer hct-jwt-" + user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.category").value("ELECTRICAL"))
                .andReturn();

        ClientComplaintDto created = objectMapper.readValue(createResult.getResponse().getContentAsString(), ClientComplaintDto.class);

        // Action: start work
        ClientActionRequest actionReq = ClientActionRequest.builder()
                .action("START_WORK")
                .notes("Started troubleshooting wiring")
                .build();

        mockMvc.perform(post("/api/complaints/" + created.getId() + "/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actionReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Action: mark resolution pending
        ClientActionRequest pendingReq = ClientActionRequest.builder()
                .action("MARK_RESOLUTION_PENDING")
                .notes("Replaced switch socket")
                .build();

        mockMvc.perform(post("/api/complaints/" + created.getId() + "/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pendingReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLUTION_PENDING"));

        // Student confirms resolution
        mockMvc.perform(post("/api/complaints/" + created.getId() + "/confirm")
                        .header("Authorization", "Bearer hct-jwt-" + user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.slaState").value("MET"));
    }

    @Test
    @DisplayName("GET /api/settings and POST /api/settings/automation toggle automation")
    void testSettingsToggle() throws Exception {
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignmentAutomationEnabled").isBoolean());

        ClientToggleAutomationRequest toggleReq = ClientToggleAutomationRequest.builder()
                .enabled(false)
                .build();

        mockMvc.perform(post("/api/settings/automation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(toggleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignmentAutomationEnabled").value(false));
    }

    @Test
    @DisplayName("GET /api/audit-logs returns audit ledger")
    void testAuditLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/staff returns staff technician roster")
    void testStaffRoster() throws Exception {
        mockMvc.perform(get("/api/staff"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }
}
