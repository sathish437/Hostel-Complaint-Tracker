package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
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
class ComplaintControllerContractTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        if (userRepository.findByEmail("deepak.student@elevix.edu").isEmpty()) {
            User student = User.builder()
                    .name("Deepak")
                    .email("deepak.student@elevix.edu")
                    .passwordHash("hashed_pwd")
                    .role(UserRole.STUDENT)
                    .active(true)
                    .build();
            userRepository.save(student);
        }
    }

    @Test
    @DisplayName("GET /health returns HTTP 200 and { \"status\": \"ok\" }")
    void testGetHealth() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @DisplayName("POST /complaints creates complaint and returns HTTP 201 with contract fields")
    void testCreateComplaintSuccess() throws Exception {
        String jsonPayload = """
                {
                  "student": "deepak.student@elevix.edu",
                  "hostel": "Cauvery Hostel",
                  "room": "302",
                  "category": "electrical",
                  "text": "Switch board sparking",
                  "priority": "high"
                }
                """;

        mockMvc.perform(post("/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.student").value("Deepak"))
                .andExpect(jsonPath("$.hostel").value("Cauvery Hostel"))
                .andExpect(jsonPath("$.room").value("302"))
                .andExpect(jsonPath("$.category").value("electrical"))
                .andExpect(jsonPath("$.text").value("Switch board sparking"))
                .andExpect(jsonPath("$.priority").value("high"))
                .andExpect(jsonPath("$.status").value("open"))
                .andExpect(jsonPath("$.created_at").isNotEmpty());
    }

    @Test
    @DisplayName("POST /complaints with missing fields returns HTTP 400 and error code")
    void testCreateComplaintValidationFailure() throws Exception {
        String badPayload = """
                {
                  "hostel": "H1",
                  "room": "101"
                }
                """;

        mockMvc.perform(post("/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("POST /complaints with invalid category returns HTTP 400 and error code")
    void testCreateComplaintInvalidCategory() throws Exception {
        String badCategory = """
                {
                  "student": "deepak.student@elevix.edu",
                  "hostel": "H1",
                  "room": "101",
                  "category": "meteorology",
                  "text": "Too hot"
                }
                """;

        mockMvc.perform(post("/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badCategory))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("GET /complaints and query filters work according to contract")
    void testGetComplaintsWithFilters() throws Exception {
        String payload = """
                {
                  "student": "deepak.student@elevix.edu",
                  "hostel": "Hostel A",
                  "room": "101",
                  "category": "cleaning",
                  "text": "Dustbin full"
                }
                """;

        mockMvc.perform(post("/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/complaints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].id").isString())
                .andExpect(jsonPath("$[0].category").isNotEmpty());

        mockMvc.perform(get("/complaints").param("status", "open"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/complaints").param("hostel", "Hostel A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].hostel").value("Hostel A"));
    }

    @Test
    @DisplayName("PATCH /complaints/{id}/status updates status and returns HTTP 200")
    void testUpdateComplaintStatus() throws Exception {
        String createPayload = """
                {
                  "student": "deepak.student@elevix.edu",
                  "hostel": "Hostel B",
                  "room": "205",
                  "category": "plumbing",
                  "text": "Washbasin pipe leaking"
                }
                """;

        MvcResult result = mockMvc.perform(post("/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        // Extract id using simple regex or substring
        int idIdx = responseBody.indexOf("\"id\":\"");
        String id;
        if (idIdx != -1) {
            int start = idIdx + 6;
            int end = responseBody.indexOf("\"", start);
            id = responseBody.substring(start, end);
        } else {
            id = "1";
        }

        String statusUpdate = """
                {
                  "status": "in_progress",
                  "note": "Plumber reached room"
                }
                """;

        mockMvc.perform(patch("/complaints/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusUpdate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.status").value("in_progress"));
    }

    @Test
    @DisplayName("GET /complaints/{id} with non-existent ID returns HTTP 404 and COMPLAINT_NOT_FOUND")
    void testGetNonExistentComplaint() throws Exception {
        mockMvc.perform(get("/complaints/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("COMPLAINT_NOT_FOUND"));
    }

    @Test
    @DisplayName("PATCH /complaints/{id}/status with non-numeric ID returns HTTP 400 and INVALID_COMPLAINT_ID")
    void testPatchInvalidId() throws Exception {
        String statusUpdate = """
                {
                  "status": "closed",
                  "note": "Done"
                }
                """;

        mockMvc.perform(patch("/complaints/invalid-id/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusUpdate))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_COMPLAINT_ID"));
    }
}
