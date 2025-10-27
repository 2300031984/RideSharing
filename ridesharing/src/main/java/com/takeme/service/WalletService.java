package com.takeme.service;

import com.takeme.model.Transaction;
import com.takeme.model.Rider;
import com.takeme.model.Driver;
import com.takeme.repository.TransactionRepository;
import com.takeme.repository.RiderRepository;
import com.takeme.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WalletService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private RiderRepository riderRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    public Double getWalletBalance(Long userId, String role) {
        if ("Driver".equalsIgnoreCase(role)) {
            return driverRepository.findById(userId)
                .map(Driver::getWalletBalance)
                .orElse(0.0);
        } else {
            return riderRepository.findById(userId)
                .map(Rider::getWalletBalance)
                .orElse(0.0);
        }
    }
    
    @Transactional
    public Transaction rechargeWallet(Long userId, Double amount, String paymentMethod, String role) {
        if (amount <= 0) {
            throw new RuntimeException("Invalid amount");
        }
        
        // Update wallet balance
        if ("Driver".equalsIgnoreCase(role)) {
            Driver driver = driverRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
            driver.setWalletBalance(driver.getWalletBalance() + amount);
            driverRepository.save(driver);
        } else {
            Rider rider = riderRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            rider.setWalletBalance(rider.getWalletBalance() + amount);
            riderRepository.save(rider);
        }
        
        // Create transaction record
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setType(Transaction.TransactionType.WALLET_RECHARGE);
        transaction.setAmount(amount);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setTransactionId("TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transaction.setDescription("Wallet recharge");
        
        transaction = transactionRepository.save(transaction);
        
        // Send notification
        notificationService.createNotification(
            userId,
            "Wallet Recharged",
            "Your wallet has been recharged with ₹" + amount,
            "PAYMENT",
            null
        );
        
        return transaction;
    }
    
    @Transactional
    public Transaction processRidePayment(Long userId, Long rideId, Double amount, String paymentMethod) {
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setType(Transaction.TransactionType.RIDE_PAYMENT);
        transaction.setAmount(amount);
        transaction.setRideId(rideId);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setTransactionId("TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transaction.setDescription("Ride payment #" + rideId);
        
        if ("WALLET".equalsIgnoreCase(paymentMethod)) {
            Rider rider = riderRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (rider.getWalletBalance() < amount) {
                transaction.setStatus(Transaction.TransactionStatus.FAILED);
                transactionRepository.save(transaction);
                throw new RuntimeException("Insufficient wallet balance");
            }
            
            rider.setWalletBalance(rider.getWalletBalance() - amount);
            riderRepository.save(rider);
            transaction.setStatus(Transaction.TransactionStatus.COMPLETED);
        } else {
            // For other payment methods (UPI, CARD, CASH), mark as completed
            transaction.setStatus(Transaction.TransactionStatus.COMPLETED);
        }
        
        return transactionRepository.save(transaction);
    }
    
    public List<Transaction> getTransactionHistory(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Transaction> getTransactionsByType(Long userId, Transaction.TransactionType type) {
        return transactionRepository.findByUserIdAndType(userId, type);
    }
}
