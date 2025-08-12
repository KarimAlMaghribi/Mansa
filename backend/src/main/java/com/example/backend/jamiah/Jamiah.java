package com.example.backend.jamiah;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Entity
@Table(name = "jamiah")
public class Jamiah {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Public identifier exposed via the API.
     */
    @Column(name = "public_id", nullable = false, unique = true, updatable = false, columnDefinition = "UUID")
    private UUID publicId;

    /**
     * UID of the user who created this Jamiah.
     */
    private String ownerId;

    @NotBlank
    @Size(min = 3)
    @Column(nullable = false)
    private String name;

    private String description;

    private String language;

    @NotNull
    private Boolean isPublic;

    @Min(2)
    private Integer maxGroupSize;

    @Min(1)
    private Integer maxMembers;

    @Min(1)
    private Integer cycleCount;

    @Positive
    private BigDecimal rateAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    private RateInterval rateInterval;

    @FutureOrPresent
    private LocalDate startDate;

    private String invitationCode;

    private LocalDate invitationExpiry;

    @ManyToMany
    @JoinTable(name = "jamiah_members",
            joinColumns = @JoinColumn(name = "jamiah_id"),
            inverseJoinColumns = @JoinColumn(name = "user_profile_id"))
    private Set<com.example.backend.UserProfile> members = new HashSet<>();

    @PrePersist
    void prePersist() {
        if (publicId == null) {
            publicId = UUID.randomUUID();
        }
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }
}
