package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.HistoryAction;

public interface ComplaintHistoryService {

    void recordHistory(Complaint complaint, User actor, HistoryAction action, String oldValue, String newValue, String reason);
}
