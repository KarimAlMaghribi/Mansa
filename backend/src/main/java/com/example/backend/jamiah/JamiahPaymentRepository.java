package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JamiahPaymentRepository extends JpaRepository<JamiahPayment, Long> {
    long countByCycleId(Long cycleId);
}
