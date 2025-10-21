package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.CycleSummaryDto;
import com.example.backend.jamiah.dto.PaymentConfirmationDto;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.jamiah.dto.RoundDto;
import com.example.backend.jamiah.dto.WalletDto;
import com.example.backend.payment.StripePaymentProvider;
import com.example.backend.wallet.Wallet;
import com.example.backend.wallet.WalletRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService {
    private static final String STRIPE_SUCCESS_STATUS = "succeeded";
    private static final String DEFAULT_CURRENCY = "eur";

    private final JamiahPaymentRepository paymentRepository;
    private final JamiahCycleRepository cycleRepository;
    private final JamiahRepository jamiahRepository;
    private final UserProfileRepository userRepository;
    private final StripePaymentProvider stripePaymentProvider;
    private final WalletRepository walletRepository;
    private final String publishableKey;

    public PaymentService(JamiahPaymentRepository paymentRepository,
                          JamiahCycleRepository cycleRepository,
                          JamiahRepository jamiahRepository,
                          UserProfileRepository userRepository,
                          StripePaymentProvider stripePaymentProvider,
                          WalletRepository walletRepository,
                          @Value("${stripe.publishable-key:}") String publishableKey) {
        this.paymentRepository = paymentRepository;
        this.cycleRepository = cycleRepository;
        this.jamiahRepository = jamiahRepository;
        this.userRepository = userRepository;
        this.stripePaymentProvider = stripePaymentProvider;
        this.walletRepository = walletRepository;
        this.publishableKey = publishableKey;
    }

    public RoundDto getRound(String jamiahPublicId, Long cycleId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiah = ensureMatchesPublicId(cycle.getJamiah().getId(), jamiahPublicId);
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        ensureMembership(callerUid, jamiahWithMembers);
        List<JamiahPayment> payments = ensurePaymentsForCycle(jamiahWithMembers, cycle);
        Map<String, UserProfile> users = loadUsers(payments, cycle);
        return buildRoundDto(cycle, jamiahWithMembers, payments, users);
    }

    public PaymentDto initiatePayment(Long paymentId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!callerUid.equals(payment.getPayerUid())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(payment.getCycleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (cycle.getRecipient() != null && callerUid.equals(cycle.getRecipient().getUid())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient can't pay in own round");
        }
        Jamiah jamiah = jamiahRepository.findById(cycle.getJamiah().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        ensureMembership(callerUid, jamiahWithMembers);
        BigDecimal expectedAmount = requireRateAmount(jamiahWithMembers);

        PaymentIntent paymentIntent;
        try {
            if (payment.getStripePaymentIntentId() != null) {
                paymentIntent = stripePaymentProvider.retrievePaymentIntent(payment.getStripePaymentIntentId());
                Long stripeAmount = paymentIntent.getAmount();
                long expectedStripeAmount = toStripeAmount(expectedAmount);
                if (stripeAmount == null || stripeAmount != expectedStripeAmount) {
                    Map<String, Object> params = new HashMap<>();
                    params.put("amount", expectedStripeAmount);
                    paymentIntent = stripePaymentProvider.updatePaymentIntent(payment.getStripePaymentIntentId(), params);
                }
            } else {
                Map<String, Object> params = new HashMap<>();
                params.put("amount", toStripeAmount(expectedAmount));
                params.put("currency", DEFAULT_CURRENCY);
                Map<String, Object> automatic = new HashMap<>();
                automatic.put("enabled", true);
                params.put("automatic_payment_methods", automatic);
                Map<String, String> metadata = new HashMap<>();
                metadata.put("jamiahId", jamiah.getId().toString());
                metadata.put("cycleId", cycle.getId().toString());
                metadata.put("payerUid", callerUid);
                params.put("metadata", metadata);
                if (jamiah.getName() != null) {
                    params.put("description", String.format("Jamiah %s – Runde %d", jamiah.getName(), cycle.getCycleNumber()));
                }
                paymentIntent = stripePaymentProvider.createPaymentIntent(params);
                payment.setStripePaymentIntentId(paymentIntent.getId());
                payment.setAmount(expectedAmount);
                paymentRepository.save(payment);
            }
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }

        if (payment.getAmount() == null || payment.getAmount().compareTo(expectedAmount) != 0) {
            payment.setAmount(expectedAmount);
            paymentRepository.save(payment);
        }
        UserProfile payer = userRepository.findByUid(payment.getPayerUid()).orElse(null);
        PaymentDto dto = toDto(payment, payer, expectedAmount);
        dto.setStripePaymentIntentId(paymentIntent.getId());
        dto.setClientSecret(paymentIntent.getClientSecret());
        dto.setPublishableKey(publishableKey);
        return dto;
    }

    public PaymentDto confirmPayment(String jamiahPublicId,
                                     Long cycleId,
                                     String payerUid,
                                     BigDecimal amount,
                                     String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (payerUid == null || amount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (!Objects.equals(payerUid, callerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiah = ensureMatchesPublicId(cycle.getJamiah().getId(), jamiahPublicId);
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        ensureMembership(callerUid, jamiahWithMembers);

        if (cycle.getRecipient() != null && callerUid.equals(cycle.getRecipient().getUid())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient can't pay in own round");
        }

        BigDecimal expectedAmount = requireRateAmount(jamiahWithMembers);
        if (amount.compareTo(expectedAmount) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount mismatch");
        }

        List<JamiahPayment> payments = ensurePaymentsForCycle(jamiahWithMembers, cycle);
        JamiahPayment payment = payments.stream()
                .filter(p -> Objects.equals(payerUid, p.getPayerUid()))
                .findFirst()
                .orElseGet(() -> {
                    JamiahPayment created = new JamiahPayment();
                    created.setJamiahId(jamiahWithMembers.getId());
                    created.setCycleId(cycle.getId());
                    created.setPayerUid(payerUid);
                    return created;
                });

        if (Boolean.TRUE.equals(payment.getConfirmed())) {
            if (payment.getAmount() != null && payment.getAmount().compareTo(expectedAmount) == 0) {
                UserProfile payer = userRepository.findByUid(payerUid).orElse(null);
                return toDto(payment, payer, expectedAmount);
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment already confirmed with different amount");
        }

        payment.setJamiahId(jamiahWithMembers.getId());
        payment.setCycleId(cycle.getId());
        payment.setPayerUid(payerUid);
        payment.setAmount(expectedAmount);
        payment.setConfirmed(true);
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(Instant.now());
        }
        payment = paymentRepository.save(payment);

        UserProfile payer = userRepository.findByUid(payerUid).orElse(null);
        return toDto(payment, payer, expectedAmount);
    }

    public PaymentConfirmationDto confirmPayment(Long paymentId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!callerUid.equals(payment.getPayerUid())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(payment.getCycleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (cycle.getRecipient() != null && callerUid.equals(cycle.getRecipient().getUid())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient can't pay in own round");
        }
        Jamiah jamiah = jamiahRepository.findById(cycle.getJamiah().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        ensureMembership(callerUid, jamiahWithMembers);
        BigDecimal expectedAmount = requireRateAmount(jamiahWithMembers);
        if (payment.getStripePaymentIntentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment has not been initiated");
        }

        PaymentIntent paymentIntent;
        try {
            paymentIntent = stripePaymentProvider.retrievePaymentIntent(payment.getStripePaymentIntentId());
        } catch (StripeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }
        if (!STRIPE_SUCCESS_STATUS.equalsIgnoreCase(paymentIntent.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PaymentIntent not completed");
        }
        Long stripeAmount = paymentIntent.getAmount();
        if (stripeAmount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe amount missing");
        }
        BigDecimal settledAmount = fromStripeAmount(stripeAmount);
        if (expectedAmount.compareTo(settledAmount) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount mismatch");
        }
        if (paymentIntent.getCurrency() != null && !DEFAULT_CURRENCY.equalsIgnoreCase(paymentIntent.getCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported currency");
        }

        if (!Boolean.TRUE.equals(payment.getConfirmed())) {
            payment.setAmount(expectedAmount);
            payment.setConfirmed(true);
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);
        }
        UserProfile payer = userRepository.findByUid(callerUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Wallet wallet = walletRepository.findById(payer.getId()).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setMemberId(payer.getId());
            w.setMember(payer);
            w.setBalance(BigDecimal.ZERO);
            return w;
        });
        wallet.setMember(payer);
        BigDecimal current = wallet.getBalance() == null ? BigDecimal.ZERO : wallet.getBalance();
        wallet.setBalance(current.add(expectedAmount));
        wallet = walletRepository.save(wallet);

        PaymentConfirmationDto confirmation = new PaymentConfirmationDto();
        confirmation.setPayment(toDto(payment, payer, expectedAmount));
        confirmation.setWallet(toWalletDto(wallet, payer));
        return confirmation;
    }

    public RoundDto confirmReceipt(String jamiahPublicId,
                                   Long cycleId,
                                   Long paymentId,
                                   String uid,
                                   String callerUid) {
        String effectiveUid = callerUid != null ? callerUid : uid;
        if (effectiveUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (uid != null && callerUid != null && !Objects.equals(uid, callerUid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caller mismatch");
        }

        JamiahPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!Objects.equals(payment.getCycleId(), cycleId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment does not belong to cycle");
        }

        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiah = ensureMatchesPublicId(cycle.getJamiah().getId(), jamiahPublicId);
        if (!Objects.equals(payment.getJamiahId(), jamiah.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment does not belong to jamiah");
        }

        return confirmReceipt(jamiahPublicId, cycleId, effectiveUid);
    }

    public RoundDto confirmReceipt(String jamiahPublicId, Long cycleId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiah = ensureMatchesPublicId(cycle.getJamiah().getId(), jamiahPublicId);
        if (cycle.getRecipient() == null || cycle.getRecipient().getUid() == null ||
                !cycle.getRecipient().getUid().equals(callerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        List<JamiahPayment> payments = ensurePaymentsForCycle(jamiahWithMembers, cycle);
        boolean allPaid = payments.stream().allMatch(p -> Boolean.TRUE.equals(p.getConfirmed()));
        if (!allPaid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not all payments have been confirmed");
        }
        Instant now = Instant.now();
        payments.forEach(payment -> {
            payment.setRecipientConfirmed(true);
            payment.setRecipientConfirmedAt(now);
        });
        paymentRepository.saveAll(payments);
        cycle.setRecipientConfirmed(true);
        cycle.setCompleted(true);
        cycleRepository.save(cycle);
        startNextRoundIfNeeded(cycle);
        Map<String, UserProfile> users = loadUsers(payments, cycle);
        return buildRoundDto(cycle, jamiahWithMembers, payments, users);
    }

    public List<PaymentDto> getPayments(String jamiahPublicId, Long cycleId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Jamiah jamiah = ensureMatchesPublicId(cycle.getJamiah().getId(), jamiahPublicId);
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        ensureMembership(callerUid, jamiahWithMembers);

        List<JamiahPayment> payments = ensurePaymentsForCycle(jamiahWithMembers, cycle);
        Map<String, UserProfile> users = loadUsers(payments, cycle);
        BigDecimal expectedAmount = requireRateAmount(jamiahWithMembers);

        boolean isOwner = jamiah.getOwnerId() != null && jamiah.getOwnerId().equals(callerUid);
        boolean isRecipient = cycle.getRecipient() != null && callerUid.equals(cycle.getRecipient().getUid());

        List<String> order = cycle.getMemberOrder() != null ? cycle.getMemberOrder() : java.util.Collections.emptyList();
        Map<String, Integer> orderIndex = new HashMap<>();
        for (int i = 0; i < order.size(); i++) {
            orderIndex.putIfAbsent(order.get(i), i);
        }

        return payments.stream()
                .filter(payment -> isOwner || isRecipient || callerUid.equals(payment.getPayerUid()))
                .sorted(Comparator.comparingInt(payment -> orderIndex.getOrDefault(payment.getPayerUid(), Integer.MAX_VALUE)))
                .map(payment -> toDto(payment, users.get(payment.getPayerUid()), expectedAmount))
                .collect(Collectors.toList());
    }

    public List<WalletDto> getWallets(String jamiahPublicId, String callerUid) {
        if (callerUid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Jamiah jamiah = findJamiahByPublicId(jamiahPublicId);
        Jamiah jamiahWithMembers = jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
        boolean isOwner = jamiah.getOwnerId() != null && jamiah.getOwnerId().equals(callerUid);
        Optional<UserProfile> callerProfile = jamiahWithMembers.getMembers().stream()
                .filter(member -> callerUid.equals(member.getUid())).findFirst();
        if (!isOwner && callerProfile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!isOwner) {
            Wallet wallet = callerProfile.map(member -> walletRepository.findById(member.getId()).orElseGet(() -> {
                Wallet w = new Wallet();
                w.setMemberId(member.getId());
                w.setMember(member);
                w.setBalance(BigDecimal.ZERO);
                return w;
            })).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            WalletDto dto = toWalletDto(wallet, callerProfile.get());
            return java.util.List.of(dto);
        }
        List<UserProfile> members = new ArrayList<>(jamiahWithMembers.getMembers());
        if (members.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        List<Long> memberIds = members.stream()
                .map(UserProfile::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<Long, Wallet> wallets = walletRepository.findByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(Wallet::getMemberId, wallet -> wallet));
        List<WalletDto> dtos = new ArrayList<>();
        for (UserProfile member : members) {
            Wallet wallet = wallets.get(member.getId());
            if (wallet == null) {
                wallet = new Wallet();
                wallet.setMemberId(member.getId());
                wallet.setMember(member);
                wallet.setBalance(BigDecimal.ZERO);
            }
            dtos.add(toWalletDto(wallet, member));
        }
        dtos.sort(Comparator.comparing(WalletDto::getUsername, Comparator.nullsLast(String::compareToIgnoreCase)));
        return dtos;
    }

    public List<CycleSummaryDto> getCycleSummaries(String jamiahPublicId, String callerUid) {
        UUID uuid = null;
        try {
            uuid = UUID.fromString(jamiahPublicId);
        } catch (IllegalArgumentException ignored) {
        }
        Jamiah jamiah = (uuid != null ? jamiahRepository.findByPublicId(uuid) : Optional.<Jamiah>empty())
                .or(() -> jamiahRepository.findByLegacyPublicId(jamiahPublicId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (jamiah.getOwnerId() == null || !jamiah.getOwnerId().equals(callerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        List<JamiahCycle> cycles = cycleRepository.findByJamiahId(jamiah.getId());
        return cycles.stream()
                .sorted(Comparator.comparing(JamiahCycle::getCycleNumber))
                .map(cycle -> {
                    String recipientUid = cycle.getRecipient() != null ? cycle.getRecipient().getUid() : null;
                    long totalPayers = cycle.getMemberOrder() != null && !cycle.getMemberOrder().isEmpty()
                            ? cycle.getMemberOrder().stream().filter(uid -> !Objects.equals(uid, recipientUid)).count()
                            : jamiahRepository.countMembers(jamiah.getId()) - (recipientUid != null ? 1 : 0);
                    List<JamiahPayment> payments = paymentRepository
                            .findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId());
                    long paidCount = payments.stream()
                            .filter(p -> Boolean.TRUE.equals(p.getConfirmed()) && !Objects.equals(p.getPayerUid(), recipientUid))
                            .count();
                    long receiptCount = payments.stream()
                            .filter(p -> Boolean.TRUE.equals(p.getRecipientConfirmed()) && !Objects.equals(p.getPayerUid(), recipientUid))
                            .count();
                    CycleSummaryDto dto = new CycleSummaryDto();
                    dto.setId(cycle.getId());
                    dto.setCycleNumber(cycle.getCycleNumber());
                    dto.setStartDate(cycle.getStartDate());
                    dto.setCompleted(Boolean.TRUE.equals(cycle.getCompleted()));
                    dto.setRecipientUid(recipientUid);
                    dto.setTotalPayers((int) totalPayers);
                    dto.setPaidCount((int) paidCount);
                    dto.setReceiptCount((int) receiptCount);
                    return dto;
                }).collect(Collectors.toList());
    }

    private BigDecimal requireRateAmount(Jamiah jamiah) {
        if (jamiah.getRateAmount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rate not configured");
        }
        return jamiah.getRateAmount();
    }

    private RoundDto buildRoundDto(JamiahCycle cycle,
                                   Jamiah jamiah,
                                   List<JamiahPayment> payments,
                                   Map<String, UserProfile> users) {
        RoundDto dto = new RoundDto();
        dto.setId(cycle.getId());
        dto.setCycleNumber(cycle.getCycleNumber());
        dto.setStartDate(cycle.getStartDate());
        dto.setCompleted(Boolean.TRUE.equals(cycle.getCompleted()));
        dto.setReceiptConfirmed(Boolean.TRUE.equals(cycle.getRecipientConfirmed()));
        dto.setExpectedAmount(jamiah.getRateAmount());
        RoundDto.Recipient recipientDto = new RoundDto.Recipient();
        if (cycle.getRecipient() != null) {
            String recipientUid = cycle.getRecipient().getUid();
            recipientDto.setUid(recipientUid);
            UserProfile profile = users.getOrDefault(recipientUid, cycle.getRecipient());
            if (profile != null) {
                recipientDto.setUsername(profile.getUsername());
                recipientDto.setFirstName(profile.getFirstName());
                recipientDto.setLastName(profile.getLastName());
            }
        }
        dto.setRecipient(recipientDto);
        List<String> order = cycle.getMemberOrder() != null ? cycle.getMemberOrder() : java.util.Collections.emptyList();
        Map<String, Integer> orderIndex = new HashMap<>();
        for (int i = 0; i < order.size(); i++) {
            orderIndex.putIfAbsent(order.get(i), i);
        }
        payments.sort(Comparator.comparingInt(payment -> orderIndex.getOrDefault(payment.getPayerUid(), Integer.MAX_VALUE)));
        List<PaymentDto> paymentDtos = payments.stream()
                .map(payment -> toDto(payment, users.get(payment.getPayerUid()), jamiah.getRateAmount()))
                .collect(Collectors.toList());
        dto.setPayments(paymentDtos);
        dto.setAllPaid(paymentDtos.stream().allMatch(paymentDto ->
                paymentDto.getStatus() == PaymentDto.PaymentStatus.PAID_SELF_CONFIRMED
                        || paymentDto.getStatus() == PaymentDto.PaymentStatus.RECEIPT_CONFIRMED));
        return dto;
    }

    private Map<String, UserProfile> loadUsers(List<JamiahPayment> payments, JamiahCycle cycle) {
        Set<String> uids = payments.stream()
                .map(JamiahPayment::getPayerUid)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        if (cycle.getRecipient() != null && cycle.getRecipient().getUid() != null) {
            uids.add(cycle.getRecipient().getUid());
        }
        if (uids.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return userRepository.findByUidIn(uids).stream()
                .collect(Collectors.toMap(UserProfile::getUid, profile -> profile));
    }

    private PaymentDto toDto(JamiahPayment payment, UserProfile user, BigDecimal defaultAmount) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        PaymentDto.UserRef ref = new PaymentDto.UserRef();
        ref.setUid(payment.getPayerUid());
        if (user != null) {
            ref.setUsername(user.getUsername());
            ref.setFirstName(user.getFirstName());
            ref.setLastName(user.getLastName());
        }
        dto.setUser(ref);
        dto.setPaidAt(payment.getPaidAt());
        dto.setRecipientConfirmedAt(payment.getRecipientConfirmedAt());
        dto.setAmount(payment.getAmount() != null ? payment.getAmount() : defaultAmount);
        dto.setStripePaymentIntentId(payment.getStripePaymentIntentId());
        PaymentDto.PaymentStatus status = PaymentDto.PaymentStatus.UNPAID;
        if (Boolean.TRUE.equals(payment.getRecipientConfirmed())) {
            status = PaymentDto.PaymentStatus.RECEIPT_CONFIRMED;
        } else if (Boolean.TRUE.equals(payment.getConfirmed())) {
            status = PaymentDto.PaymentStatus.PAID_SELF_CONFIRMED;
        } else if (payment.getStripePaymentIntentId() != null) {
            status = PaymentDto.PaymentStatus.INITIATED;
        }
        dto.setStatus(status);
        dto.setClientSecret(null);
        dto.setPublishableKey(null);
        return dto;
    }

    private WalletDto toWalletDto(Wallet wallet, UserProfile member) {
        WalletDto dto = new WalletDto();
        dto.setMemberId(member.getUid());
        dto.setUsername(member.getUsername());
        dto.setBalance(wallet.getBalance() == null ? BigDecimal.ZERO : wallet.getBalance());
        dto.setLastUpdated(wallet.getUpdatedAt());
        return dto;
    }

    private List<JamiahPayment> ensurePaymentsForCycle(Jamiah jamiah, JamiahCycle cycle) {
        List<JamiahPayment> payments = paymentRepository
                .findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId());
        Map<String, JamiahPayment> byUid = payments.stream()
                .collect(Collectors.toMap(JamiahPayment::getPayerUid, payment -> payment, (existing, replacement) -> existing));
        String recipientUid = cycle.getRecipient() != null ? cycle.getRecipient().getUid() : null;
        List<String> order = cycle.getMemberOrder();
        List<String> payerUids = new ArrayList<>();
        if (order != null && !order.isEmpty()) {
            payerUids.addAll(order);
        } else {
            payerUids.addAll(jamiah.getMembers().stream()
                    .map(UserProfile::getUid)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }
        List<String> uniquePayers = payerUids.stream()
                .filter(Objects::nonNull)
                .filter(uid -> !Objects.equals(uid, recipientUid))
                .distinct()
                .collect(Collectors.toList());
        boolean created = false;
        for (String uid : uniquePayers) {
            if (!byUid.containsKey(uid)) {
                JamiahPayment newPayment = new JamiahPayment();
                newPayment.setJamiahId(jamiah.getId());
                newPayment.setCycleId(cycle.getId());
                newPayment.setPayerUid(uid);
                newPayment.setAmount(jamiah.getRateAmount());
                paymentRepository.save(newPayment);
                byUid.put(uid, newPayment);
                created = true;
            }
        }
        if (created) {
            payments = paymentRepository.findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId());
        }
        return payments;
    }

    private void ensureMembership(String uid, Jamiah jamiah) {
        boolean isOwner = jamiah.getOwnerId() != null && jamiah.getOwnerId().equals(uid);
        boolean isMember = jamiah.getMembers().stream().anyMatch(member -> uid.equals(member.getUid()));
        if (!isOwner && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private Jamiah ensureMatchesPublicId(Long jamiahId, String publicId) {
        Jamiah jamiah = findJamiahByPublicId(publicId);
        if (!jamiah.getId().equals(jamiahId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        return jamiah;
    }

    private Jamiah findJamiahByPublicId(String publicId) {
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

    private void startNextRoundIfNeeded(JamiahCycle current) {
        List<String> order = current.getMemberOrder();
        if (order == null || current.getRecipient() == null) {
            return;
        }
        int idx = order.indexOf(current.getRecipient().getUid());
        if (idx >= 0 && idx < order.size() - 1) {
            JamiahCycle next = new JamiahCycle();
            next.setJamiah(current.getJamiah());
            next.setCycleNumber(current.getCycleNumber() + 1);
            java.time.LocalDate nextStart = current.getStartDate();
            if (current.getJamiah().getRateInterval() == RateInterval.MONTHLY) {
                nextStart = nextStart.plusMonths(1);
            } else {
                nextStart = nextStart.plusWeeks(1);
            }
            next.setStartDate(nextStart);
            next.setCompleted(false);
            next.setMemberOrder(order);
            String nextUid = order.get(idx + 1);
            UserProfile nextUser = userRepository.findByUid(nextUid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            next.setRecipient(nextUser);
            cycleRepository.save(next);
        }
    }

    private long toStripeAmount(BigDecimal amount) {
        try {
            return amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount precision");
        }
    }

    private BigDecimal fromStripeAmount(Long amount) {
        return BigDecimal.valueOf(amount).movePointLeft(2);
    }
}
