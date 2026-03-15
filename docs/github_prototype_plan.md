# Prototype Mode Implementation Plan

This plan enables the "minimal setup" requirement by adding conditional flags for advanced services.

## Proposed Changes

### 1. Configuration (`application.properties`)
Add explicit feature toggles:
```properties
app.feature.redis.enabled=true
app.feature.kafka.enabled=true
app.feature.firebase.enabled=true
```

### 2. Feature Toggles in Code

#### Redis & Bucket4j
Mark `RateLimitInterceptor` and `RedisGeoService` with `@ConditionalOnProperty`. If disabled, these will either be skipped or replaced with in-memory mocks.

#### Kafka
Update `RideEventProducer` to check the `enabled` flag before attempting to send messages to avoid `TimeoutException` or `BrokerNotAvailable` errors during demo.

#### Firebase
Already has an `enabled` flag in `FcmNotificationService`, but I'll ensure it's strictly respected across all paths.

## Verification Plan

### Manual Verification
1. **Minimal Mode**: Set all flags to `false`. Start the application. Verify it boots successfully without Zookeeper, Kafka, or Redis running.
2. **REST functionality**: Verify `POST /api/rides` still works (persisting to MySQL) even if Kafka events are skipped.
3. **Selective Mode**: Enable only Redis. Verify Rate Limiting starts working while Kafka remains silent.
