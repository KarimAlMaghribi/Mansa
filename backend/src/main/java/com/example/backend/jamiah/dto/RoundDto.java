package com.example.backend.jamiah.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class RoundDto {
    private Long id;
    private Integer cycleNumber;
    private LocalDate startDate;
    private boolean completed;
    private boolean receiptConfirmed;
    private boolean allPaid;
    private BigDecimal expectedAmount;
    private Recipient recipient;
    private List<PaymentDto> payments;
    private List<WalletDto> wallets;

    @Data
    public static class Recipient {
        private String uid;
        private String username;
        private String firstName;
        private String lastName;
    }
}
