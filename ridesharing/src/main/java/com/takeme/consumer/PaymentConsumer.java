package com.takeme.consumer;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import com.takeme.model.Ride;
import com.takeme.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class PaymentConsumer {

    @Autowired
    private RideRepository rideRepository;

    @KafkaListener(topics = KafkaConfig.RIDE_COMPLETED_TOPIC, groupId = "payment-group")
    public void consumePaymentEvent(RideCompletedEvent event) {
        System.out.println("PaymentConsumer received event for Ride: " + event.getRideId());
        
        Optional<Ride> rideOpt = rideRepository.findById(event.getRideId());
        
        if (rideOpt.isPresent()) {
            Ride ride = rideOpt.get();
            // Automatically capture authorized Intents or mark Cash as complete.
            // If the user selected CASH, we immediately clear it.
            if ("CASH".equalsIgnoreCase(event.getPaymentMethod())) {
                ride.setPaymentStatus("PAID");
                rideRepository.save(ride);
            } else {
                // E.g. Stripe Intents. If they used a saved card, we would HTTP POST to Stripe here to `capture()`
                // the funds using the vaulted customer token. 
                // Since our flow uses client-side Confirmation, this acts as a verification ping check.
                System.out.println("[PAYMENT-SERVICE] Validating Stripe intent capture state for ride.");
            }
        }
    }
}
