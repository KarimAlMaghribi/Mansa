package com.example.backend.jamiah;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JamiahPaymentRepository extends JpaRepository<JamiahPayment, Long> {
    java.util.Optional<JamiahPayment> findByJamiahIdAndCycleIdAndPayerUid(Long jamiahId, Long cycleId, String payerUid);

    java.util.List<JamiahPayment> findAllByJamiahIdAndCycleId(Long jamiahId, Long cycleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from JamiahPayment p where p.jamiahId = :jamiahId and p.cycleId = :cycleId")
    java.util.List<JamiahPayment> findAllByJamiahIdAndCycleIdForUpdate(@Param("jamiahId") Long jamiahId,
                                                                      @Param("cycleId") Long cycleId);
}
