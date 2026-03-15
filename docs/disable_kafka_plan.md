# Disabling Kafka for Prototype Mode Plan

This plan ensures that the application can run in "Minimal Mode" (MySQL only) without triggering Kafka connection errors or bean initialization failures.

## Proposed Changes

### 1. Configuration (`KafkaConfig.java`)
- **Add `@ConditionalOnProperty`**: Annotate the entire `KafkaConfig` class so it only loads when `app.feature.kafka.enabled=true`. This prevents `NewTopic` beans from being seen by Spring's AdminClient.

### 2. Producers (`RideEventProducer.java`)
To avoid `UnsatisfiedDependencyException` for `KafkaTemplate` when Kafka is disabled:
- **Extract Interface**: Create `RideEventService`.
- **Kafka Implementation**: Move current logic to `KafkaRideEventProducer` and annotate with `@ConditionalOnProperty(..., havingValue="true")`.
- **Mock Implementation**: Create `MockRideEventProducer` and annotate with `@ConditionalOnProperty(..., havingValue="false", matchIfMissing=true)`.

### 3. Consumers (All in `com.takeme.consumer`)
- **Add `@ConditionalOnProperty`**: Annotate `AnalyticsConsumer`, `DlqConsumer`, `EarningsConsumer`, `NotificationConsumer`, and `PaymentConsumer` so they are not instantiated when Kafka is disabled.

### 4. Properties (`application.properties`)
- Ensure `spring.kafka.enabled=false` is set alongside `app.feature.kafka.enabled=false`.

## Verification Plan

### Manual Verification
1. **Application Startup**:
   - Set `app.feature.kafka.enabled=false` in `application.properties`.
   - Run `mvn spring-boot:run`.
   - **Expectation**: Logs should show "Tomcat started on port 8081" without any Kafka connection error traces.
2. **Functional Check**:
   - Complete a ride via the API.
   - **Expectation**: The `RideService` should call the `RideEventService` (mock implementation), log "[KAFKA MOCK] Skipping event publication", and return successfully.
3. **Kafka Mode**:
   - Set `app.feature.kafka.enabled=true` (requires local Kafka running).
   - Run the app.
   - **Expectation**: Kafka beans should load, and connection should be established.

Does this architectural refactor for prototype isolation look correct?
