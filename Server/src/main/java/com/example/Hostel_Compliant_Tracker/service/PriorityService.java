package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.Priority;

public interface PriorityService {

    Priority calculatePriority(String text, ComplaintCategory category, String providedPriority);
}
