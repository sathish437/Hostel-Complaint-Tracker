package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.Escalation;
import com.example.Hostel_Compliant_Tracker.enums.EscalationTriggerType;

public interface EscalationService {

    Escalation escalate(Complaint complaint, String reason, EscalationTriggerType triggerType);

    Escalation escalateCritical(Complaint complaint, String reason);

    boolean canEscalate(Complaint complaint);
}
