package com.example.backend.wallet;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "jamiah_wallet_topups")
public class WalletTopUp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jamiah_id", nullable = false)
    private Long jamiahId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false)
    private String currency;

    @Column(name = "stripe_payment_intent_id", nullable = false, unique = true)
    private String stripePaymentIntentId;

    @Column(name = "payment_intent_status")
    private String paymentIntentStatus;

    @Column(name = "applied", nullable = false)
    private Boolean applied = false;

    @Column(name = "rolled_back", nullable = false)
    private Boolean rolledBack = false;

    @Column(name = "applied_at")
    private Instant appliedAt;

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
        if (applied == null) {
            applied = false;
        }
        if (rolledBack == null) {
            rolledBack = false;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        if (applied == null) {
            applied = false;
        }
        if (rolledBack == null) {
            rolledBack = false;
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

    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }

    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public String getPaymentIntentStatus() {
        return paymentIntentStatus;
    }

    public void setPaymentIntentStatus(String paymentIntentStatus) {
        this.paymentIntentStatus = paymentIntentStatus;
    }

    public Boolean getApplied() {
        return applied;
    }

    public void setApplied(Boolean applied) {
        this.applied = applied;
    }

    public Boolean getRolledBack() {
        return rolledBack;
    }

    public void setRolledBack(Boolean rolledBack) {
        this.rolledBack = rolledBack;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
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
