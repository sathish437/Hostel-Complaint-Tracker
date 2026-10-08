package com.example.Hostel_Compliant_Tracker.repository;

import com.example.Hostel_Compliant_Tracker.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByComplaintId(Long complaintId);

    List<Attachment> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);
}
