package com.takeme.repository;

import com.takeme.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Transaction> findByRideId(Long rideId);
    List<Transaction> findByUserIdAndType(Long userId, Transaction.TransactionType type);
    List<Transaction> findByUserIdAndStatus(Long userId, Transaction.TransactionStatus status);
}
