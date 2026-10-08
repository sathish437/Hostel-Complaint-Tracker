package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;

public interface ClassificationService {

    ComplaintCategory classify(String text, String providedCategory);
}
