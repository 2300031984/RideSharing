# Pre-Deployment Safeguards Implementation Plan

To ensure production readiness before Docker deployment, we need to address two critical safeguards that were flagged during the Architectural Review: **Payment Webhook Idempotency** and **FCM Token Cleanup**.

## 1. Payment Webhook Idempotency (Race Conditions)

### Problem
Stripe explicitly states that webhook events (e.g., `payment_intent.succeeded`) can be delivered **more than once** due to network retries. Currently, our `PaymentController.java` iterates through the `Transaction` mapping and updates the `Ride` status to `"PAID"`. While updating the string multiple times is harmless, if downstream Kafka consumers or Wallet ledgers bind to these status changes, double-firing will result in crediting the Driver's wallet twice.

### Proposed Solution
We will wrap the fulfillment logic inside `PaymentController.java` with an idempotency lock based on the current state.

```java
// Inside handleSuccessfulPayment(PaymentIntent intent)
Optional<Ride> rideOpt = rideRepository.findById(rideId);
if (rideOpt.isPresent()) {
    Ride r = rideOpt.get();
    
    // Idempotency Check: If already PAID, ignore the duplicate Stripe webhook!
    if ("PAID".equals(r.getPaymentStatus())) {
        System.out.println("[STRIPE] Duplicate webhook intercepted for Ride: " + rideId);
        return; 
    }
    
    r.setPaymentStatus("PAID");
    rideRepository.save(r);
}

// Transaction Check
if (t.getStatus() != Transaction.TransactionStatus.COMPLETED) {
    t.setStatus(Transaction.TransactionStatus.COMPLETED);
    transactionRepository.save(t);
}
```

## 2. FCM Dead Token Cleanup (Database Bloat)

### Problem
When a user uninstalls the mobile app, their `fcmToken` becomes permanently invalid. Google's FCM server will respond with an `UNREGISTERED` error code. Currently, `FcmNotificationService.java` just logs the error, leaving the dead token in the MySQL `Rider` or `Driver` table, causing the backend to waste HTTP calls on every subsequent ride.

### Proposed Solution
We will update `FcmNotificationService` to recognize the `UNREGISTERED` exception and actively purge the token from the Database.

1. **Update `DriverRepository` and `RiderRepository`**:
   Add `Optional<Driver> findByFcmToken(String fcmToken);` and `Optional<Rider> findByFcmToken(String fcmToken);`
2. **Inject Repositories into `FcmNotificationService`**.
3. **Catch and Prune**:
```java
} catch (FirebaseMessagingException e) {
    System.err.println("Error sending FCM message: " + e.getMessage());
    if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
        System.out.println("[FCM] Dead token detected. Pruning from DB...");
        riderRepository.findByFcmToken(targetToken).ifPresent(r -> {
            r.setFcmToken(null);
            riderRepository.save(r);
        });
        driverRepository.findByFcmToken(targetToken).ifPresent(d -> {
            d.setFcmToken(null);
            driverRepository.save(d);
        });
    }
}
```

## User Review Required

Please review these implementations. If these safeguards look mathematically sound and cover your pipeline flows, I will execute the changes!
