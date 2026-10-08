package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import com.example.Hostel_Compliant_Tracker.exception.InvalidComplaintIdException;
import com.example.Hostel_Compliant_Tracker.exception.InvalidEnumValueException;
import com.example.Hostel_Compliant_Tracker.mapper.ComplaintMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ComplaintMapperTest {

    private ComplaintMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ComplaintMapper();
    }

    @Test
    @DisplayName("Test category mapping bi-directionally")
    void testCategoryMapping() {
        assertThat(mapper.toApiCategory(ComplaintCategory.ELECTRICAL)).isEqualTo("electrical");
        assertThat(mapper.toApiCategory(ComplaintCategory.WATER_PLUMBING)).isEqualTo("plumbing");
        assertThat(mapper.toApiCategory(ComplaintCategory.CLEANING_HYGIENE)).isEqualTo("cleaning");
        assertThat(mapper.toApiCategory(ComplaintCategory.ROOM_FURNITURE)).isEqualTo("other");
        assertThat(mapper.toApiCategory(ComplaintCategory.OTHER)).isEqualTo("other");

        assertThat(mapper.toInternalCategory("electrical")).isEqualTo(ComplaintCategory.ELECTRICAL);
        assertThat(mapper.toInternalCategory("plumbing")).isEqualTo(ComplaintCategory.WATER_PLUMBING);
        assertThat(mapper.toInternalCategory("cleaning")).isEqualTo(ComplaintCategory.CLEANING_HYGIENE);
        assertThat(mapper.toInternalCategory("other")).isEqualTo(ComplaintCategory.OTHER);

        assertThatThrownBy(() -> mapper.toInternalCategory("invalid_category"))
                .isInstanceOf(InvalidEnumValueException.class);
    }

    @Test
    @DisplayName("Test priority mapping ensuring CRITICAL maps to high")
    void testPriorityMapping() {
        assertThat(mapper.toApiPriority(Priority.LOW)).isEqualTo("low");
        assertThat(mapper.toApiPriority(Priority.MEDIUM)).isEqualTo("normal");
        assertThat(mapper.toApiPriority(Priority.HIGH)).isEqualTo("high");
        assertThat(mapper.toApiPriority(Priority.CRITICAL)).isEqualTo("high");

        assertThat(mapper.toInternalPriority("low")).isEqualTo(Priority.LOW);
        assertThat(mapper.toInternalPriority("normal")).isEqualTo(Priority.MEDIUM);
        assertThat(mapper.toInternalPriority("high")).isEqualTo(Priority.HIGH);
        assertThat(mapper.toInternalPriority(null)).isNull();

        assertThatThrownBy(() -> mapper.toInternalPriority("extreme"))
                .isInstanceOf(InvalidEnumValueException.class);
    }

    @Test
    @DisplayName("Test status mapping and query filter conversion")
    void testStatusMapping() {
        assertThat(mapper.toApiStatus(ComplaintStatus.SUBMITTED)).isEqualTo("open");
        assertThat(mapper.toApiStatus(ComplaintStatus.ASSIGNED)).isEqualTo("open");
        assertThat(mapper.toApiStatus(ComplaintStatus.REOPENED)).isEqualTo("open");
        assertThat(mapper.toApiStatus(ComplaintStatus.IN_PROGRESS)).isEqualTo("in_progress");
        assertThat(mapper.toApiStatus(ComplaintStatus.ESCALATED)).isEqualTo("escalated");
        assertThat(mapper.toApiStatus(ComplaintStatus.SLA_BREACHED)).isEqualTo("escalated");
        assertThat(mapper.toApiStatus(ComplaintStatus.CLOSED)).isEqualTo("closed");
        assertThat(mapper.toApiStatus(ComplaintStatus.STUDENT_CONFIRMED)).isEqualTo("closed");

        List<ComplaintStatus> openStatuses = mapper.toInternalStatusesForFilter("open");
        assertThat(openStatuses).contains(ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED, ComplaintStatus.REOPENED);

        List<ComplaintStatus> inProgressStatuses = mapper.toInternalStatusesForFilter("in_progress");
        assertThat(inProgressStatuses).contains(ComplaintStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("Test ID parsing from String to Long")
    void testIdParsing() {
        assertThat(mapper.parseComplaintId("123")).isEqualTo(123L);
        assertThat(mapper.parseComplaintId(" 45 ")).isEqualTo(45L);

        assertThatThrownBy(() -> mapper.parseComplaintId("abc"))
                .isInstanceOf(InvalidComplaintIdException.class);
        assertThatThrownBy(() -> mapper.parseComplaintId("-10"))
                .isInstanceOf(InvalidComplaintIdException.class);
        assertThatThrownBy(() -> mapper.parseComplaintId(""))
                .isInstanceOf(InvalidComplaintIdException.class);
    }

    @Test
    @DisplayName("Test entity to response DTO mapping")
    void testEntityToResponse() {
        User student = User.builder()
                .id(1L)
                .name("Kavitha")
                .email("kavitha@elevix.edu")
                .role(UserRole.STUDENT)
                .build();

        Instant now = Instant.now();
        Complaint complaint = Complaint.builder()
                .id(101L)
                .complaintNumber("CMP-1042")
                .student(student)
                .category(ComplaintCategory.ELECTRICAL)
                .description("Light flickering")
                .hostel("Block A")
                .room("304")
                .location("Block A - Room 304")
                .priority(Priority.HIGH)
                .status(ComplaintStatus.IN_PROGRESS)
                .slaDeadline(now.plusSeconds(3600))
                .createdAt(now)
                .build();

        ComplaintResponse response = mapper.toResponse(complaint);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("101");
        assertThat(response.getStudent()).isEqualTo("Kavitha");
        assertThat(response.getHostel()).isEqualTo("Block A");
        assertThat(response.getRoom()).isEqualTo("304");
        assertThat(response.getCategory()).isEqualTo("electrical");
        assertThat(response.getText()).isEqualTo("Light flickering");
        assertThat(response.getPriority()).isEqualTo("high");
        assertThat(response.getStatus()).isEqualTo("in_progress");
        assertThat(response.getBreached()).isFalse();
        assertThat(response.getCreatedAt()).isEqualTo(now);
    }
}
