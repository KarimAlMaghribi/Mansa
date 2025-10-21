package com.example.backend.jamiah.dto;

import lombok.Data;

@Data
public class PaymentConfirmationDto {
    private PaymentDto payment;
    private WalletDto wallet;
}
