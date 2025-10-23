package com.takeme.service;

import com.takeme.model.Wallet;
import com.takeme.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    public Wallet getWallet(Long riderId) {
        Optional<Wallet> existingWallet = walletRepository.findByRiderId(riderId);
        if (existingWallet.isPresent()) {
            return existingWallet.get();
        } else {
            // Create new wallet if it doesn't exist
            Wallet newWallet = new Wallet();
            newWallet.setRiderId(riderId);
            newWallet.setBalance(0.0);
            return walletRepository.save(newWallet);
        }
    }

    public Wallet updateBalance(Long riderId, Double amount) {
        Wallet wallet = getWallet(riderId);
        wallet.setBalance(wallet.getBalance() + amount);
        return walletRepository.save(wallet);
    }

    public boolean hasSufficientBalance(Long riderId, Double amount) {
        Wallet wallet = getWallet(riderId);
        return wallet.getBalance() >= amount;
    }
}
