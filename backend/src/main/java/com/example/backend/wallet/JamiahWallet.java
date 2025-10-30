package com.example.backend.wallet;

import com.example.backend.UserProfile;
import com.example.backend.jamiah.Jamiah;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "jamiah_wallets")
public class JamiahWallet {

    @EmbeddedId
    private JamiahWalletId id = new JamiahWalletId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("jamiahId")
    @JoinColumn(name = "jamiah_id", nullable = false)
    private Jamiah jamiah;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("memberId")
    @JoinColumn(name = "member_id", nullable = false)
    private UserProfile member;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "reserved_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal reservedBalance = BigDecimal.ZERO;

    @Column(name = "locked_for_payments", nullable = false)
    private Boolean lockedForPayments = false;

    @Column(name = "locked_for_payouts", nullable = false)
    private Boolean lockedForPayouts = false;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Column(name = "kyc_status")
    private String kycStatus;

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
        if (balance == null) {
            balance = BigDecimal.ZERO;
        }
        if (reservedBalance == null) {
            reservedBalance = BigDecimal.ZERO;
        }
        if (lockedForPayments == null) {
            lockedForPayments = false;
        }
        if (lockedForPayouts == null) {
            lockedForPayouts = false;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        if (balance == null) {
            balance = BigDecimal.ZERO;
        }
        if (reservedBalance == null) {
            reservedBalance = BigDecimal.ZERO;
        }
        if (lockedForPayments == null) {
            lockedForPayments = false;
        }
        if (lockedForPayouts == null) {
            lockedForPayouts = false;
        }
    }

    public JamiahWalletId getId() {
        return id;
    }

    public void setId(JamiahWalletId id) {
        this.id = id;
    }

    public Jamiah getJamiah() {
        return jamiah;
    }

    public void setJamiah(Jamiah jamiah) {
        this.jamiah = jamiah;
        if (jamiah != null) {
            if (this.id == null) {
                this.id = new JamiahWalletId();
            }
            this.id.setJamiahId(jamiah.getId());
        }
    }

    public UserProfile getMember() {
        return member;
    }

    public void setMember(UserProfile member) {
        this.member = member;
        if (member != null) {
            if (this.id == null) {
                this.id = new JamiahWalletId();
            }
            this.id.setMemberId(member.getId());
        }
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getReservedBalance() {
        return reservedBalance;
    }

    public void setReservedBalance(BigDecimal reservedBalance) {
        this.reservedBalance = reservedBalance;
    }

    public Boolean getLockedForPayments() {
        return lockedForPayments;
    }

    public void setLockedForPayments(Boolean lockedForPayments) {
        this.lockedForPayments = lockedForPayments;
    }

    public Boolean getLockedForPayouts() {
        return lockedForPayouts;
    }

    public void setLockedForPayouts(Boolean lockedForPayouts) {
        this.lockedForPayouts = lockedForPayouts;
    }

    public String getStripeAccountId() {
        return stripeAccountId;
    }

    public void setStripeAccountId(String stripeAccountId) {
        this.stripeAccountId = stripeAccountId;
    }

    public String getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(String kycStatus) {
        this.kycStatus = kycStatus;
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

    public Long getJamiahId() {
        if (id != null && id.getJamiahId() != null) {
            return id.getJamiahId();
        }
        return jamiah != null ? jamiah.getId() : null;
    }

    public Long getMemberId() {
        if (id != null && id.getMemberId() != null) {
            return id.getMemberId();
        }
        return member != null ? member.getId() : null;
    }
}
