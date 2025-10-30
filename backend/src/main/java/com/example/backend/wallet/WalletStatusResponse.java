package com.example.backend.wallet;

import java.math.BigDecimal;
import java.time.Instant;

public class WalletStatusResponse {
    private Long jamiahId;
    private String jamiahPublicId;
    private Long memberId;
    private String memberUid;
    private BigDecimal balance;
    private Instant updatedAt;
    private String stripeAccountId;
    private String kycStatus;
    private boolean requiresOnboarding;
    private String onboardingUrl;
    private String accountSessionClientSecret;
    private String stripeSandboxId;

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

    public String getStripeSandboxId() {
        return stripeSandboxId;
    }

    public void setStripeSandboxId(String stripeSandboxId) {
        this.stripeSandboxId = stripeSandboxId;
    }
}
