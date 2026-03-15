package com.takeme.service;

import com.takeme.job.ScheduledRideJob;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class JobSchedulerService {

    @Autowired
    private Scheduler scheduler;

    public void scheduleRideDispatchJob(Long rideId, LocalDateTime pickupTime) {
        try {
            // Trigger exactly 15 minutes prior to the designated pickup interval
            LocalDateTime dispatchTime = pickupTime.minusMinutes(15);
            Date startAt = Date.from(dispatchTime.atZone(ZoneId.systemDefault()).toInstant());

            // Safeguard bounds: If 15 minutes prior is somehow in the past, dispatch the query instantaneously
            if (startAt.before(new Date())) {
                startAt = new Date(); 
            }

            JobDetail jobDetail = JobBuilder.newJob(ScheduledRideJob.class)
                    .withIdentity("ride-dispatch-" + rideId, "ready-rides")
                    .withDescription("Dispatches Scheduled Ride " + rideId + " based on Redis coordinates.")
                    .usingJobData("rideId", rideId)
                    .storeDurably()
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("trigger-ride-" + rideId, "ready-rides")
                    .startAt(startAt)
                    // Configured to retry aggressively if the Daemon slept through the intended stamp
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule().withMisfireHandlingInstructionFireNow())
                    .build();

            scheduler.scheduleJob(jobDetail, trigger);
            System.out.println("Scheduler: Ride " + rideId + " scheduled to fire via Redis Geospatial scan at " + startAt);

        } catch (SchedulerException e) {
            System.err.println("CRITICAL: Failed to program Quartz sequence for Ride " + rideId + " - " + e.getMessage());
        }
    }
}
