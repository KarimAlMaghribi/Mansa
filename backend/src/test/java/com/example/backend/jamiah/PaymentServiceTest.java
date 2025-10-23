package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.CycleSummaryDto;
import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.jamiah.JamiahCycle;
import com.example.backend.jamiah.JamiahPayment;
import com.example.backend.payment.StripePaymentProvider;
import com.example.backend.wallet.WalletRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.mockito.Mockito;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class PaymentServiceTest {
    @Autowired
    JamiahService service;
    @Autowired
    PaymentService paymentService;
    @Autowired
    JamiahRepository jamiahRepository;
    @Autowired
    JamiahCycleRepository cycleRepository;
    @Autowired
    JamiahPaymentRepository paymentRepository;
    @Autowired
    UserProfileRepository userRepository;
    @MockBean
    StripePaymentProvider stripePaymentProvider;
    @SpyBean
    WalletRepository walletRepository;

    private JamiahDto createJamiah(String ownerUid) {
        JamiahDto dto = new JamiahDto();
        dto.setName("Cycle Test");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        return service.createJamiah(ownerUid, dto);
    }

    @Test
    void startCycleSetsStartDate() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        Jamiah jamiahUpdated = jamiahRepository.findAll().get(0);
        assertNotNull(jamiahUpdated.getStartDate());
        assertEquals(1, cycle.getCycleNumber());
    }

    @Test
    void paymentsCompleteCycle() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));
        PaymentDto p2 = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u2", new BigDecimal("5"), "u2");
        assertFalse(cycleRepository.findById(cycle.getId()).get().getCompleted());
        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), p2.getId(), "u1", "u1");
        JamiahCycle completed = cycleRepository.findById(cycle.getId()).orElseThrow();
        assertTrue(completed.getCompleted());
        JamiahCycle next = cycleRepository.findByJamiahId(jamiah.getId()).stream()
                .filter(c -> c.getCycleNumber() == 2)
                .findFirst()
                .orElse(null);
        assertNotNull(next);
        assertEquals(completed.getStartDate().plusMonths(1), next.getStartDate());
    }

    @Test
    void previewStartCalculatesEndDate() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        com.example.backend.jamiah.dto.StartPreviewDto preview = service.previewStart(created.getId().toString(), "u1");
        assertEquals(LocalDate.now().plusMonths(1), preview.getExpectedEndDate());
    }

    @Test
    void recordPaymentIsIdempotent() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u2", "u1"));
        PaymentDto first = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u1", new BigDecimal("5"), "u1");
        PaymentDto second = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u1", new BigDecimal("5"), "u1");
        assertEquals(first.getId(), second.getId());
        assertEquals(1, paymentRepository.findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId()).size());
    }

    @Test
    void recordPaymentUpdatesExistingUnconfirmed() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        JamiahPayment existing = new JamiahPayment();
        existing.setJamiahId(jamiah.getId());
        existing.setCycleId(cycle.getId());
        existing.setPayerUid("u2");
        existing.setAmount(new BigDecimal("5"));
        paymentRepository.save(existing);

        PaymentDto updated = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u2", new BigDecimal("5"), "u2");
        assertEquals(existing.getId(), updated.getId());
        assertEquals(PaymentDto.PaymentStatus.PAID_SELF_CONFIRMED, updated.getStatus());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void confirmReceiptOnlyAllowedForRecipient() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));
        PaymentDto p = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u2", new BigDecimal("5"), "u2");

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), p.getId(), "u2", "u2"));
    }

    @Test
    void getPaymentsReturnsAccordingToRole() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile recipient = new UserProfile();
        recipient.setUsername("rec");
        recipient.setUid("u2");
        userRepository.save(recipient);

        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u3");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1",
                java.util.Arrays.asList("u2", "u3", "u1"));

        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u1", new BigDecimal("5"), "u1");
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u3", new BigDecimal("5"), "u3");

        assertEquals(2, paymentService.getPayments(created.getId().toString(), cycle.getId(), "u1").size());
        assertEquals(2, paymentService.getPayments(created.getId().toString(), cycle.getId(), "u2").size());
        assertEquals(1, paymentService.getPayments(created.getId().toString(), cycle.getId(), "u3").size());
    }

    @Test
    void confirmPaymentRejectedForRecipient() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));
        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u1", new BigDecimal("5"), "u1"));
    }

    @Test
    void nonMemberCannotConfirmPayment() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile member = new UserProfile();
        member.setUsername("member");
        member.setUid("u2");
        userRepository.save(member);

        // intruder not added to jamiah
        UserProfile intruder = new UserProfile();
        intruder.setUsername("intruder");
        intruder.setUid("u3");
        userRepository.save(intruder);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u3", new BigDecimal("5"), "u3"));
    }

    @Test
    void paymentWithWrongAmountIsRejected() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile member = new UserProfile();
        member.setUsername("member");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u2", new BigDecimal("10"), "u2"));
    }

    @Test
    void confirmReceiptRequiresConfirmedPayment() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);
        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        JamiahPayment payment = new JamiahPayment();
        payment.setJamiahId(jamiah.getId());
        payment.setCycleId(cycle.getId());
        payment.setPayerUid("u2");
        paymentRepository.save(payment);

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), payment.getId(), "u1", "u1"));
    }

    @Test
    void confirmPaymentTranslatesWalletInsertFailure() throws StripeException {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u2");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u1", "u2"));

        JamiahPayment payment = paymentRepository.findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId()).stream()
                .filter(p -> "u2".equals(p.getPayerUid()))
                .findFirst()
                .orElseThrow();
        payment.setStripePaymentIntentId("pi_test");
        paymentRepository.save(payment);

        PaymentIntent paymentIntent = Mockito.mock(PaymentIntent.class);
        Mockito.when(paymentIntent.getStatus()).thenReturn("succeeded");
        Mockito.when(paymentIntent.getAmount()).thenReturn(500L);
        Mockito.when(paymentIntent.getCurrency()).thenReturn("eur");
        Mockito.when(stripePaymentProvider.retrievePaymentIntent("pi_test")).thenReturn(paymentIntent);

        Mockito.doThrow(new DataIntegrityViolationException("duplicate key"))
                .when(walletRepository).save(Mockito.any());

        try {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> paymentService.confirmPayment(payment.getId(), "u2"));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertEquals("Unable to update wallet", ex.getReason());
        } finally {
            Mockito.reset(walletRepository);
            Mockito.reset(stripePaymentProvider);
        }
    }

    @Test
    void summaryCountsExcludeRecipient() {
        UserProfile owner = new UserProfile();
        owner.setUsername("owner");
        owner.setUid("u1");
        userRepository.save(owner);

        UserProfile recipient = new UserProfile();
        recipient.setUsername("rec");
        recipient.setUid("u2");
        userRepository.save(recipient);

        UserProfile member = new UserProfile();
        member.setUsername("m");
        member.setUid("u3");
        userRepository.save(member);

        JamiahDto created = createJamiah("u1");
        Jamiah jamiah = jamiahRepository.findAll().get(0);
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), "u1", java.util.Arrays.asList("u2", "u3", "u1"));
        PaymentDto p = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), "u1", new BigDecimal("5"), "u1");
        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), p.getId(), "u2", "u2");

        java.util.List<CycleSummaryDto> summary = paymentService.getCycleSummaries(created.getId().toString(), "u1");
        assertEquals(1, summary.size());
        CycleSummaryDto s = summary.get(0);
        assertEquals(2, s.getTotalPayers());
        assertEquals(1, s.getPaidCount());
        assertEquals(1, s.getReceiptCount());
        assertEquals("u2", s.getRecipientUid());
    }
}
