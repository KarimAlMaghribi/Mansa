package com.example.backend.jamiah;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JamiahJoinRequestRepository extends JpaRepository<JamiahJoinRequest, Long> {
    Optional<JamiahJoinRequest> findByJamiahAndUser(Jamiah jamiah, com.example.backend.UserProfile user);
    List<JamiahJoinRequest> findByJamiah(Jamiah jamiah);
    List<JamiahJoinRequest> findByUser_Uid(String uid);
}
