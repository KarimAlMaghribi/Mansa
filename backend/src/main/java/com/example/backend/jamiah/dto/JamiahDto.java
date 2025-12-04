package com.example.backend.jamiah.dto;

import com.example.backend.jamiah.RateInterval;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class JamiahDto {
    private UUID id;

    /** Owner of the Jamiah (uid of the creating user). */
    private String ownerId;

    @NotBlank
    @Size(min = 3)
    private String name;

    private String description;

    private String language;

    @NotNull
    private Boolean isPublic;

    @Min(2)
    private Integer maxGroupSize;

    private Integer maxMembers;

    private Integer currentMembers;

    @Min(1)
    private Integer cycleCount;

    @Positive
    private BigDecimal rateAmount;

    @NotNull
    private RateInterval rateInterval;

    @FutureOrPresent
    private LocalDate startDate;

    private String invitationCode;

    private LocalDate invitationExpiry;

    private String paymentMethod;

    private Boolean stripeFeeConsentAccepted;

    private Instant stripeFeeConsentAcceptedAt;
}
