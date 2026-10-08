package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.entity.Complaint;
import com.example.Hostel_Compliant_Tracker.entity.ComplaintHistory;
import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.HistoryAction;
import com.example.Hostel_Compliant_Tracker.repository.ComplaintHistoryRepository;
import com.example.Hostel_Compliant_Tracker.service.ComplaintHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ComplaintHistoryServiceImpl implements ComplaintHistoryService {

    private final ComplaintHistoryRepository complaintHistoryRepository;

    @Override
    @Transactional
    public void recordHistory(Complaint complaint, User actor, HistoryAction action, String oldValue, String newValue, String reason) {
        if (complaint == null) {
            return;
        }

        ComplaintHistory history = ComplaintHistory.builder()
                .complaint(complaint)
                .actor(actor)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .reason(reason)
                .createdAt(Instant.now())
                .build();

        complaintHistoryRepository.save(history);
    }
}
