# Event-Driven Architecture with Apache Kafka

To optimize our Ride-Sharing application for high throughput, we are decoupling the post-ride synchronous operations (payments, notifications, earnings, analytics) into isolated, asynchronous Kafka consumers.

## Architecture Overview

1. **Producer (`RideController` / `RideService`)**: When a ride finishes, the main thread simply updates the MySQL `Ride` status to `COMPLETED` and fires a `RideCompletedEvent` to the `ride.completed` Kafka topic. It immediately returns `200 OK` to the user.
2. **Message Broker (Apache Kafka)**: Persistently stores the event logs.
3. **Consumers**: 
    - `PaymentConsumer`: Triggers automatic wallet deductions or Stripe intent verifications.
    - `NotificationConsumer`: Sends push notifications to the rider and driver.
    - `AnalyticsConsumer`: Logs ride metadata to a data warehouse table or ELK stack.
    - `EarningsConsumer`: Updates the driver's wallet balance.

## Implementation Steps

### 1. Dependencies and Configuration
The project requires `spring-kafka` in `pom.xml`. The `application.properties` must declare broker URLs and serialization formats (JSON).

### 2. Event Payload Model
The payload (`RideCompletedEvent.java`) must contain all necessary data so consumers do not need to query the database redundantly:
```json
{
  "eventId": "uuid-1234",
  "rideId": 9876,
  "riderId": 101,
  "driverId": 202,
  "amount": 25.50,
  "distanceKm": 12.4,
  "timestamp": "2026-03-15T10:00:00"
}
```

### 3. Topic Provisioning
Spring Boot's `NewTopic` bean can auto-provision the `ride.completed` topic with multiple partitions (e.g., 3) to allow horizontal scaling of consumers.

### 4. Consumer Resiliency & Best Practices
- **Idempotency**: Consumers must track `eventId` to ensure they don't process the same message twice if Kafka redelivers it (At-Least-Once delivery semantics).
- **Error Handling (DLQ)**: If a consumer fails to process a message (e.g., Stripe API is down), we use a `SeekToCurrentErrorHandler` or route the message to a Dead Letter Queue (DLQ) topic (`ride.completed.DLQ`) for manual inspection or delayed retries.
- **Consumer Groups**: All micro-services (Payment, Notification, etc.) have *different* consumer group IDs so they get a distinct copy of every message. Instances of the *same* microservice share a group ID to distribute the load.

## User Review Required

> [!IMPORTANT]
> Is your local Kafka environment running via Docker (`localhost:9092`), or do you need a `docker-compose.yml` to spin it up alongside Zookeeper/Kraft? This plan assumes Kafka is accessible at `localhost:9092`.

Please review the proposed architecture. If approved, I will implement the code structures recursively.
