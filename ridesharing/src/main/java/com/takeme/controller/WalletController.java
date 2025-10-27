package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.Transaction;
import com.takeme.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*")
public class WalletController {
    
    @Autowired
    private WalletService walletService;
    
    @GetMapping("/{userId}/balance")
    public ResponseEntity<?> getWalletBalance(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "User") String role) {
        try {
            Double balance = walletService.getWalletBalance(userId, role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("balance", balance);
            response.put("userId", userId);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/recharge")
    public ResponseEntity<?> rechargeWallet(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> payload) {
        try {
            Double amount = Double.valueOf(payload.get("amount").toString());
            String paymentMethod = (String) payload.getOrDefault("paymentMethod", "UPI");
            String role = (String) payload.getOrDefault("role", "User");
            
            Transaction transaction = walletService.rechargeWallet(userId, amount, paymentMethod, role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("transaction", transaction);
            response.put("newBalance", walletService.getWalletBalance(userId, role));
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Wallet recharged successfully", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}/pay")
    public ResponseEntity<?> processPayment(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> payload) {
        try {
            Long rideId = Long.valueOf(payload.get("rideId").toString());
            Double amount = Double.valueOf(payload.get("amount").toString());
            String paymentMethod = (String) payload.getOrDefault("paymentMethod", "WALLET");
            
            Transaction transaction = walletService.processRidePayment(userId, rideId, amount, paymentMethod);
            
            return ResponseEntity.ok(ApiResponse.success("Payment processed successfully", transaction));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{userId}/transactions")
    public ResponseEntity<?> getTransactionHistory(@PathVariable Long userId) {
        try {
            List<Transaction> transactions = walletService.getTransactionHistory(userId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
