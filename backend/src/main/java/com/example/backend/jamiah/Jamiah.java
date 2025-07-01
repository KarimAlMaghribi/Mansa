package com.example.backend.jamiah;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    @NotNull
    private Boolean isPublic;

    @Min(2)
    private Integer maxGroupSize;

    @Min(1)
    private Integer cycleCount;

    @Positive
    private BigDecimal rateAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    private RateInterval rateInterval;

    @FutureOrPresent
    private LocalDate startDate;
}
