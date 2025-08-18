package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "jamiah_join_requests",
       uniqueConstraints = @UniqueConstraint(columnNames = {"jamiah_id", "user_profile_id"}))
public class JamiahJoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "jamiah_id")
    private Jamiah jamiah;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_profile_id")
    private UserProfile user;

    @Column(length = 2048)
    private String motivation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    public enum Status {
        PENDING,
        APPROVED,
        REJECTED
    }
}
