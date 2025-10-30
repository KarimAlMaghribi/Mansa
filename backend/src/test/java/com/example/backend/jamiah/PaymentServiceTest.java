package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.jamiah.dto.RoundDto;
import com.example.backend.jamiah.dto.WalletDto;
import com.example.backend.jamiah.dto.CycleSummaryDto;
import com.example.backend.jamiah.JamiahPayment;
import com.example.backend.jamiah.JamiahCycle;
import com.example.backend.payment.StripePaymentProvider;
import com.example.backend.wallet.JamiahWallet;
import com.example.backend.wallet.JamiahWalletRepository;
import com.example.backend.wallet.WalletService;
import com.stripe.model.Account;
import com.stripe.model.Transfer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
    @Autowired
    JamiahWalletRepository walletRepository;
    @Autowired
    WalletService walletService;

    @MockBean
    StripePaymentProvider stripePaymentProvider;

    @BeforeEach
    void setupStripeMocks() throws Exception {
        Account account = org.mockito.Mockito.mock(Account.class);
        org.mockito.Mockito.when(account.getId()).thenReturn("acct_test");
        org.mockito.Mockito.when(account.getDetailsSubmitted()).thenReturn(true);
        org.mockito.Mockito.when(stripePaymentProvider.createAccount(org.mockito.Mockito.any()))
                .thenReturn(account);
        org.mockito.Mockito.when(stripePaymentProvider.retrieveAccount(org.mockito.Mockito.any()))
                .thenReturn(account);
        org.mockito.Mockito.when(stripePaymentProvider.createTransfer(org.mockito.Mockito.any()))
                .thenReturn(org.mockito.Mockito.mock(Transfer.class));
        org.mockito.Mockito.when(stripePaymentProvider.getSandboxId()).thenReturn(null);
    }

    private String newUid() {
        return "u-" + UUID.randomUUID();
    }

    private UserProfile createUser(String uid) {
        return createUser(uid, uid);
    }

    private UserProfile createUser(String uid, String username) {
        return userRepository.findByUid(uid).orElseGet(() -> {
            UserProfile user = new UserProfile();
            user.setUid(uid);
            user.setUsername(username + "-" + uid);
            return userRepository.save(user);
        });
    }

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

    private Jamiah loadJamiah(java.util.UUID publicId) {
        Jamiah jamiah = jamiahRepository.findByPublicId(publicId).orElseThrow();
        return jamiahRepository.findWithMembersById(jamiah.getId()).orElse(jamiah);
    }

    private java.util.List<String> order(String... uids) {
        return new java.util.ArrayList<>(java.util.Arrays.asList(uids));
    }

    private void assertBigDecimalEquals(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }

    @Test
    void startCycleSetsStartDate() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));

        Jamiah jamiahUpdated = loadJamiah(created.getId());
        assertNotNull(jamiahUpdated.getStartDate());
        assertEquals(1, cycle.getCycleNumber());
    }

    @Test
    void paymentsCompleteCycle() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        Long jamiahId = jamiah.getId();
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));
        walletService.topUp(created.getId().toString(), memberUid, new BigDecimal("5"), null, null, false);
        PaymentDto p2 = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("5"), memberUid);
        assertFalse(cycleRepository.findById(cycle.getId()).get().getCompleted());
        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), p2.getId(), ownerUid, ownerUid);
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
    void confirmReceiptTransfersWalletBalances() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String recipientUid = newUid();
        UserProfile recipient = createUser(recipientUid, "rec");
        String payerOneUid = newUid();
        UserProfile payerOne = createUser(payerOneUid, "p1");
        String payerTwoUid = newUid();
        UserProfile payerTwo = createUser(payerTwoUid, "p2");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        Long jamiahId = jamiah.getId();
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(payerOne);
        payerOne.getJamiahs().add(jamiah);
        jamiah.getMembers().add(payerTwo);
        payerTwo.getJamiahs().add(jamiah);
        jamiah.getMembers().removeIf(member -> ownerUid.equals(member.getUid()));
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid,
                order(recipientUid, payerOneUid, payerTwoUid));

        walletService.topUp(created.getId().toString(), payerOneUid, new BigDecimal("5"), null, null, false);
        walletService.topUp(created.getId().toString(), payerTwoUid, new BigDecimal("5"), null, null, false);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), payerOneUid, new BigDecimal("5"), payerOneUid);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), payerTwoUid, new BigDecimal("5"), payerTwoUid);

        RoundDto round = paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), recipientUid);

        assertBigDecimalEquals("0.00", walletRepository.findByJamiah_IdAndMember_Id(jamiahId, payerOne.getId()).orElseThrow().getBalance());
        assertBigDecimalEquals("0.00", walletRepository.findByJamiah_IdAndMember_Id(jamiahId, payerTwo.getId()).orElseThrow().getBalance());
        assertBigDecimalEquals("10.00", walletRepository.findByJamiah_IdAndMember_Id(jamiahId, recipient.getId()).orElseThrow().getBalance());

        assertNotNull(round.getWallets());
        java.util.Map<String, BigDecimal> balances = round.getWallets().stream()
                .collect(java.util.stream.Collectors.toMap(WalletDto::getMemberId, WalletDto::getBalance));
        assertBigDecimalEquals("10.00", balances.get(recipientUid));
        assertBigDecimalEquals("0.00", balances.get(payerOneUid));
        assertBigDecimalEquals("0.00", balances.get(payerTwoUid));
    }

    @Test
    void confirmReceiptIsIdempotentForWallets() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String recipientUid = newUid();
        UserProfile recipient = createUser(recipientUid, "rec");
        String payerUid = newUid();
        UserProfile payer = createUser(payerUid, "payer");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        Long jamiahId = jamiah.getId();
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(payer);
        payer.getJamiahs().add(jamiah);
        jamiah.getMembers().removeIf(member -> ownerUid.equals(member.getUid()));
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid,
                order(recipientUid, payerUid));

        walletService.topUp(created.getId().toString(), payerUid, new BigDecimal("5"), null, null, false);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), payerUid, new BigDecimal("5"), payerUid);

        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), recipientUid);

        BigDecimal recipientBalanceAfterFirst = walletRepository.findByJamiah_IdAndMember_Id(jamiahId, recipient.getId()).orElseThrow().getBalance();
        BigDecimal payerBalanceAfterFirst = walletRepository.findByJamiah_IdAndMember_Id(jamiahId, payer.getId()).orElseThrow().getBalance();

        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), recipientUid);

        BigDecimal recipientBalanceAfterSecond = walletRepository.findByJamiah_IdAndMember_Id(jamiahId, recipient.getId()).orElseThrow().getBalance();
        BigDecimal payerBalanceAfterSecond = walletRepository.findByJamiah_IdAndMember_Id(jamiahId, payer.getId()).orElseThrow().getBalance();

        assertEquals(recipientBalanceAfterFirst, recipientBalanceAfterSecond);
        assertEquals(payerBalanceAfterFirst, payerBalanceAfterSecond);

        long nextCycles = cycleRepository.findByJamiahId(jamiah.getId()).stream()
                .filter(c -> c.getCycleNumber() == 2)
                .count();
        assertEquals(1, nextCycles);
    }

    @Test
    void walletLifecycleFlow() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String recipientUid = newUid();
        UserProfile recipient = createUser(recipientUid, "rec");
        String payerUid = newUid();
        UserProfile payer = createUser(payerUid, "payer");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(payer);
        payer.getJamiahs().add(jamiah);
        jamiah.getMembers().removeIf(member -> ownerUid.equals(member.getUid()));
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid,
                order(recipientUid, payerUid));

        walletService.createWallet(created.getId().toString(), payerUid, null, null, false);
        walletService.createWallet(created.getId().toString(), recipientUid, null, null, false);
        walletService.topUp(created.getId().toString(), payerUid, new BigDecimal("10"), null, null, false);

        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), payerUid, new BigDecimal("5"), payerUid);

        JamiahWallet payerWalletAfterConfirm = walletRepository
                .findByJamiah_IdAndMember_Id(jamiah.getId(), payer.getId()).orElseThrow();
        assertBigDecimalEquals("10.00", payerWalletAfterConfirm.getBalance());
        assertBigDecimalEquals("5.00", payerWalletAfterConfirm.getReservedBalance());

        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), recipientUid);

        JamiahWallet payerWalletAfterReceipt = walletRepository
                .findByJamiah_IdAndMember_Id(jamiah.getId(), payer.getId()).orElseThrow();
        JamiahWallet recipientWallet = walletRepository
                .findByJamiah_IdAndMember_Id(jamiah.getId(), recipient.getId()).orElseThrow();
        assertBigDecimalEquals("5.00", payerWalletAfterReceipt.getBalance());
        assertBigDecimalEquals("0.00", payerWalletAfterReceipt.getReservedBalance());
        assertBigDecimalEquals("5.00", recipientWallet.getBalance());

        walletService.withdraw(created.getId().toString(), recipientUid, new BigDecimal("5"), null, null, false);

        JamiahWallet recipientWalletAfterWithdraw = walletRepository
                .findByJamiah_IdAndMember_Id(jamiah.getId(), recipient.getId()).orElseThrow();
        assertBigDecimalEquals("0.00", recipientWalletAfterWithdraw.getBalance());
    }

    @Test
    void previewStartCalculatesEndDate() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        com.example.backend.jamiah.dto.StartPreviewDto preview = service.previewStart(created.getId().toString(), ownerUid);
        assertEquals(LocalDate.now().plusMonths(1), preview.getExpectedEndDate());
    }

    @Test
    void recordPaymentIsIdempotent() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(memberUid, ownerUid));
        walletService.topUp(created.getId().toString(), ownerUid, new BigDecimal("5"), null, null, false);
        PaymentDto first = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), ownerUid, new BigDecimal("5"), ownerUid);
        PaymentDto second = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), ownerUid, new BigDecimal("5"), ownerUid);
        assertEquals(first.getId(), second.getId());
        assertEquals(1, paymentRepository.findAllByJamiahIdAndCycleId(jamiah.getId(), cycle.getId()).size());
    }

    @Test
    void recordPaymentUpdatesExistingUnconfirmed() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));

        JamiahPayment existing = new JamiahPayment();
        existing.setJamiahId(jamiah.getId());
        existing.setCycleId(cycle.getId());
        existing.setPayerUid(memberUid);
        existing.setAmount(new BigDecimal("5"));
        paymentRepository.save(existing);

        walletService.topUp(created.getId().toString(), memberUid, new BigDecimal("5"), null, null, false);
        PaymentDto updated = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("5"), memberUid);
        assertEquals(existing.getId(), updated.getId());
        assertEquals(PaymentDto.PaymentStatus.PAID_SELF_CONFIRMED, updated.getStatus());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void confirmReceiptOnlyAllowedForRecipient() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));
        walletService.topUp(created.getId().toString(), memberUid, new BigDecimal("5"), null, null, false);
        PaymentDto p = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("5"), memberUid);

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), p.getId(), memberUid, memberUid));
    }

    @Test
    void getPaymentsReturnsAccordingToRole() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");

        String recipientUid = newUid();
        UserProfile recipient = createUser(recipientUid, "rec");

        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        Long jamiahId = jamiah.getId();
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid,
                order(recipientUid, memberUid, ownerUid));

        walletService.topUp(created.getId().toString(), ownerUid, new BigDecimal("5"), null, null, false);
        walletService.topUp(created.getId().toString(), memberUid, new BigDecimal("5"), null, null, false);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), ownerUid, new BigDecimal("5"), ownerUid);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("5"), memberUid);

        assertEquals(2, paymentService.getPayments(created.getId().toString(), cycle.getId(), ownerUid).size());
        assertEquals(2, paymentService.getPayments(created.getId().toString(), cycle.getId(), recipientUid).size());
        assertEquals(1, paymentService.getPayments(created.getId().toString(), cycle.getId(), memberUid).size());
    }

    @Test
    void confirmPaymentRejectedForRecipient() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));
        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), ownerUid, new BigDecimal("5"), ownerUid));
    }

    @Test
    void nonMemberCannotConfirmPayment() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");

        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "member");

        // intruder not added to jamiah
        String intruderUid = newUid();
        UserProfile intruder = createUser(intruderUid, "intruder");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), intruderUid, new BigDecimal("5"), intruderUid));
    }

    @Test
    void paymentWithWrongAmountIsRejected() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");

        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "member");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("10"), memberUid));
    }

    @Test
    void confirmReceiptRequiresConfirmedPayment() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");
        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(ownerUid, memberUid));

        JamiahPayment payment = new JamiahPayment();
        payment.setJamiahId(jamiah.getId());
        payment.setCycleId(cycle.getId());
        payment.setPayerUid(memberUid);
        payment.setAmount(new BigDecimal("5"));
        paymentRepository.save(payment);

        assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), payment.getId(), ownerUid, ownerUid));
    }

    @Test
    void summaryCountsExcludeRecipient() {
        String ownerUid = newUid();
        UserProfile owner = createUser(ownerUid, "owner");

        String recipientUid = newUid();
        UserProfile recipient = createUser(recipientUid, "rec");

        String memberUid = newUid();
        UserProfile member = createUser(memberUid, "m");

        JamiahDto created = createJamiah(ownerUid);
        Jamiah jamiah = loadJamiah(created.getId());
        jamiah.getMembers().add(recipient);
        recipient.getJamiahs().add(jamiah);
        jamiah.getMembers().add(member);
        member.getJamiahs().add(jamiah);
        jamiahRepository.save(jamiah);

        JamiahCycle cycle = service.startCycle(created.getId().toString(), ownerUid, order(recipientUid, memberUid, ownerUid));
        walletService.topUp(created.getId().toString(), ownerUid, new BigDecimal("5"), null, null, false);
        walletService.topUp(created.getId().toString(), memberUid, new BigDecimal("5"), null, null, false);
        PaymentDto ownerPayment = paymentService.confirmPayment(created.getId().toString(), cycle.getId(), ownerUid, new BigDecimal("5"), ownerUid);
        paymentService.confirmPayment(created.getId().toString(), cycle.getId(), memberUid, new BigDecimal("5"), memberUid);
        paymentService.confirmReceipt(created.getId().toString(), cycle.getId(), ownerPayment.getId(), recipientUid, recipientUid);

        java.util.List<CycleSummaryDto> summary = paymentService.getCycleSummaries(created.getId().toString(), ownerUid);
        assertTrue(summary.size() >= 1);
        CycleSummaryDto s = summary.stream()
                .filter(dto -> dto.getCycleNumber() == 1)
                .findFirst()
                .orElseThrow();
        assertEquals(2, s.getTotalPayers());
        assertEquals(2, s.getPaidCount());
        assertEquals(2, s.getReceiptCount());
        assertEquals(recipientUid, s.getRecipientUid());
    }
}
