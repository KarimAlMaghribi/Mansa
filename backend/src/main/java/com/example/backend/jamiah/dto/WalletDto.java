package com.example.backend.jamiah.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class WalletDto {
    private String memberId;
    private String username;
    private BigDecimal balance;
    private Instant lastUpdated;
}
