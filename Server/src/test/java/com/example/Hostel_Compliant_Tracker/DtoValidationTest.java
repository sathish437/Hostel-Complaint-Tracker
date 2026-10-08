package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintCreateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintStatusUpdateRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Valid ComplaintCreateRequest passes validation")
    void testValidComplaintCreateRequest() {
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .student("arun.student@elevix.edu")
                .hostel("Hostel 1")
                .room("101")
                .category("electrical")
                .text("Fan not spinning properly")
                .priority("normal")
                .build();

        Set<ConstraintViolation<ComplaintCreateRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Missing required fields in ComplaintCreateRequest fail validation")
    void testMissingRequiredFields() {
        // Missing student
        ComplaintCreateRequest req1 = ComplaintCreateRequest.builder()
                .hostel("Hostel 1")
                .room("101")
                .category("electrical")
                .text("Fan issue")
                .build();
        assertThat(validator.validate(req1)).anyMatch(v -> v.getPropertyPath().toString().equals("student"));

        // Missing hostel
        ComplaintCreateRequest req2 = ComplaintCreateRequest.builder()
                .student("arun")
                .room("101")
                .category("electrical")
                .text("Fan issue")
                .build();
        assertThat(validator.validate(req2)).anyMatch(v -> v.getPropertyPath().toString().equals("hostel"));

        // Missing room
        ComplaintCreateRequest req3 = ComplaintCreateRequest.builder()
                .student("arun")
                .hostel("H1")
                .category("electrical")
                .text("Fan issue")
                .build();
        assertThat(validator.validate(req3)).anyMatch(v -> v.getPropertyPath().toString().equals("room"));

        // Missing category
        ComplaintCreateRequest req4 = ComplaintCreateRequest.builder()
                .student("arun")
                .hostel("H1")
                .room("101")
                .text("Fan issue")
                .build();
        assertThat(validator.validate(req4)).anyMatch(v -> v.getPropertyPath().toString().equals("category"));

        // Missing text
        ComplaintCreateRequest req5 = ComplaintCreateRequest.builder()
                .student("arun")
                .hostel("H1")
                .room("101")
                .category("electrical")
                .build();
        assertThat(validator.validate(req5)).anyMatch(v -> v.getPropertyPath().toString().equals("text"));
    }

    @Test
    @DisplayName("Invalid category fails validation")
    void testInvalidCategory() {
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .student("arun")
                .hostel("H1")
                .room("101")
                .category("astrology")
                .text("Fan issue")
                .build();

        Set<ConstraintViolation<ComplaintCreateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("category"));
    }

    @Test
    @DisplayName("Invalid priority fails validation")
    void testInvalidPriority() {
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .student("arun")
                .hostel("H1")
                .room("101")
                .category("electrical")
                .priority("ultra-urgent")
                .text("Fan issue")
                .build();

        Set<ConstraintViolation<ComplaintCreateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("priority"));
    }

    @Test
    @DisplayName("Valid ComplaintStatusUpdateRequest passes validation")
    void testValidStatusUpdateRequest() {
        ComplaintStatusUpdateRequest request = ComplaintStatusUpdateRequest.builder()
                .status("in_progress")
                .note("Technician on site")
                .build();

        Set<ConstraintViolation<ComplaintStatusUpdateRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Invalid status fails validation")
    void testInvalidStatus() {
        ComplaintStatusUpdateRequest request = ComplaintStatusUpdateRequest.builder()
                .status("unknown_status")
                .build();

        Set<ConstraintViolation<ComplaintStatusUpdateRequest>> violations = validator.validate(request);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("status"));
    }
}
