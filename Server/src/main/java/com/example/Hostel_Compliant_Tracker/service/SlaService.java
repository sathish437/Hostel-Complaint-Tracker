package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;

import java.time.Instant;
import java.util.List;

public interface SlaService {

    Instant calculateDeadline(Complaint complaint);

    boolean isBreached(Complaint complaint);

    List<Complaint> processSlaBreaches();
}
