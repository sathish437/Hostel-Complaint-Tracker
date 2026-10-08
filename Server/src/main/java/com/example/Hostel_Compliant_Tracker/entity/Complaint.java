package com.example.Hostel_Compliant_Tracker.entity;

import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "complaints",
    indexes = {
        @Index(name = "idx_complaint_number", columnList = "complaint_number", unique = true),
        @Index(name = "idx_complaint_student_id", columnList = "student_id"),
        @Index(name = "idx_complaint_assignee_id", columnList = "assignee_id"),
        @Index(name = "idx_complaint_category", columnList = "category"),
        @Index(name = "idx_complaint_priority", columnList = "priority"),
        @Index(name = "idx_complaint_status", columnList = "status"),
        @Index(name = "idx_complaint_sla_deadline", columnList = "sla_deadline"),
        @Index(name = "idx_complaint_created_at", columnList = "created_at"),
        @Index(name = "idx_complaint_hostel", columnList = "hostel")
    }
)
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_number", nullable = false, unique = true, length = 50)
    private String complaintNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ComplaintCategory category;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "hostel")
    private String hostel;

    @Column(name = "room")
    private String room;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ComplaintStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "title")
    private String title;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;

    @Column(name = "completion_proof_url", length = 1000)
    private String completionProofUrl;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @Column(name = "reopen_reason", columnDefinition = "TEXT")
    private String reopenReason;

    @Builder.Default
    @Column(name = "is_escalated", nullable = false)
    private Boolean isEscalated = false;

    @Column(name = "escalation_level")
    private String escalationLevel;

    @Column(name = "escalation_reason", columnDefinition = "TEXT")
    private String escalationReason;

    @Column(name = "escalated_at")
    private Instant escalatedAt;

    @Builder.Default
    @Column(name = "is_repeated_issue")
    private Boolean isRepeatedIssue = false;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Complaint complaint = (Complaint) o;
        return Objects.equals(id, complaint.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Complaint{" +
                "id=" + id +
                ", complaintNumber='" + complaintNumber + '\'' +
                ", category=" + category +
                ", location='" + location + '\'' +
                ", priority=" + priority +
                ", status=" + status +
                ", slaDeadline=" + slaDeadline +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", resolvedAt=" + resolvedAt +
                ", closedAt=" + closedAt +
                '}';
    }
}
