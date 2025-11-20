package com.example.backend.wallet;

import java.math.BigDecimal;
import java.time.Instant;

public class WalletStatusResponse {
    private Long jamiahId;
    private String jamiahPublicId;
    private Long memberId;
    private String memberUid;
    private BigDecimal balance;
    private BigDecimal reservedBalance;
    private Instant updatedAt;
    private String stripeAccountId;
    private String kycStatus;
    private boolean requiresOnboarding;
    private String onboardingUrl;
    private String accountSessionClientSecret;
    private String publishableKey;
    private String stripeSandboxId;
    private boolean stripeConfigured = true;
    private String statusMessage;
    private boolean lockedForPayments;
    private boolean lockedForPayouts;
    private Boolean stripeChargesEnabled;
    private Boolean stripePayoutsEnabled;
    private String stripeDisabledReason;
    private String paymentIntentId;
    private String paymentIntentClientSecret;
    private String paymentIntentStatus;

    public Long getJamiahId() {
        return jamiahId;
    }

    public void setJamiahId(Long jamiahId) {
        this.jamiahId = jamiahId;
    }

    public String getJamiahPublicId() {
        return jamiahPublicId;
    }

    public void setJamiahPublicId(String jamiahPublicId) {
        this.jamiahPublicId = jamiahPublicId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getMemberUid() {
        return memberUid;
    }

    public void setMemberUid(String memberUid) {
        this.memberUid = memberUid;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
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

    public boolean isRequiresOnboarding() {
        return requiresOnboarding;
    }

    public void setRequiresOnboarding(boolean requiresOnboarding) {
        this.requiresOnboarding = requiresOnboarding;
    }

    public String getOnboardingUrl() {
        return onboardingUrl;
    }

    public void setOnboardingUrl(String onboardingUrl) {
        this.onboardingUrl = onboardingUrl;
    }

    public String getAccountSessionClientSecret() {
        return accountSessionClientSecret;
    }

    public void setAccountSessionClientSecret(String accountSessionClientSecret) {
        this.accountSessionClientSecret = accountSessionClientSecret;
    }

    public String getPublishableKey() {
        return publishableKey;
    }

    public void setPublishableKey(String publishableKey) {
        this.publishableKey = publishableKey;
    }

    public String getStripeSandboxId() {
        return stripeSandboxId;
    }

    public void setStripeSandboxId(String stripeSandboxId) {
        this.stripeSandboxId = stripeSandboxId;
    }

    public boolean isStripeConfigured() {
        return stripeConfigured;
    }

    public void setStripeConfigured(boolean stripeConfigured) {
        this.stripeConfigured = stripeConfigured;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public boolean isLockedForPayments() {
        return lockedForPayments;
    }

    public void setLockedForPayments(boolean lockedForPayments) {
        this.lockedForPayments = lockedForPayments;
    }

    public boolean isLockedForPayouts() {
        return lockedForPayouts;
    }

    public void setLockedForPayouts(boolean lockedForPayouts) {
        this.lockedForPayouts = lockedForPayouts;
    }

    public Boolean getStripeChargesEnabled() {
        return stripeChargesEnabled;
    }

    public void setStripeChargesEnabled(Boolean stripeChargesEnabled) {
        this.stripeChargesEnabled = stripeChargesEnabled;
    }

    public Boolean getStripePayoutsEnabled() {
        return stripePayoutsEnabled;
    }

    public void setStripePayoutsEnabled(Boolean stripePayoutsEnabled) {
        this.stripePayoutsEnabled = stripePayoutsEnabled;
    }

    public String getStripeDisabledReason() {
        return stripeDisabledReason;
    }

    public void setStripeDisabledReason(String stripeDisabledReason) {
        this.stripeDisabledReason = stripeDisabledReason;
    }

    public String getPaymentIntentId() {
        return paymentIntentId;
    }

    public void setPaymentIntentId(String paymentIntentId) {
        this.paymentIntentId = paymentIntentId;
    }

    public String getPaymentIntentClientSecret() {
        return paymentIntentClientSecret;
    }

    public void setPaymentIntentClientSecret(String paymentIntentClientSecret) {
        this.paymentIntentClientSecret = paymentIntentClientSecret;
    }

    public String getPaymentIntentStatus() {
        return paymentIntentStatus;
    }

    public void setPaymentIntentStatus(String paymentIntentStatus) {
        this.paymentIntentStatus = paymentIntentStatus;
    }
}
