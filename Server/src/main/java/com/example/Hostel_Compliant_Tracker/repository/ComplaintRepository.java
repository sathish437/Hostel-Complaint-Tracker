package com.example.Hostel_Compliant_Tracker.repository;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.ComplaintStatus;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByComplaintNumber(String complaintNumber);

    boolean existsByComplaintNumber(String complaintNumber);

    List<Complaint> findByStudentId(Long studentId);

    List<Complaint> findByAssigneeId(Long assigneeId);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByCategory(ComplaintCategory category);

    List<Complaint> findByPriority(Priority priority);

    List<Complaint> findByStatusAndAssigneeId(ComplaintStatus status, Long assigneeId);

    long countByAssigneeIdAndStatusIn(Long assigneeId, Collection<ComplaintStatus> statuses);

    List<Complaint> findByStatusIn(Collection<ComplaintStatus> statuses);

    List<Complaint> findByHostel(String hostel);

    List<Complaint> findByStatusInAndHostel(Collection<ComplaintStatus> statuses, String hostel);

    List<Complaint> findByStatusAndHostel(ComplaintStatus status, String hostel);

    List<Complaint> findBySlaDeadlineBeforeAndStatusNotIn(Instant deadline, Collection<ComplaintStatus> statuses);
}
