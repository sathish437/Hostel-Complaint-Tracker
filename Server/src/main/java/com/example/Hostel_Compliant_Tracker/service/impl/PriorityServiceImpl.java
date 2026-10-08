package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.enums.Priority;
import com.example.Hostel_Compliant_Tracker.service.PriorityService;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class PriorityServiceImpl implements PriorityService {

    @Override
    public Priority calculatePriority(String text, ComplaintCategory category, String providedPriority) {
        if (providedPriority != null && !providedPriority.trim().isEmpty()) {
            return switch (providedPriority.trim().toLowerCase(Locale.ROOT)) {
                case "low" -> Priority.LOW;
                case "normal" -> Priority.MEDIUM;
                case "high" -> Priority.HIGH;
                default -> Priority.MEDIUM;
            };
        }

        if (text != null) {
            String lower = text.toLowerCase(Locale.ROOT);
            if (lower.contains("spark") || lower.contains("burning") || lower.contains("fire") ||
                lower.contains("shock") || lower.contains("emergency") || lower.contains("blast") ||
                lower.contains("smoke")) {
                return Priority.CRITICAL;
            }
            if (lower.contains("no water") || lower.contains("power cut") || lower.contains("overflow") ||
                lower.contains("broken lock")) {
                return Priority.HIGH;
            }
        }

        return Priority.MEDIUM;
    }
}
