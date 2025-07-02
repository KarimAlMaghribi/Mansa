package com.example.backend.jamiah;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "jamiah")
public class Jamiah {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
}
