package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.entity.Assignment;
import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.AssignmentType;

public interface AssignmentService {

    Assignment assignComplaint(Complaint complaint, String reason);

    Assignment reassignComplaint(Complaint complaint, User newAssignee, User assignedBy, String reason);
}
