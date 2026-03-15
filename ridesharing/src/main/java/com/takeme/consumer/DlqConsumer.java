package com.takeme.consumer;

import com.takeme.config.KafkaConfig;
import com.takeme.event.RideCompletedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class DlqConsumer {

    /**
     * Monitors the Dead Letter Queue for failed ride events.
     * In a production environment, this would trigger an alert (PagerDuty/Slack) 
     * or be ingested into an ELK stack for manual intervention.
     */
    @KafkaListener(topics = KafkaConfig.RIDE_COMPLETED_DLQ_TOPIC, groupId = "dlq-monitor-group")
    public void consumeDlq(RideCompletedEvent event, 
                          @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                          @Header(KafkaHeaders.OFFSET) long offset) {
                          
        System.err.println("CRITICAL: Message received in DLQ!");
        System.err.println("Topic: " + topic);
        System.err.println("Offset: " + offset);
        System.err.println("Failed Event Data: " + event.getRideId() + " (Method: " + event.getPaymentMethod() + ")");
        
        // Potential logic: Store in a separate 'failed_events' table for admin UI review
        // notifyDevOps(event);
    }
}
