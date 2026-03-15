package com.takeme.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.takeme.dto.PaymentIntentDto;
import com.takeme.model.Ride;
import com.takeme.model.Transaction;
import com.takeme.repository.RideRepository;
import com.takeme.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody PaymentIntentDto request) {
        try {
            Long rideId = request.getRideId();
            Optional<Ride> rideOpt = rideRepository.findById(rideId);
            
            if (rideOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Ride not found");
            }

            Ride ride = rideOpt.get();
            double amount = request.getAmount() > 0 ? request.getAmount() : ride.getFare();
            long amountInCents = Math.round(amount * 100);

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("inr")
                    .putMetadata("rideId", String.valueOf(rideId))
                    .putMetadata("userId", String.valueOf(ride.getRiderId()))
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            // Pre-create the pending transaction
            Transaction transaction = new Transaction();
            transaction.setUserId(ride.getRiderId());
            transaction.setRideId(rideId);
            transaction.setAmount(amount);
            transaction.setType(Transaction.TransactionType.RIDE_PAYMENT);
            transaction.setStatus(Transaction.TransactionStatus.PENDING);
            transaction.setTransactionId(intent.getId()); // Store the Stripe Intent ID
            transaction.setPaymentMethod("CARD");
            transaction.setDescription("Ride Intent generated");
            transaction.setCreatedAt(LocalDateTime.now());
            
            transactionRepository.save(transaction);

            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", intent.getClientSecret());
            response.put("paymentIntentId", intent.getId());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            return ResponseEntity.status(500).body("Stripe Exception: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event = null;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(400).body("Invalid signature");
        }

        switch (event.getType()) {
            case "payment_intent.succeeded":
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
                handleSuccessfulPayment(intent);
                break;
            case "payment_intent.payment_failed":
                PaymentIntent failedIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
                handleFailedPayment(failedIntent);
                break;
            default:
                break;
        }

        return ResponseEntity.ok("Success");
    }

    @Transactional
    private void handleSuccessfulPayment(PaymentIntent intent) {
        String intentId = intent.getId();
        String rideIdStr = intent.getMetadata().get("rideId");
        
        if (rideIdStr != null) {
            Long rideId = Long.parseLong(rideIdStr);
            
            // 1. Update the actual Ride status
            Optional<Ride> rideOpt = rideRepository.findById(rideId);
            if(rideOpt.isPresent()) {
                Ride r = rideOpt.get();
                
                // Idempotency: skip if already PAID
                if ("PAID".equals(r.getPaymentStatus())) {
                    System.out.println("[STRIPE] Duplicate successful payment webhook for Ride: " + rideId);
                    return;
                }
                
                r.setPaymentStatus("PAID");
                rideRepository.save(r);
            }
            
            // 2. Locate the initialized Transaction Row and mark it COMPLETE
            java.util.List<Transaction> transactions = transactionRepository.findByRideId(rideId);
            for(Transaction t : transactions) {
                if(t.getTransactionId() != null && t.getTransactionId().equals(intentId)) {
                    if (t.getStatus() != Transaction.TransactionStatus.COMPLETED) {
                        t.setStatus(Transaction.TransactionStatus.COMPLETED);
                        transactionRepository.save(t);
                    }
                    break;
                }
            }
        }
    }

    @Transactional
    private void handleFailedPayment(PaymentIntent intent) {
        String rideIdStr = intent.getMetadata().get("rideId");
        String intentId = intent.getId();

        if (rideIdStr != null) {
            Long rideId = Long.parseLong(rideIdStr);
            
            Optional<Ride> rideOpt = rideRepository.findById(rideId);
            if(rideOpt.isPresent()) {
               Ride r = rideOpt.get();
               r.setPaymentStatus("FAILED");
               rideRepository.save(r);
            }
            
            java.util.List<Transaction> transactions = transactionRepository.findByRideId(rideId);
            for(Transaction t : transactions) {
                if(t.getTransactionId() != null && t.getTransactionId().equals(intentId)) {
                    t.setStatus(Transaction.TransactionStatus.FAILED);
                    transactionRepository.save(t);
                    break;
                }
            }
        }
    }
}
