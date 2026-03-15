# Scheduled Rides via Quartz Scheduler

To ensure scheduled rides are automatically and reliably dispatched without active client-side involvement or manual crons, we will leverage **Quartz Scheduler** backed by a JDBC JobStore. This ensures jobs persist across application restarts and trigger accurately.

## System Flow

1. **Ride Booking**: User calls `createScheduledRide` mapping a `scheduledDate` and `scheduledTime`.
2. **Job Provisioning**: The backend immediately calculates a `Date` representing `scheduledDateTime minus 15 minutes`. It dynamically programs a Quartz `JobDetail` and `Trigger` into the MySQL database.
3. **Trigger Execution**: 15 minutes prior to pickup, Quartz's background daemon fires the `ScheduledRideJob`.
4. **Driver Discovery**: The Job bean resolves the Spring Context, accesses the `DriverLocationService`, and queries Redis (`GEORADIUS`) around the pickup latitude/longitude.
5. **Dispatching**: The Job filters the Redis drivers, selects the closest available matched vehicles, and dispatches ping requests via WebSockets (`RideNotificationService`).
6. **Error Handling**: If no drivers are available, the Job can loop iteratively (e.g. sleep 30s) or utilize Quartz retries until it intercepts a driver or the Ride cancels.

## 1. Spring Boot & Quartz Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

Spring Boot auto-configures Quartz. By defining `spring.quartz.job-store-type=jdbc` in `application.properties`, Spring will automatically initialize the massive suite of Quartz metadata tables (`QRTZ_JOB_DETAILS`, `QRTZ_TRIGGERS`, etc.) natively relying on our predefined `DataSource`.

## 2. Configuration Setup

Add to `application.properties`:
```properties
spring.quartz.job-store-type=jdbc
spring.quartz.jdbc.initialize-schema=always
spring.quartz.properties.org.quartz.jobStore.isClustered=false
spring.quartz.properties.org.quartz.threadPool.threadCount=10
```

## 3. The Quartz Job Definition

```java
import org.quartz.*;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
@DisallowConcurrentExecution
public class ScheduledRideJob extends QuartzJobBean {

    @Autowired
    private RideService rideService;

    @Autowired
    private DriverLocationService driverLocationService;
    
    @Autowired
    private RideNotificationService rideNotificationService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        JobDataMap dataMap = context.getMergedJobDataMap();
        Long rideId = dataMap.getLong("rideId");

        try {
            Ride ride = rideService.getRideById(rideId);
            
            if (ride.getStatus() == Ride.RideStatus.CANCELLED) {
                return; // Early exiting
            }

            // 1. Query Redis for drivers globally
            List<NearbyDriverDto> nearbyDrivers = driverLocationService.getNearbyDrivers(
                ride.getPickupLatitude(), 
                ride.getPickupLongitude(), 
                5.0 // search 5km boundary
            );

            if (nearbyDrivers.isEmpty()) {
                // Retry Strategy Idea: Throw JobExecutionException setting refireToTrue, or trigger fallback alerts
                JobExecutionException e = new JobExecutionException("No drivers found");
                // e.setRefireImmediately(true); could be dangerous if looping, better to schedule a follow up ping.
                System.out.println("No drivers nearby for Scheduled Ride " + rideId);
                return;
            }

            // 2. Broadcast directly bypassing HTTP triggers
            // Send WebSocket request to all scoped drivers via Notification Service
            rideNotificationService.notifyDriversOfNewRide(rideId, nearbyDrivers);
            System.out.println("Dispatched Scheduled Ride " + rideId + " successfully to " + nearbyDrivers.size() + " drivers.");

        } catch (Exception e) {
            System.err.println("Scheduled Ride Job failed: " + e.getMessage());
            throw new JobExecutionException(e);
        }
    }
}
```

## 4. The Scheduler Service

```java
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
            // Trigger 15 minutes before the pickup local time
            LocalDateTime dispatchTime = pickupTime.minusMinutes(15);
            Date startAt = Date.from(dispatchTime.atZone(ZoneId.systemDefault()).toInstant());

            // Safeguard if 15 mins is already in the past, schedule it immediately 
            if (startAt.before(new Date())) {
                startAt = new Date(); 
            }

            JobDetail jobDetail = JobBuilder.newJob(ScheduledRideJob.class)
                    .withIdentity("ride-dispatch-" + rideId, "ready-rides")
                    .withDescription("Dispatches Ride " + rideId + " prior to scheduling")
                    .usingJobData("rideId", rideId)
                    .storeDurably()
                    .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("trigger-ride-" + rideId, "ready-rides")
                    .startAt(startAt)
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule().withMisfireHandlingInstructionFireNow())
                    .build();

            scheduler.scheduleJob(jobDetail, trigger);
            System.out.println("Ride " + rideId + " dispatch scheduled for " + startAt);

        } catch (SchedulerException e) {
            System.err.println("Failed to program Quartz sequence for Ride " + rideId);
        }
    }
}
```

## User Review Required

> [!NOTE]
> Please review this architecture. If you approve, I'll execute the configuration into the codebase. 
