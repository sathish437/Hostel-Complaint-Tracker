package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.Notification;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.NotificationType;
import com.example.Hostel_Compliant_Tracker.repository.NotificationRepository;
import com.example.Hostel_Compliant_Tracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void sendNotification(User recipient, Complaint complaint, NotificationType type, String title, String message) {
        if (recipient == null) {
            return;
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .complaint(complaint)
                .type(type)
                .title(title)
                .message(message)
                .read(false)
                .createdAt(Instant.now())
                .build();

        notificationRepository.save(notification);
    }
}
