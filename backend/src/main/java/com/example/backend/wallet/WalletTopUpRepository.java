package com.example.backend.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTopUpRepository extends JpaRepository<WalletTopUp, Long> {
    List<WalletTopUp> findAllByJamiahIdAndMemberIdAndAppliedFalse(Long jamiahId, Long memberId);

    Optional<WalletTopUp> findByStripePaymentIntentId(String paymentIntentId);

    Optional<WalletTopUp> findFirstByJamiahIdAndMemberIdOrderByCreatedAtDesc(Long jamiahId, Long memberId);
}
