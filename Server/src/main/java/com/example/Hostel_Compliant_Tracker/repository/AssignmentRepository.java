package com.example.Hostel_Compliant_Tracker.repository;

import com.example.Hostel_Compliant_Tracker.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByComplaintId(Long complaintId);

    List<Assignment> findByComplaintIdOrderByAssignedAtDesc(Long complaintId);

    List<Assignment> findByAssignedToId(Long assignedToId);
}
