# Advanced Safeguards & Distributed Tracing Plan

This plan outlines the final hardening of the system before deployment, focusing on reliability, consistent states, and observability.

## 1. Kafka Dead Letter Queue (DLQ) & Retry Policy

We will move from basic consumption to a resilient model using `DefaultErrorHandler`.

- **Retry Strategy**: 3 attempts with a 5-second backoff.
- **Recovery**: Messages failing all 3 retries will be routed to a new `ride-events-dlq` topic.
- **Affected Files**: `KafkaConfig.java`, `NotificationConsumer.java`.

## 2. DB-Level Payment Idempotency

While we have application-level checks, we will add a hard database safety net.

- **Action**: Add a unique constraint to the `transaction_id` (Stripe intent ID) column in the `transactions` table.
- **Affected Files**: `Transaction.java` (JPA annotation update).

## 3. Distributed Tracing (Micrometer + Zipkin)

Implementing tracing allows us to see the "path of a request" across our distributed architecture (API -> Kafka -> Worker).

- **Dependencies**: `io.micrometer:micrometer-tracing-bridge-brave`, `io.zipkin.reporter2:zipkin-reporter-brave`.
- **Automatic Propagation**: Micrometer automatically bridges traces across WebClient, KafkaTemplate, and RestTemplate.
- **Quartz Tracing**: We will manually start/stop spans in `ScheduledRideJob` to ensure background tasks are visible in Zipkin.
- **Affected Files**: `pom.xml`, `application.properties`, `ScheduledRideJob.java`.

## 4. Refined FCM Token Cleanup

Ensuring `FcmNotificationService` handles broader error categories and prevents repeated failures.

- **FCM Errors**: Specifically catch `MessagingErrorCode.INVALID_ARGUMENT` and `MessagingErrorCode.UNREGISTERED`.

## Verification Plan

### Automated Tests
- **Kafka DLQ**: I will manually trigger a failure in a test consumer to verify that the message is retried 3 times and then published to `ride-events-dlq`. I will use `kafka-console-consumer` to verify the DLQ arrival.
- **Tracing**: I will check the application logs to verify that `traceId` and `spanId` are present and consistent across the API and Kafka consumer logs.

### Manual Verification
1. **Idempotency**: Attempt to send the same Stripe `payment_intent.succeeded` webhook payload twice using `curl` and verify that the database throws a duplicate key exception (or jpa handles it) and the wallet isn't credited twice.
2. **Zipkin UI**: Open `http://localhost:9411` (local Zipkin) and verify the trace follows the path: `PaymentController` -> `Kafka Producer` -> `NotificationConsumer`.
3. **FCM Cleanup**: Pass a known invalid token to the `sendPushNotification` method and verify the logs show the token being pruned from the `Rider`/`Driver` tables.

## User Review Required

> [!IMPORTANT]
> To view the traces, you will need a running Zipkin instance (e.g., `docker run -p 9411:9411 openzipkin/zipkin`).
> I will configure the default endpoint to `localhost:9411`.

Does this refined plan meet your technical requirements?
