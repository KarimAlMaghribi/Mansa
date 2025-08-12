package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JamiahPaymentRepository extends JpaRepository<JamiahPayment, Long> {
    java.util.Optional<JamiahPayment> findByJamiahIdAndCycleIdAndPayerUid(Long jamiahId, Long cycleId, String payerUid);

    java.util.List<JamiahPayment> findAllByJamiahIdAndCycleId(Long jamiahId, Long cycleId);
}
