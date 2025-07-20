package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JamiahCycleRepository extends JpaRepository<JamiahCycle, Long> {
    long countByJamiahId(Long jamiahId);
}
