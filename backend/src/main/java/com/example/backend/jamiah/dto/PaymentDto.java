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
    private Instant recipientConfirmedAt;
    private String stripePaymentIntentId;
    private String clientSecret;
    private String publishableKey;
    private PaymentStatus status;

    public enum PaymentStatus {
        UNPAID,
        INITIATED,
        PAID_SELF_CONFIRMED,
        RECEIPT_CONFIRMED
    }

    @Data
    public static class UserRef {
        private String uid;
        private String username;
        private String firstName;
        private String lastName;
    }
}
