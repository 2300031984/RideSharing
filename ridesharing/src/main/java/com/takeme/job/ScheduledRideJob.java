package com.takeme.job;

import com.takeme.dto.NearbyDriverDto;
import com.takeme.model.Ride;
import com.takeme.service.DriverLocationService;
import com.takeme.service.RideNotificationService;
import com.takeme.service.RideService;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@DisallowConcurrentExecution
public class ScheduledRideJob extends QuartzJobBean {

    @Autowired
    private RideService rideService;

    @Autowired
    private DriverLocationService driverLocationService;
    
    @Autowired
    private RideNotificationService rideNotificationService;

    @Autowired
    private Tracer tracer;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        JobDataMap dataMap = context.getMergedJobDataMap();
        Long rideId = dataMap.getLong("rideId");

        Span newSpan = tracer.nextSpan().name("scheduled-ride-dispatch");
        try (Tracer.SpanInScope ws = tracer.withSpan(newSpan.start())) {
            newSpan.tag("ride.id", String.valueOf(rideId));
            
            Ride ride = rideService.getRideById(rideId);
            
            // If the user cancelled it preemptively, abort the dispatch
            if (ride.getStatus() == Ride.RideStatus.CANCELLED) {
                System.out.println("Scheduled Ride " + rideId + " was cancelled. Aborting Quartz dispatch.");
                return;
            }

            // 1. Query Redis for drivers dynamically positioned within a 5KM ring
            List<NearbyDriverDto> nearbyDrivers = driverLocationService.getNearbyDrivers(
                ride.getPickupLatitude(), 
                ride.getPickupLongitude(), 
                5.0 
            );

            if (nearbyDrivers.isEmpty()) {
                System.out.println("No drivers nearby for Scheduled Ride " + rideId + ". You might want to retry this via DLQ or Job Execution constraints iteratively.");
                return;
            }

            // 2. Transmit STOMP payload bypassing standard REST
            rideNotificationService.notifyDriversOfNewRide(rideId, nearbyDrivers);
            System.out.println("Dispatched Scheduled Ride " + rideId + " mapping to " + nearbyDrivers.size() + " active Redis drivers.");

        } catch (Exception e) {
            newSpan.error(e);
            System.err.println("Scheduled Ride Quartz Job failed critically: " + e.getMessage());
            throw new JobExecutionException(e);
        } finally {
            newSpan.end();
        }
    }
}
