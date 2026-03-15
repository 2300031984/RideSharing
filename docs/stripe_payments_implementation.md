# Secure Online Payments with Stripe

To upgrade from simple database payment status polling to robust, secure financial transactions, we will integrate Stripe's Payment Intents API. This guarantees PCI compliance because sensitive card data never touches your Spring Boot backend or MySQL database.

## System Flow

1. **Ride Complete:** When a driver completes a ride, the final fare is finalized in MySQL.
2. **Intent Creation:** Rider opens the payment screen. React calls `POST /api/payments/create-intent`. Spring Boot talks to Stripe and returns a `client_secret`.
3. **Card Collection:** React uses **Stripe Elements** to render a secure iframe. The user types their card.
4. **Confirmation:** React calls `stripe.confirmCardPayment(client_secret)`. This talks directly from the browser to Stripe.
5. **Webhook Fulfillment:** Stripe asynchronously POSTs the success event to `POST /api/payments/webhook`. Spring Boot validates the signature and marks the MySQL `Transaction` record as completed securely.

## 1. Spring Boot Setup Setup

Add the Stripe SDK to your `pom.xml`:
```xml
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>24.3.0</version>
</dependency>
```

Add your keys to `application.properties`:
```properties
stripe.api.secretKey=sk_test_your_secret_key_here
stripe.webhook.secret=whsec_your_webhook_secret_here
```

## 2. Setting API Keys Securely

```java
// src/main/java/com/takeme/config/StripeConfig.java
package com.takeme.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    @Value("${stripe.api.secretKey}")
    private String secretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }
}
```

## 3. Creating the Payment Intent Endpoint

```java
// src/main/java/com/takeme/controller/PaymentController.java
package com.takeme.controller;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.takeme.dto.PaymentIntentDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody PaymentIntentDto request) throws StripeException {
        // Look up the ride to verify the price
        // Ride ride = rideService.findById(request.getRideId());
        // long amount = Math.round(ride.getFare() * 100); // Stripe requires amounts in the smallest currency unit (cents/paise)
        
        long amountInCents = Math.round(request.getAmount() * 100);

        PaymentIntentCreateParams params =
          PaymentIntentCreateParams.builder()
            .setAmount(amountInCents)
            .setCurrency("inr") // INR for India
            .putMetadata("rideId", String.valueOf(request.getRideId())) // Very important for the webhook
            .build();

        // Idempotency Keys (Important!)
        // In a real application, wrap the execution via standard `RequestOptions` injecting an IdempotencyKey 
        // to prevent double-charges on network retries.
        
        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        
        return ResponseEntity.ok(response);
    }
}
```

```java
package com.takeme.dto;
import lombok.Data;

@Data
public class PaymentIntentDto {
    private Long rideId;
    private double amount;
}
```

## 4. The Webhook (Asynchronous Confirmation)

The Webhook is the **ONLY** source of truth for payment success. It's too easy for users to manipulate the browser or close their phone immediately after confirmation.

```java
    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event = null;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            // Invalid signature (prevents hackers from spoofing payments)
            return ResponseEntity.status(400).body("Invalid signature");
        }

        // Handle the event
        switch (event.getType()) {
            case "payment_intent.succeeded":
                PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
                String rideId = paymentIntent.getMetadata().get("rideId");
                
                // --- MySQL Database State Change --- //
                // transactionService.markAsPaid(rideId, paymentIntent.getId());
                // rideService.updateRidePaymentStatus(rideId, "PAID");
                
                System.out.println("Payment for ride " + rideId + " succeeded!");
                break;
            case "payment_intent.payment_failed":
                // Handle failure (notify user)
                break;
            default:
                // Unexpected event type
                break;
        }
        
        // Always return 200 OK back to Stripe so they stop retrying the webhook ping
        return ResponseEntity.ok("Success");
    }
```

## 5. React Frontend Integration

You need `@stripe/stripe-js` and `@stripe/react-stripe-js` via npm.

```javascript
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key'); // Setup early outside the component tree

const CheckoutForm = ({ rideId, fare }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // 1. Ask Spring Boot for an intent when the modal opens
    fetch('http://localhost:8081/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId, amount: fare })
    }).then(res => res.json())
      .then(data => setClientSecret(data.clientSecret));
  }, [rideId, fare]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);

    // 2. Browser confirms card specifically with Stripe's vault (Spring Boot never sees it)
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Jenny Rosen',
        },
      }
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        // Trigger generic UI success screen. The Webhook does the database work async in the background.
        console.log("Success! Wait for webhook confirmation.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>Pay</button>
      {error && <div>{error}</div>}
    </form>
  );
};

export const PaymentModal = (props) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm {...props} />
  </Elements>
);
```

## 6. Table updates for `Transaction`

To protect your system, ensure the standard ledger mapping handles idempotent deduplication.
Your `Transaction` schema should likely look like:
`id`, `ride_id` (FK), `gateway_id` (Stripe PaymentIntent ID), `amount`, `status` (`PENDING`, `SUCCESS`, `FAILED`), `created_at`

Stripe may fire webhooks multiple times. The backend `transactionService` implementation should ALWAYS check if a `Transaction` row already has `status == 'SUCCESS'` for that specific `gateway_id` before trying to assign credits or wallet balances to drivers, averting duplicate payouts.
