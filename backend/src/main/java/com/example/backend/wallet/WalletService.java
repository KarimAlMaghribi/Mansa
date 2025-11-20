package com.example.backend.wallet;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.Jamiah;
import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.payment.StripePaymentProvider;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.AccountSession;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class WalletService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final String DEFAULT_CURRENCY = "eur";

    private final JamiahRepository jamiahRepository;
    private final JamiahWalletRepository walletRepository;
    private final UserProfileRepository userRepository;
    private final StripePaymentProvider stripePaymentProvider;
    private final StripeAccountStatusUpdater stripeAccountStatusUpdater;
    private final String defaultAccountReturnUrl;
    private final String defaultAccountRefreshUrl;
    private final String publishableKey;

    @PersistenceContext
    private EntityManager entityManager;

    public WalletService(JamiahRepository jamiahRepository,
                         JamiahWalletRepository walletRepository,
                         UserProfileRepository userRepository,
                         StripePaymentProvider stripePaymentProvider,
                         StripeAccountStatusUpdater stripeAccountStatusUpdater,
                         @Value("${stripe.connect.account-return-url:}") String defaultAccountReturnUrl,
                         @Value("${stripe.connect.account-refresh-url:}") String defaultAccountRefreshUrl,
                         @Value("${stripe.publishable-key:}") String publishableKey) {
        this.jamiahRepository = jamiahRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.stripePaymentProvider = stripePaymentProvider;
        this.stripeAccountStatusUpdater = stripeAccountStatusUpdater;
        this.defaultAccountReturnUrl = normalizeUrl(defaultAccountReturnUrl);
        this.defaultAccountRefreshUrl = normalizeUrl(defaultAccountRefreshUrl);
        this.publishableKey = publishableKey;
    }

    public WalletStatusResponse createWallet(String jamiahPublicId,
                                             String callerUid,
                                             String returnUrl,
                                             String refreshUrl,
                                             boolean createDashboardSession) {
        Jamiah jamiah = resolveJamiah(jamiahPublicId);
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        UserProfile member = ensureMembership(callerUid, jamiahWithMembers);
        JamiahWallet wallet = walletRepository
                .findByJamiah_IdAndMember_Id(jamiahWithMembers.getId(), member.getId())
                .orElseGet(() -> walletRepository.save(createWalletEntity(jamiahWithMembers, member)));
        Account account = ensureStripeAccount(wallet, jamiahWithMembers, member);
        return buildStatus(jamiahWithMembers, member, wallet, account, returnUrl, refreshUrl, createDashboardSession);
    }

    public WalletStatusResponse topUp(String jamiahPublicId,
                                      String callerUid,
                                      BigDecimal amount,
                                      String returnUrl,
                                      String refreshUrl,
                                      boolean createDashboardSession) {
        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Positive amount required");
        }
        Jamiah jamiah = resolveJamiah(jamiahPublicId);
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        UserProfile member = ensureMembership(callerUid, jamiahWithMembers);
        JamiahWallet wallet = lock(jamiahWithMembers, member);
        BigDecimal balance = Optional.ofNullable(wallet.getBalance()).orElse(ZERO);
        wallet.setBalance(balance.add(amount));
        walletRepository.save(wallet);
        Account account = ensureStripeAccount(wallet, jamiahWithMembers, member);
        return buildStatus(jamiahWithMembers, member, wallet, account, returnUrl, refreshUrl, createDashboardSession);
    }

    public void ensureBalance(Jamiah jamiah, UserProfile member, BigDecimal amount) {
        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Positive amount required");
        }
        JamiahWallet wallet = lock(jamiah, member);
        ensureWalletAvailability(wallet, amount);
    }

    public JamiahWallet reserve(Jamiah jamiah, UserProfile member, BigDecimal amount) {
        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Positive amount required");
        }
        JamiahWallet wallet = lock(jamiah, member);
        if (Boolean.TRUE.equals(wallet.getLockedForPayments())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is locked for outgoing payments");
        }
        ensureWalletAvailability(wallet, amount);
        BigDecimal reserved = Optional.ofNullable(wallet.getReservedBalance()).orElse(ZERO);
        wallet.setReservedBalance(reserved.add(amount));
        return walletRepository.save(wallet);
    }

    public JamiahWallet credit(Jamiah jamiah, UserProfile member, BigDecimal amount) {
        return credit(jamiah, member, amount, false);
    }

    public JamiahWallet credit(Jamiah jamiah, UserProfile member, BigDecimal amount, boolean reserveForPayment) {
        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Positive amount required");
        }
        JamiahWallet wallet = lock(jamiah, member);
        if (Boolean.TRUE.equals(wallet.getLockedForPayments())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is locked for outgoing payments");
        }
        BigDecimal balance = Optional.ofNullable(wallet.getBalance()).orElse(ZERO);
        wallet.setBalance(balance.add(amount));
        if (reserveForPayment) {
            BigDecimal reserved = Optional.ofNullable(wallet.getReservedBalance()).orElse(ZERO);
            wallet.setReservedBalance(reserved.add(amount));
        }
        return walletRepository.save(wallet);
    }

    public Map<Long, JamiahWallet> transfer(Jamiah jamiah,
                                            Map<UserProfile, BigDecimal> outgoing,
                                            UserProfile recipient) {
        if (outgoing == null || outgoing.isEmpty()) {
            return Map.of();
        }
        if (recipient == null || recipient.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient profile incomplete");
        }
        Map<Long, JamiahWallet> updated = new LinkedHashMap<>();
        BigDecimal totalIncoming = ZERO;
        for (Map.Entry<UserProfile, BigDecimal> entry : outgoing.entrySet()) {
            UserProfile payer = entry.getKey();
            BigDecimal amount = entry.getValue();
            if (payer == null || payer.getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payer profile incomplete");
            }
            if (amount == null || amount.compareTo(ZERO) <= 0) {
                continue;
            }
            JamiahWallet payerWallet = lock(jamiah, payer);
            if (Boolean.TRUE.equals(payerWallet.getLockedForPayments())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is locked for outgoing payments");
            }
            BigDecimal reserved = Optional.ofNullable(payerWallet.getReservedBalance()).orElse(ZERO);
            if (reserved.compareTo(amount) < 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Reserved balance insufficient for transfer");
            }
            BigDecimal balance = Optional.ofNullable(payerWallet.getBalance()).orElse(ZERO);
            if (balance.compareTo(amount) < 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet balance insufficient for transfer");
            }
            payerWallet.setReservedBalance(reserved.subtract(amount));
            payerWallet.setBalance(balance.subtract(amount));
            payerWallet = walletRepository.save(payerWallet);
            updated.put(payer.getId(), payerWallet);
            totalIncoming = totalIncoming.add(amount);
        }

        if (totalIncoming.compareTo(ZERO) > 0) {
            JamiahWallet recipientWallet = lock(jamiah, recipient);
            if (Boolean.TRUE.equals(recipientWallet.getLockedForPayouts())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is locked for payouts");
            }
            BigDecimal balance = Optional.ofNullable(recipientWallet.getBalance()).orElse(ZERO);
            recipientWallet.setBalance(balance.add(totalIncoming));
            recipientWallet = walletRepository.save(recipientWallet);
            updated.put(recipient.getId(), recipientWallet);
        }
        return updated;
    }

    public JamiahWallet getOrCreateWallet(Jamiah jamiah, UserProfile member) {
        if (jamiah == null || member == null || member.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member profile incomplete");
        }
        return walletRepository
                .findByJamiah_IdAndMember_Id(jamiah.getId(), member.getId())
                .map(wallet -> {
                    wallet.setJamiah(jamiah);
                    wallet.setMember(member);
                    if (wallet.getReservedBalance() == null) {
                        wallet.setReservedBalance(ZERO);
                    }
                    if (wallet.getLockedForPayments() == null) {
                        wallet.setLockedForPayments(false);
                    }
                    if (wallet.getLockedForPayouts() == null) {
                        wallet.setLockedForPayouts(false);
                    }
                    return wallet;
                })
                .orElseGet(() -> walletRepository.save(createWalletEntity(jamiah, member)));
    }

    public JamiahWallet provisionWallet(Jamiah jamiah, UserProfile member) {
        JamiahWallet wallet = getOrCreateWallet(jamiah, member);
        Account account = ensureStripeAccount(wallet, jamiah, member);
        if (account == null && wallet.getStripeAccountId() != null) {
            walletRepository.save(wallet);
        }
        return wallet;
    }

    public void provisionWallets(Jamiah jamiah, Collection<UserProfile> members) {
        if (jamiah == null || members == null || members.isEmpty()) {
            return;
        }
        for (UserProfile member : members) {
            if (member != null && member.getId() != null) {
                provisionWallet(jamiah, member);
            }
        }
    }

    public Map<Long, JamiahWallet> findAllByMembers(Jamiah jamiah, Collection<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        List<JamiahWallet> wallets = walletRepository
                .findAllByJamiah_IdAndMember_IdIn(jamiah.getId(), new ArrayList<>(memberIds));
        return wallets.stream().collect(Collectors.toMap(JamiahWallet::getMemberId, wallet -> {
            wallet.setJamiah(jamiah);
            return wallet;
        }));
    }

    public JamiahWallet lock(String jamiahPublicId, String callerUid) {
        Jamiah jamiah = resolveJamiah(jamiahPublicId);
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        UserProfile member = ensureMembership(callerUid, jamiahWithMembers);
        return lock(jamiahWithMembers, member);
    }

    public WalletStatusResponse withdraw(String jamiahPublicId,
                                         String callerUid,
                                         BigDecimal amount,
                                         String returnUrl,
                                         String refreshUrl,
                                         boolean createDashboardSession) {
        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Positive amount required");
        }
        Jamiah jamiah = resolveJamiah(jamiahPublicId);
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        UserProfile member = ensureMembership(callerUid, jamiahWithMembers);
        JamiahWallet wallet = lock(jamiahWithMembers, member);
        BigDecimal balance = Optional.ofNullable(wallet.getBalance()).orElse(ZERO);
        BigDecimal reserved = Optional.ofNullable(wallet.getReservedBalance()).orElse(ZERO);
        BigDecimal available = balance.subtract(reserved);
        if (available.compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient available balance");
        }
        if (stripePaymentProvider.isConfigured()
                && (wallet.getStripeAccountId() == null || wallet.getStripeAccountId().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wallet is not connected to Stripe");
        }
        Map<String, Object> transferParams = new HashMap<>();
        transferParams.put("amount", toStripeAmount(amount));
        transferParams.put("currency", DEFAULT_CURRENCY);
        transferParams.put("destination", wallet.getStripeAccountId());
        Map<String, String> metadata = new HashMap<>();
        metadata.put("jamiahId", jamiahWithMembers.getId().toString());
        metadata.put("memberId", member.getId().toString());
        transferParams.put("metadata", metadata);
        try {
            stripePaymentProvider.createTransfer(transferParams);
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }
        wallet.setBalance(balance.subtract(amount));
        walletRepository.save(wallet);
        Account account = ensureStripeAccount(wallet, jamiahWithMembers, member);
        return buildStatus(jamiahWithMembers, member, wallet, account, returnUrl, refreshUrl, createDashboardSession);
    }

    public WalletStatusResponse getStatus(String jamiahPublicId,
                                          String callerUid,
                                          String returnUrl,
                                          String refreshUrl,
                                          boolean createDashboardSession) {
        Jamiah jamiah = resolveJamiah(jamiahPublicId);
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        UserProfile member = ensureMembership(callerUid, jamiahWithMembers);
        JamiahWallet wallet = walletRepository
                .findByJamiah_IdAndMember_Id(jamiahWithMembers.getId(), member.getId())
                .orElseGet(() -> walletRepository.save(createWalletEntity(jamiahWithMembers, member)));
        Account account = ensureStripeAccount(wallet, jamiahWithMembers, member);
        return buildStatus(jamiahWithMembers, member, wallet, account, returnUrl, refreshUrl, createDashboardSession);
    }

    private Jamiah resolveJamiah(String publicId) {
        if (publicId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jamiah id required");
        }
        UUID uuid = null;
        try {
            uuid = UUID.fromString(publicId);
        } catch (IllegalArgumentException ignored) {
        }
        return (uuid != null ? jamiahRepository.findByPublicId(uuid) : Optional.<Jamiah>empty())
                .or(() -> jamiahRepository.findByLegacyPublicId(publicId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private UserProfile ensureMembership(String uid, Jamiah jamiah) {
        UserProfile member = userRepository.findByUid(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean isOwner = jamiah.getOwnerId() != null && jamiah.getOwnerId().equals(uid);
        boolean isMember = jamiah.getMembers().stream().anyMatch(profile -> uid.equals(profile.getUid()));
        if (!isOwner && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (member.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member profile incomplete");
        }
        return member;
    }

    private JamiahWallet createWalletEntity(Jamiah jamiah, UserProfile member) {
        JamiahWallet wallet = new JamiahWallet();
        wallet.setJamiah(jamiah);
        wallet.setMember(member);
        wallet.setBalance(ZERO);
        wallet.setReservedBalance(ZERO);
        wallet.setLockedForPayments(false);
        wallet.setLockedForPayouts(false);
        return wallet;
    }

    private JamiahWallet lock(Jamiah jamiah, UserProfile member) {
        JamiahWalletId id = new JamiahWalletId(jamiah.getId(), member.getId());
        JamiahWallet wallet = entityManager.find(JamiahWallet.class, id, LockModeType.PESSIMISTIC_WRITE);
        if (wallet == null) {
            wallet = createWalletEntity(jamiah, member);
            wallet.setId(id);
            entityManager.persist(wallet);
            entityManager.flush();
            entityManager.lock(wallet, LockModeType.PESSIMISTIC_WRITE);
        } else {
            wallet.setJamiah(jamiah);
            wallet.setMember(member);
            if (wallet.getReservedBalance() == null) {
                wallet.setReservedBalance(ZERO);
            }
            if (wallet.getLockedForPayments() == null) {
                wallet.setLockedForPayments(false);
            }
            if (wallet.getLockedForPayouts() == null) {
                wallet.setLockedForPayouts(false);
            }
        }
        return wallet;
    }

    private void ensureWalletAvailability(JamiahWallet wallet, BigDecimal amount) {
        BigDecimal balance = Optional.ofNullable(wallet.getBalance()).orElse(ZERO);
        BigDecimal reserved = Optional.ofNullable(wallet.getReservedBalance()).orElse(ZERO);
        BigDecimal available = balance.subtract(reserved);
        if (available.compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED,
                    "Wallet top-up required before confirming payment");
        }
    }

    private Account ensureStripeAccount(JamiahWallet wallet, Jamiah jamiah, UserProfile member) {
        String walletAccountId = normalize(wallet.getStripeAccountId());
        String jamiahAccountId = normalize(jamiah.getStripeAccountId());
        boolean walletUpdated = false;
        if (!stripePaymentProvider.isConfigured()) {
            if (jamiahAccountId != null && !jamiahAccountId.equals(walletAccountId)) {
                wallet.setStripeAccountId(jamiahAccountId);
                walletUpdated = true;
            }
            if (walletUpdated) {
                walletRepository.save(wallet);
            }
            return null;
        }
        if (jamiahAccountId != null) {
            if (!jamiahAccountId.equals(walletAccountId)) {
                wallet.setStripeAccountId(jamiahAccountId);
                walletUpdated = true;
            }
            try {
                Account account = stripePaymentProvider.retrieveAccount(jamiahAccountId);
                stripeAccountStatusUpdater.applyAccountState(jamiah, account, List.of(wallet));
                return account;
            } catch (StripeException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
            }
        }
        Map<String, Object> params = new HashMap<>();
        params.put("type", "express");
        Map<String, Object> capabilities = new HashMap<>();
        Map<String, Object> transfers = new HashMap<>();
        transfers.put("requested", true);
        capabilities.put("transfers", transfers);
        params.put("capabilities", capabilities);
        Map<String, String> metadata = new HashMap<>();
        metadata.put("jamiahId", jamiah.getId().toString());
        if (jamiah.getPublicId() != null) {
            metadata.put("jamiahPublicId", jamiah.getPublicId().toString());
        }
        metadata.put("memberId", member.getId().toString());
        metadata.put("memberUid", member.getUid());
        params.put("metadata", metadata);
        Map<String, Object> businessProfile = new HashMap<>();
        if (jamiah.getName() != null && !jamiah.getName().isBlank()) {
            businessProfile.put("name", jamiah.getName());
        } else if (member.getUsername() != null && !member.getUsername().isBlank()) {
            businessProfile.put("name", member.getUsername());
        }
        if (!businessProfile.isEmpty()) {
            params.put("business_profile", businessProfile);
        }
        try {
            Account account = stripePaymentProvider.createAccount(params);
            String accountId = account.getId();
            jamiah.setStripeAccountId(accountId);
            wallet.setStripeAccountId(accountId);
            stripeAccountStatusUpdater.applyAccountState(jamiah, account, List.of(wallet));
            return account;
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }
    }

    private WalletStatusResponse buildStatus(Jamiah jamiah,
                                             UserProfile member,
                                             JamiahWallet wallet,
                                             Account account,
                                             String returnUrl,
                                             String refreshUrl,
                                             boolean createDashboardSession) {
        WalletStatusResponse response = new WalletStatusResponse();
        response.setJamiahId(jamiah.getId());
        response.setJamiahPublicId(jamiah.getPublicId() != null ? jamiah.getPublicId().toString() : null);
        response.setMemberId(member.getId());
        response.setMemberUid(member.getUid());
        response.setBalance(Optional.ofNullable(wallet.getBalance()).orElse(ZERO));
        response.setReservedBalance(Optional.ofNullable(wallet.getReservedBalance()).orElse(ZERO));
        response.setUpdatedAt(wallet.getUpdatedAt());
        response.setPublishableKey(publishableKey);

        String effectiveReturnUrl = resolveReturnUrl(returnUrl);
        String effectiveRefreshUrl = resolveRefreshUrl(refreshUrl);

        String accountId = normalize(wallet.getStripeAccountId());
        if (accountId == null) {
            accountId = normalize(jamiah.getStripeAccountId());
            if (accountId != null) {
                wallet.setStripeAccountId(accountId);
            }
        }
        response.setStripeAccountId(accountId);
        response.setKycStatus(wallet.getKycStatus());
        response.setStripeSandboxId(stripePaymentProvider.getSandboxId());
        boolean manualPaymentsLock = Boolean.TRUE.equals(wallet.getLockedForPayments());
        boolean manualPayoutsLock = Boolean.TRUE.equals(wallet.getLockedForPayouts());
        boolean stripePayoutsLock = Boolean.TRUE.equals(jamiah.getStripeAccountPayoutsLocked());
        response.setLockedForPayments(manualPaymentsLock);
        response.setLockedForPayouts(manualPayoutsLock || stripePayoutsLock);
        response.setStripeChargesEnabled(jamiah.getStripeAccountChargesEnabled());
        response.setStripePayoutsEnabled(jamiah.getStripeAccountPayoutsEnabled());
        response.setStripeDisabledReason(jamiah.getStripeAccountDisabledReason());

        Account effectiveAccount = account;
        if (effectiveAccount == null && accountId != null && stripePaymentProvider.isConfigured()) {
            try {
                effectiveAccount = stripePaymentProvider.retrieveAccount(accountId);
                stripeAccountStatusUpdater.applyAccountState(jamiah, effectiveAccount, List.of(wallet));
                response.setKycStatus(wallet.getKycStatus());
                response.setLockedForPayments(Boolean.TRUE.equals(wallet.getLockedForPayments()));
                response.setLockedForPayouts(Boolean.TRUE.equals(wallet.getLockedForPayouts())
                        || Boolean.TRUE.equals(jamiah.getStripeAccountPayoutsLocked()));
                response.setStripeChargesEnabled(jamiah.getStripeAccountChargesEnabled());
                response.setStripePayoutsEnabled(jamiah.getStripeAccountPayoutsEnabled());
                response.setStripeDisabledReason(jamiah.getStripeAccountDisabledReason());
            } catch (StripeException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
            }
        }

        boolean requiresOnboarding = accountId == null;
        if (effectiveAccount != null) {
            boolean detailsSubmitted = Boolean.TRUE.equals(effectiveAccount.getDetailsSubmitted());
            requiresOnboarding = !detailsSubmitted;
            if (requiresOnboarding && effectiveRefreshUrl != null && effectiveReturnUrl != null) {
                Map<String, Object> params = new HashMap<>();
                params.put("account", effectiveAccount.getId());
                params.put("refresh_url", effectiveRefreshUrl);
                params.put("return_url", effectiveReturnUrl);
                params.put("type", "account_onboarding");
                try {
                    AccountLink link = stripePaymentProvider.createAccountLink(params);
                    response.setOnboardingUrl(link.getUrl());
                } catch (StripeException ex) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
                }
            }
            if (createDashboardSession) {
                Map<String, Object> components = new HashMap<>();
                components.put("account_management", Map.of("enabled", true));
                components.put("payments", Map.of("enabled", true));
                Map<String, Object> sessionParams = new HashMap<>();
                sessionParams.put("account", effectiveAccount.getId());
                sessionParams.put("components", components);
                try {
                    AccountSession session = stripePaymentProvider.createAccountSession(sessionParams);
                    response.setAccountSessionClientSecret(session.getClientSecret());
                } catch (StripeException ex) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
                }
            }
        }
        response.setRequiresOnboarding(requiresOnboarding);
        return response;
    }

    private String resolveReturnUrl(String override) {
        String normalized = normalizeUrl(override);
        return normalized != null ? normalized : defaultAccountReturnUrl;
    }

    private String resolveRefreshUrl(String override) {
        String normalized = normalizeUrl(override);
        return normalized != null ? normalized : defaultAccountRefreshUrl;
    }

    private String normalizeUrl(String url) {
        return normalize(url);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private long toStripeAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }
}
