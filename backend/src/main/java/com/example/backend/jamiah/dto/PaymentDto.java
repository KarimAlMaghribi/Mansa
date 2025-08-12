package com.example.backend.jamiah.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class PaymentDto {
    private Long id;
    private UserRef user;
    private Instant paidAt;
    private Boolean confirmed;
    private Boolean recipientConfirmed;

    @Data
    public static class UserRef {
        private String uid;
    }
}
