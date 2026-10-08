package com.example.Hostel_Compliant_Tracker.entity;

import com.example.Hostel_Compliant_Tracker.enums.EscalationTriggerType;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
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
    name = "escalations",
    indexes = {
        @Index(name = "idx_escalation_complaint_id", columnList = "complaint_id")
    }
)
public class Escalation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_role", length = 50)
    private UserRole fromRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_role", nullable = false, length = 50)
    private UserRole toRole;

    @Column(name = "reason")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 50)
    private EscalationTriggerType triggerType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Escalation that = (Escalation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Escalation{" +
                "id=" + id +
                ", fromRole=" + fromRole +
                ", toRole=" + toRole +
                ", reason='" + reason + '\'' +
                ", triggerType=" + triggerType +
                ", createdAt=" + createdAt +
                ", resolvedAt=" + resolvedAt +
                '}';
    }
}
