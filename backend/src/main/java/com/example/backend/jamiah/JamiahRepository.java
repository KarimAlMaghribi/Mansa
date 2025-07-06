package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JamiahRepository extends JpaRepository<Jamiah, Long> {
    Optional<Jamiah> findByInvitationCode(String invitationCode);

    @Query("select j from Jamiah j left join fetch j.members where j.invitationCode = :code")
    Optional<Jamiah> findWithMembersByInvitationCode(@Param("code") String invitationCode);

    @Query("select count(m) from Jamiah j join j.members m where j.id = :id")
    long countMembers(@Param("id") Long id);

    /**
     * Find all Jamiahs created by the given user.
     */
    java.util.List<Jamiah> findByOwnerId(String ownerId);
}
