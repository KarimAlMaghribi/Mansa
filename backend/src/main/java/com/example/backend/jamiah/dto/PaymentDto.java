package com.example.backend.jamiah.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
public class PaymentDto {
    private Long id;
    private UserRef user;
    private Instant paidAt;
    private BigDecimal amount;
    private PaymentStatus status;

    public enum PaymentStatus {
        UNPAID,
        PAID_SELF_CONFIRMED,
        RECEIPT_CONFIRMED
    }

    @Data
    public static class UserRef {
        private String uid;
    }
}
