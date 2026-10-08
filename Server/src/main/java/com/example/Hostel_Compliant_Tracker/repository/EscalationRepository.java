package com.example.Hostel_Compliant_Tracker.repository;

import com.example.Hostel_Compliant_Tracker.entity.Escalation;
import com.example.Hostel_Compliant_Tracker.enums.EscalationTriggerType;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationRepository extends JpaRepository<Escalation, Long> {

    List<Escalation> findByComplaintId(Long complaintId);

    List<Escalation> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);

    List<Escalation> findByComplaintIdOrderByIdDesc(Long complaintId);

    boolean existsByComplaintIdAndTriggerType(Long complaintId, EscalationTriggerType triggerType);

    boolean existsByComplaintIdAndToRole(Long complaintId, UserRole toRole);
}
