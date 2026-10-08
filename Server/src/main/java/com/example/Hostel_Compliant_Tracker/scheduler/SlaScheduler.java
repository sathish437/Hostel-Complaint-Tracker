package com.example.Hostel_Compliant_Tracker.scheduler;

import com.example.Hostel_Compliant_Tracker.service.SlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@ConditionalOnProperty(name = "sla.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class SlaScheduler {

    private final SlaService slaService;

    @Scheduled(fixedDelayString = "${sla.scheduler.fixed-delay-ms:60000}", initialDelayString = "${sla.scheduler.initial-delay-ms:10000}")
    public void monitorSlaBreaches() {
        log.debug("Running SLA monitoring job");
        slaService.processSlaBreaches();
    }
}
