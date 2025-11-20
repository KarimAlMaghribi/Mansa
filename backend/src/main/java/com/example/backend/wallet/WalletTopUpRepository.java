package com.example.backend.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, Long> {

    Optional<WalletTopUp> findByStripePaymentIntentId(String paymentIntentId);
}
