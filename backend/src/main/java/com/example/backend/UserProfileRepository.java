package com.example.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    boolean existsByUsername(String username);
    Optional<UserProfile> findByUid(String uid);

    List<UserProfile> findByUidIn(Collection<String> uids);

    @Query("select u from UserProfile u left join fetch u.jamiahs where u.uid = :uid")
    Optional<UserProfile> findWithJamiahsByUid(@Param("uid") String uid);
}
