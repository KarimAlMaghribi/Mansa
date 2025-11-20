package com.example.backend.wallet;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_top_ups")
public class WalletTopUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jamiah_id", nullable = false)
    private Long jamiahId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(name = "stripe_status")
    private String stripeStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WalletTopUpStatus status = WalletTopUpStatus.CREATED;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = WalletTopUpStatus.CREATED;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        if (status == null) {
            status = WalletTopUpStatus.CREATED;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJamiahId() {
        return jamiahId;
    }

    public void setJamiahId(Long jamiahId) {
        this.jamiahId = jamiahId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }

    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStripeStatus() {
        return stripeStatus;
    }

    public void setStripeStatus(String stripeStatus) {
        this.stripeStatus = stripeStatus;
    }

    public WalletTopUpStatus getStatus() {
        return status;
    }

    public void setStatus(WalletTopUpStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
