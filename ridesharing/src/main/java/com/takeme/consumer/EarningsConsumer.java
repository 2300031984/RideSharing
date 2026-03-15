package com.takeme.consumer;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import com.takeme.model.Driver;
import com.takeme.model.Rider;
import com.takeme.repository.DriverRepository;
import com.takeme.repository.RiderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class EarningsConsumer {

    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private RiderRepository riderRepository;

    @KafkaListener(topics = KafkaConfig.RIDE_COMPLETED_TOPIC, groupId = "earnings-group")
    public void consumeEarningsEvent(RideCompletedEvent event) {
        System.out.println("EarningsConsumer received event for Ride: " + event.getRideId());
        
        // 1. Update Rider Experience Stats
        Optional<Rider> riderOpt = riderRepository.findById(event.getRiderId());
        if (riderOpt.isPresent()) {
            Rider rider = riderOpt.get();
            rider.setTotalRides(rider.getTotalRides() + 1);
            riderRepository.save(rider);
        }
        
        // 2. Process Driver Gross Earnings Ledger
        if (event.getDriverId() != null) {
            Optional<Driver> driverOpt = driverRepository.findById(event.getDriverId());
            if (driverOpt.isPresent()) {
                Driver driver = driverOpt.get();
                driver.setTotalRides(driver.getTotalRides() + 1);
                
                // Add the fare collected for this trip to their gross totals
                driver.setTotalEarnings(driver.getTotalEarnings() + event.getAmount());
                
                // Make the driver available again to accept new pings
                driver.setStatus(Driver.DriverStatus.AVAILABLE);
                driverRepository.save(driver);
            }
        }
    }
}
