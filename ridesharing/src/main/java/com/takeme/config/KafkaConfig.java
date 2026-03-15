package com.takeme.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@ConditionalOnProperty(name = "app.feature.kafka.enabled", havingValue = "true")
public class KafkaConfig {

    public static final String RIDE_COMPLETED_TOPIC = "ride.completed";
    public static final String RIDE_COMPLETED_DLQ_TOPIC = "ride.completed.DLQ";

    @Bean
    public NewTopic rideCompletedTopic() {
        return TopicBuilder.name(RIDE_COMPLETED_TOPIC)
                .partitions(3) // Horizontal scaling across 3 consumer instances
                .replicas(1) // Assuming single node local Kafka
                .build();
    }
    
    @Bean
    public NewTopic rideCompletedDlqTopic() {
        return TopicBuilder.name(RIDE_COMPLETED_DLQ_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        return new DefaultErrorHandler(
                new DeadLetterPublishingRecoverer(template),
                new FixedBackOff(5000L, 3) // 3 retries, 5s interval
        );
    }
}
