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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class WalletService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final String DEFAULT_CURRENCY = "eur";

    private final JamiahRepository jamiahRepository;
    private final JamiahWalletRepository walletRepository;
    private final UserProfileRepository userRepository;
    private final StripePaymentProvider stripePaymentProvider;

    @PersistenceContext
    private EntityManager entityManager;

    public WalletService(JamiahRepository jamiahRepository,
                         JamiahWalletRepository walletRepository,
                         UserProfileRepository userRepository,
                         StripePaymentProvider stripePaymentProvider) {
        this.jamiahRepository = jamiahRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.stripePaymentProvider = stripePaymentProvider;
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
        if (balance.compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }
        if (wallet.getStripeAccountId() == null || wallet.getStripeAccountId().isBlank()) {
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
        }
        return wallet;
    }

    private Account ensureStripeAccount(JamiahWallet wallet, Jamiah jamiah, UserProfile member) {
        if (wallet.getStripeAccountId() != null && !wallet.getStripeAccountId().isBlank()) {
            try {
                return stripePaymentProvider.retrieveAccount(wallet.getStripeAccountId());
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
        metadata.put("memberId", member.getId().toString());
        params.put("metadata", metadata);
        if (member.getUsername() != null) {
            params.put("business_profile", Map.of("name", member.getUsername()));
        }
        try {
            Account account = stripePaymentProvider.createAccount(params);
            wallet.setStripeAccountId(account.getId());
            wallet.setKycStatus(Boolean.TRUE.equals(account.getDetailsSubmitted()) ? "verified" : "pending");
            walletRepository.save(wallet);
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
        response.setUpdatedAt(wallet.getUpdatedAt());
        response.setStripeAccountId(wallet.getStripeAccountId());
        response.setKycStatus(wallet.getKycStatus());
        response.setStripeSandboxId(stripePaymentProvider.getSandboxId());

        Account effectiveAccount = account;
        if (effectiveAccount == null && wallet.getStripeAccountId() != null) {
            try {
                effectiveAccount = stripePaymentProvider.retrieveAccount(wallet.getStripeAccountId());
            } catch (StripeException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
            }
        }

        boolean requiresOnboarding = false;
        if (effectiveAccount != null) {
            boolean detailsSubmitted = Boolean.TRUE.equals(effectiveAccount.getDetailsSubmitted());
            requiresOnboarding = !detailsSubmitted;
            String status = detailsSubmitted ? "verified" : "pending";
            if (!Objects.equals(status, wallet.getKycStatus())) {
                wallet.setKycStatus(status);
                walletRepository.save(wallet);
                response.setKycStatus(status);
            }
            if (requiresOnboarding && refreshUrl != null && returnUrl != null) {
                Map<String, Object> params = new HashMap<>();
                params.put("account", effectiveAccount.getId());
                params.put("refresh_url", refreshUrl);
                params.put("return_url", returnUrl);
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
        } else {
            requiresOnboarding = true;
        }
        response.setRequiresOnboarding(requiresOnboarding);
        return response;
    }

    private long toStripeAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }
}
