package com.example.Hostel_Compliant_Tracker.service.impl;

import com.example.Hostel_Compliant_Tracker.enums.ComplaintCategory;
import com.example.Hostel_Compliant_Tracker.service.ClassificationService;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class ClassificationServiceImpl implements ClassificationService {

    @Override
    public ComplaintCategory classify(String text, String providedCategory) {
        if (providedCategory != null && !providedCategory.trim().equalsIgnoreCase("other")) {
            return switch (providedCategory.trim().toLowerCase(Locale.ROOT)) {
                case "electrical" -> ComplaintCategory.ELECTRICAL;
                case "plumbing" -> ComplaintCategory.WATER_PLUMBING;
                case "cleaning" -> ComplaintCategory.CLEANING_HYGIENE;
                default -> ComplaintCategory.OTHER;
            };
        }

        if (text == null || text.trim().isEmpty()) {
            return ComplaintCategory.OTHER;
        }

        String lowerText = text.toLowerCase(Locale.ROOT);

        if (containsAny(lowerText, "fan", "light", "switch", "socket", "geyser", "short circuit", "power trip", "wiring", "electricity", "electrical")) {
            return ComplaintCategory.ELECTRICAL;
        }
        if (containsAny(lowerText, "water", "tap", "pipe", "leak", "toilet", "flush", "commode", "shower", "drain", "washbasin", "purifier", "plumbing")) {
            return ComplaintCategory.WATER_PLUMBING;
        }
        if (containsAny(lowerText, "clean", "garbage", "smell", "mosquito", "cockroach", "rats", "insects", "pests", "dustbin", "dirty", "hygiene")) {
            return ComplaintCategory.CLEANING_HYGIENE;
        }
        if (containsAny(lowerText, "bed", "chair", "table", "cupboard", "furniture", "door", "window", "mattress", "lock")) {
            return ComplaintCategory.ROOM_FURNITURE;
        }
        if (containsAny(lowerText, "wifi", "wi-fi", "internet", "signal", "router", "network")) {
            return ComplaintCategory.INTERNET_WIFI;
        }
        if (containsAny(lowerText, "food", "mess", "meal", "breakfast", "lunch", "dinner", "curry", "rice")) {
            return ComplaintCategory.FOOD_MESS;
        }
        if (containsAny(lowerText, "security", "watchman", "guard", "cctv", "theft", "stranger", "visitor", "fight")) {
            return ComplaintCategory.SECURITY;
        }

        return ComplaintCategory.OTHER;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
