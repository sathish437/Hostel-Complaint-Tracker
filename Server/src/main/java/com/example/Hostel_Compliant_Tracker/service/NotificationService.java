package com.example.Hostel_Compliant_Tracker.service;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.NotificationType;

public interface NotificationService {

    void sendNotification(User recipient, Complaint complaint, NotificationType type, String title, String message);
}
