package com.example.backend.jamiah.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class WalletDto {
    private Long jamiahId;
    private String memberId;
    private String username;
    private BigDecimal balance;
    private BigDecimal reserved;
    private Instant lastUpdated;
    private String kycStatus;
    private boolean requiresOnboarding;
    private boolean lockedForPayments;
    private boolean lockedForPayouts;
}
