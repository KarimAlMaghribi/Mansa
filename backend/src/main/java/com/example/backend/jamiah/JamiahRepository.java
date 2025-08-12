package com.example.backend.jamiah;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface JamiahRepository extends JpaRepository<Jamiah, Long> {
    Optional<Jamiah> findByInvitationCode(String invitationCode);

    Optional<Jamiah> findByPublicId(UUID publicId);

    /**
     * Fallback lookup for legacy deterministic IDs that were derived from the
     * numeric database ID. This method can be dropped once all clients have
     * migrated to the persisted {@code publicId} values.
     */
    default Optional<Jamiah> findByLegacyPublicId(String legacy) {
        try {
            UUID legacyUuid = UUID.fromString(legacy);
            return findAll().stream()
                    .filter(j -> UUID.nameUUIDFromBytes(
                            j.getId().toString().getBytes()).equals(legacyUuid))
                    .findFirst();
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    @Query("select j from Jamiah j left join fetch j.members where j.invitationCode = :code")
    Optional<Jamiah> findWithMembersByInvitationCode(@Param("code") String invitationCode);

    @Query("select count(m) from Jamiah j join j.members m where j.id = :id")
    long countMembers(@Param("id") Long id);

    /**
     * Find all public Jamiahs.
     */
    java.util.List<Jamiah> findByIsPublicTrue();

    /**
     * Fetch a Jamiah with members by numeric id.
     */
    @Query("select j from Jamiah j left join fetch j.members where j.id = :id")
    Optional<Jamiah> findWithMembersById(@Param("id") Long id);

    /**
     * Find all Jamiahs created by the given user.
     */
    java.util.List<Jamiah> findByOwnerId(String ownerId);

    /**
     * Find all Jamiahs where the given user is a member.
     */
    @Query("SELECT j FROM Jamiah j JOIN j.members m WHERE m.uid = :uid")
    java.util.List<Jamiah> findByMemberUid(@Param("uid") String uid);
}
