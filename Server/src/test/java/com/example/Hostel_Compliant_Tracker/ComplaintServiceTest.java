package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintCreateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintStatusUpdateRequest;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import com.example.Hostel_Compliant_Tracker.exception.ComplaintNotFoundException;
import com.example.Hostel_Compliant_Tracker.exception.IllegalStatusTransitionException;
import com.example.Hostel_Compliant_Tracker.exception.StudentNotFoundException;
import com.example.Hostel_Compliant_Tracker.repository.UserRepository;
import com.example.Hostel_Compliant_Tracker.service.ComplaintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ComplaintServiceTest {

    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserRepository userRepository;

    private User student;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .name("Karthik")
                .email("karthik.student@elevix.edu")
                .passwordHash("hashed_pw")
                .role(UserRole.STUDENT)
                .active(true)
                .build();
        student = userRepository.save(student);
    }

    @Test
    @DisplayName("Successfully create complaint and verify response")
    void testCreateComplaintSuccess() {
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .student("karthik.student@elevix.edu")
                .hostel("Hostel 1")
                .room("205")
                .category("electrical")
                .text("Fan making loud clicking sound")
                .priority("normal")
                .build();

        ComplaintResponse response = complaintService.createComplaint(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getStudent()).isEqualTo("Karthik");
        assertThat(response.getHostel()).isEqualTo("Hostel 1");
        assertThat(response.getRoom()).isEqualTo("205");
        assertThat(response.getCategory()).isEqualTo("electrical");
        assertThat(response.getPriority()).isEqualTo("normal");
        assertThat(response.getStatus()).isEqualTo("open");
        assertThat(response.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Create complaint with non-existing student throws StudentNotFoundException")
    void testCreateComplaintStudentNotFound() {
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .student("nonexistent.student@elevix.edu")
                .hostel("Hostel 1")
                .room("205")
                .category("electrical")
                .text("Fan broken")
                .build();

        assertThatThrownBy(() -> complaintService.createComplaint(request))
                .isInstanceOf(StudentNotFoundException.class);
    }

    @Test
    @DisplayName("Retrieve complaints and filter by status and hostel")
    void testGetComplaintsAndFiltering() {
        ComplaintCreateRequest req1 = ComplaintCreateRequest.builder()
                .student("karthik.student@elevix.edu")
                .hostel("H1")
                .room("101")
                .category("cleaning")
                .text("Room cleaning needed")
                .build();
        ComplaintResponse c1 = complaintService.createComplaint(req1);

        ComplaintCreateRequest req2 = ComplaintCreateRequest.builder()
                .student("karthik.student@elevix.edu")
                .hostel("H2")
                .room("202")
                .category("plumbing")
                .text("Tap leaking in washroom")
                .build();
        ComplaintResponse c2 = complaintService.createComplaint(req2);

        List<ComplaintResponse> all = complaintService.getComplaints(null, null);
        assertThat(all).extracting(ComplaintResponse::getId).contains(c1.getId(), c2.getId());

        List<ComplaintResponse> h1Only = complaintService.getComplaints(null, "H1");
        assertThat(h1Only).extracting(ComplaintResponse::getId).contains(c1.getId()).doesNotContain(c2.getId());

        List<ComplaintResponse> openOnly = complaintService.getComplaints("open", null);
        assertThat(openOnly).extracting(ComplaintResponse::getId).contains(c1.getId(), c2.getId());
    }

    @Test
    @DisplayName("Update complaint status and enforce transition rules")
    void testUpdateComplaintStatus() {
        ComplaintCreateRequest createReq = ComplaintCreateRequest.builder()
                .student("karthik.student@elevix.edu")
                .hostel("H1")
                .room("101")
                .category("electrical")
                .text("Socket burning smell")
                .build();
        ComplaintResponse created = complaintService.createComplaint(createReq);

        // Update to in_progress
        ComplaintStatusUpdateRequest inProgressReq = ComplaintStatusUpdateRequest.builder()
                .status("in_progress")
                .note("Electrician assigned and working")
                .build();
        ComplaintResponse inProgress = complaintService.updateComplaintStatus(created.getId(), inProgressReq);
        assertThat(inProgress.getStatus()).isEqualTo("in_progress");

        // Update to closed
        ComplaintStatusUpdateRequest closedReq = ComplaintStatusUpdateRequest.builder()
                .status("closed")
                .note("Socket replaced and tested")
                .build();
        ComplaintResponse closed = complaintService.updateComplaintStatus(created.getId(), closedReq);
        assertThat(closed.getStatus()).isEqualTo("closed");

        // Attempt invalid transition directly from closed to in_progress without reopening
        ComplaintStatusUpdateRequest invalidReq = ComplaintStatusUpdateRequest.builder()
                .status("in_progress")
                .note("Trying to work on closed complaint")
                .build();
        assertThatThrownBy(() -> complaintService.updateComplaintStatus(created.getId(), invalidReq))
                .isInstanceOf(IllegalStatusTransitionException.class);
    }

    @Test
    @DisplayName("Get complaint by unknown ID throws ComplaintNotFoundException")
    void testGetUnknownComplaintThrows() {
        assertThatThrownBy(() -> complaintService.getComplaintById("999999"))
                .isInstanceOf(ComplaintNotFoundException.class);
    }
}
