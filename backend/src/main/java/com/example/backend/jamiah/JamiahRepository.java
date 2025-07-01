package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JamiahRepository extends JpaRepository<Jamiah, Long> {
    Optional<Jamiah> findByInvitationCode(String invitationCode);
}
