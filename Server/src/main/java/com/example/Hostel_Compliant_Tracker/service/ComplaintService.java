package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.dto.ComplaintCreateRequest;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintResponse;
import com.example.Hostel_Compliant_Tracker.dto.ComplaintStatusUpdateRequest;

import java.util.List;

public interface ComplaintService {

    ComplaintResponse createComplaint(ComplaintCreateRequest request);

    List<ComplaintResponse> getComplaints(String status, String hostel);

    ComplaintResponse getComplaintById(String id);

    ComplaintResponse updateComplaintStatus(String id, ComplaintStatusUpdateRequest request);
}
