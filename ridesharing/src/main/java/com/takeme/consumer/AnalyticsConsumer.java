package com.takeme.consumer;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class AnalyticsConsumer {

    @KafkaListener(topics = KafkaConfig.RIDE_COMPLETED_TOPIC, groupId = "analytics-group")
    public void consumeAnalyticsEvent(RideCompletedEvent event) {
        // Here we simulate writing to a Data Warehouse like BigQuery or Elasticsearch via REST API/Kinesis.
        // It's completely isolated from MySQL transactions.
        System.out.println("[ANALYTICS-LOG] Storing ride metrics ->");
        System.out.println("    Ride ID: " + event.getRideId());
        System.out.println("    Gross Margin: ₹" + event.getAmount());
        System.out.println("    Distance Flow: " + event.getDistanceKm() + " km");
        System.out.println("    Payment Type: " + event.getPaymentMethod());
        System.out.println("    Fulfilled At: " + event.getTimestamp());
    }
}
