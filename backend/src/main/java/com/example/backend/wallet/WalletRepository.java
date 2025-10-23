package com.example.backend.wallet;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Collection;
import java.util.List;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByMemberIdIn(Collection<Long> memberIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Wallet> findAllByMemberIdIn(Collection<Long> memberIds);
}
