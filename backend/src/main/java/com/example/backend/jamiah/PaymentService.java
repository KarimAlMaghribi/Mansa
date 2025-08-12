package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.jamiah.dto.CycleSummaryDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService {
    private final JamiahPaymentRepository paymentRepository;
    private final JamiahCycleRepository cycleRepository;
    private final JamiahRepository jamiahRepository;
    private final UserProfileRepository userRepository;

    public PaymentService(JamiahPaymentRepository paymentRepository,
                          JamiahCycleRepository cycleRepository,
                          JamiahRepository jamiahRepository,
                          UserProfileRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.cycleRepository = cycleRepository;
        this.jamiahRepository = jamiahRepository;
        this.userRepository = userRepository;
    }

    public PaymentDto confirmPayment(String jamiahPublicId,
                                     Long cycleId,
                                     String payerUid,
                                     BigDecimal amount,
                                     String callerUid) {
        if (callerUid == null || !callerUid.equals(payerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Long jamiahId = cycle.getJamiah().getId();
        // verify jamiah id matches path
        if (!matchesPublicId(jamiahId, jamiahPublicId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        // recipient does not pay in own round
        if (cycle.getRecipient() != null && payerUid.equals(cycle.getRecipient().getUid())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient can't pay in own round");
        }
        userRepository.findByUid(payerUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Optional<JamiahPayment> existing = paymentRepository
                .findByJamiahIdAndCycleIdAndPayerUid(jamiahId, cycleId, payerUid);
        JamiahPayment payment;
        if (existing.isPresent()) {
            payment = existing.get();
            if (Boolean.FALSE.equals(payment.getConfirmed())) {
                payment.setAmount(amount);
                payment.setConfirmed(true);
                payment.setPaidAt(Instant.now());
                paymentRepository.save(payment);
            }
            return toDto(payment);
        }
        payment = new JamiahPayment();
        payment.setJamiahId(jamiahId);
        payment.setCycleId(cycleId);
        payment.setPayerUid(payerUid);
        payment.setAmount(amount);
        payment.setConfirmed(true);
        payment.setPaidAt(Instant.now());
        JamiahPayment saved = paymentRepository.save(payment);
        return toDto(saved);
    }

    public PaymentDto confirmReceipt(String jamiahPublicId,
                                     Long cycleId,
                                     Long paymentId,
                                     String recipientUid,
                                     String callerUid) {
        if (callerUid == null || !callerUid.equals(recipientUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (cycle.getRecipient() == null || cycle.getRecipient().getUid() == null ||
                !cycle.getRecipient().getUid().equals(callerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        Long jamiahId = cycle.getJamiah().getId();
        if (!matchesPublicId(jamiahId, jamiahPublicId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        JamiahPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!payment.getJamiahId().equals(jamiahId) || !payment.getCycleId().equals(cycleId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (payment.getPayerUid().equals(recipientUid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        if (!Boolean.TRUE.equals(payment.getConfirmed())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        payment.setRecipientConfirmed(true);
        payment.setRecipientConfirmedAt(Instant.now());
        JamiahPayment saved = paymentRepository.save(payment);
        maybeCompleteCycle(cycle);
        return toDto(saved);
    }

    public List<PaymentDto> getPayments(String jamiahPublicId,
                                        Long cycleId,
                                        String callerUid) {
        JamiahCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Long jamiahId = cycle.getJamiah().getId();
        if (!matchesPublicId(jamiahId, jamiahPublicId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        Jamiah jamiah = cycle.getJamiah();
        boolean isOwner = jamiah.getOwnerId() != null && jamiah.getOwnerId().equals(callerUid);
        boolean isRecipient = cycle.getRecipient() != null && cycle.getRecipient().getUid() != null
                && cycle.getRecipient().getUid().equals(callerUid);
        List<JamiahPayment> payments;
        if (isOwner || isRecipient) {
            payments = paymentRepository.findAllByJamiahIdAndCycleId(jamiahId, cycleId);
        } else {
            payments = paymentRepository.findByJamiahIdAndCycleIdAndPayerUid(jamiahId, cycleId, callerUid)
                    .map(java.util.List::of)
                    .orElse(java.util.Collections.emptyList());
        }
        return payments.stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<CycleSummaryDto> getCycleSummaries(String jamiahPublicId, String callerUid) {
        Jamiah jamiah = jamiahRepository.findByPublicId(jamiahPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (jamiah.getOwnerId() == null || !jamiah.getOwnerId().equals(callerUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        List<JamiahCycle> cycles = cycleRepository.findByJamiahId(jamiah.getId());
        return cycles.stream().map(cycle -> {
            String recipientUid = cycle.getRecipient() != null ? cycle.getRecipient().getUid() : null;
            long totalPayers = cycle.getMemberOrder() != null && !cycle.getMemberOrder().isEmpty()
                    ? cycle.getMemberOrder().stream().filter(uid -> !uid.equals(recipientUid)).count()
                    : jamiahRepository.countMembers(jamiah.getId()) - (recipientUid != null ? 1 : 0);
            List<JamiahPayment> payments = paymentRepository
                    .findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId());
            long paidCount = payments.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getConfirmed()) && !p.getPayerUid().equals(recipientUid))
                    .count();
            long receiptCount = payments.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getRecipientConfirmed()) && !p.getPayerUid().equals(recipientUid))
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

    private PaymentDto toDto(JamiahPayment payment) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        PaymentDto.UserRef ref = new PaymentDto.UserRef();
        ref.setUid(payment.getPayerUid());
        dto.setUser(ref);
        dto.setPaidAt(payment.getPaidAt());
        dto.setConfirmed(Boolean.TRUE.equals(payment.getConfirmed()));
        dto.setRecipientConfirmed(Boolean.TRUE.equals(payment.getRecipientConfirmed()));
        return dto;
    }

    private void maybeCompleteCycle(JamiahCycle cycle) {
        String recipientUid = cycle.getRecipient() != null ? cycle.getRecipient().getUid() : null;
        long memberCount = cycle.getMemberOrder() != null && !cycle.getMemberOrder().isEmpty()
                ? cycle.getMemberOrder().stream().filter(uid -> !uid.equals(recipientUid)).count()
                : jamiahRepository.countMembers(cycle.getJamiah().getId()) - (recipientUid != null ? 1 : 0);
        List<JamiahPayment> payments = paymentRepository
                .findAllByJamiahIdAndCycleId(cycle.getJamiah().getId(), cycle.getId());
        boolean allConfirmed = payments.stream()
                .filter(p -> !p.getPayerUid().equals(recipientUid))
                .allMatch(p -> Boolean.TRUE.equals(p.getRecipientConfirmed()));
        if (memberCount > 0 && allConfirmed && payments.stream()
                .filter(p -> !p.getPayerUid().equals(recipientUid)).count() >= memberCount) {
            cycle.setCompleted(true);
            cycleRepository.save(cycle);
            startNextRoundIfNeeded(cycle);
        }
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

    private boolean matchesPublicId(Long jamiahId, String publicId) {
        if (publicId == null) return true;
        return jamiahRepository.findByPublicId(publicId)
                .map(j -> j.getId().equals(jamiahId))
                .orElse(false);
    }
}
