package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JamiahPaymentRepository extends JpaRepository<JamiahPayment, Long> {
    long countByCycleId(Long cycleId);
    java.util.List<JamiahPayment> findByCycleId(Long cycleId);
    java.util.Optional<JamiahPayment> findByCycleIdAndUserUid(Long cycleId, String uid);
}
