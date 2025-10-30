package com.example.backend.wallet;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JamiahWalletRepository extends JpaRepository<JamiahWallet, JamiahWalletId> {

    Optional<JamiahWallet> findByJamiah_IdAndMember_Id(Long jamiahId, Long memberId);

    List<JamiahWallet> findAllByJamiah_Id(Long jamiahId);

    List<JamiahWallet> findAllByJamiah_IdAndMember_IdIn(Long jamiahId, Collection<Long> memberIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<JamiahWallet> findAllByJamiah_IdAndMember_IdInOrderByMember_Id(Long jamiahId, Collection<Long> memberIds);
}
