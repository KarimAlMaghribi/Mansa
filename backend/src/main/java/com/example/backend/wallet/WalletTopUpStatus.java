package com.example.backend.wallet;

public enum WalletTopUpStatus {
    CREATED,
    PROCESSING,
    REQUIRES_ACTION,
    SUCCEEDED,
    FAILED,
    CANCELED
}
