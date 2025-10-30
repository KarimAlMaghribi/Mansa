package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.dto.PaymentConfirmationDto;
import com.example.backend.jamiah.dto.PaymentDto;
import com.example.backend.payment.StripePaymentProvider;
import com.example.backend.wallet.Wallet;
import com.example.backend.wallet.WalletRepository;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceUnitTest {

    @Mock
    private JamiahPaymentRepository paymentRepository;
    @Mock
    private JamiahCycleRepository cycleRepository;
    @Mock
    private JamiahRepository jamiahRepository;
    @Mock
    private UserProfileRepository userRepository;
    @Mock
    private StripePaymentProvider stripePaymentProvider;
    @Mock
    private WalletRepository walletRepository;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                cycleRepository,
                jamiahRepository,
                userRepository,
                stripePaymentProvider,
                walletRepository,
                "pk_test"
        );
    }

    @Test
    void confirmPaymentThrowsWhenPayerProfileIncomplete() throws Exception {
        Long paymentId = 42L;
        String callerUid = "payer-uid";

        JamiahPayment payment = new JamiahPayment();
        payment.setId(paymentId);
        payment.setPayerUid(callerUid);
        payment.setCycleId(101L);
        payment.setJamiahId(11L);
        payment.setStripePaymentIntentId("pi_test");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(JamiahPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Jamiah jamiah = new Jamiah();
        jamiah.setId(11L);
        jamiah.setRateAmount(new BigDecimal("10"));
        jamiah.setOwnerId(callerUid);

        Jamiah jamiahWithMembers = new Jamiah();
        jamiahWithMembers.setId(11L);
        jamiahWithMembers.setRateAmount(new BigDecimal("10"));
        jamiahWithMembers.setOwnerId(callerUid);
        UserProfile memberProfile = new UserProfile();
        memberProfile.setUid(callerUid);
        jamiahWithMembers.getMembers().add(memberProfile);

        JamiahCycle cycle = new JamiahCycle();
        cycle.setId(101L);
        cycle.setJamiah(jamiah);

        when(cycleRepository.findById(101L)).thenReturn(Optional.of(cycle));
        when(jamiahRepository.findById(11L)).thenReturn(Optional.of(jamiah));
        when(jamiahRepository.findWithMembersById(11L)).thenReturn(Optional.of(jamiahWithMembers));

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getAmount()).thenReturn(1000L);
        when(paymentIntent.getCurrency()).thenReturn("eur");
        when(stripePaymentProvider.retrievePaymentIntent("pi_test")).thenReturn(paymentIntent);

        UserProfile payerProfile = new UserProfile();
        payerProfile.setUid(callerUid);
        when(userRepository.findByUid(callerUid)).thenReturn(Optional.of(payerProfile));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                paymentService.confirmPayment(paymentId, callerUid));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Payer profile incomplete", exception.getReason());
        verify(walletRepository, never()).findById(any());
    }

    @Test
    void initiatePaymentCreatesIntentWithCardPaymentMethodType() throws Exception {
        Long paymentId = 7L;
        String callerUid = "payer-uid";

        JamiahPayment payment = new JamiahPayment();
        payment.setId(paymentId);
        payment.setPayerUid(callerUid);
        payment.setCycleId(88L);
        payment.setJamiahId(55L);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(JamiahPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Jamiah jamiah = new Jamiah();
        jamiah.setId(55L);
        jamiah.setName("Test Jamiah");
        jamiah.setRateAmount(new BigDecimal("10"));
        jamiah.setOwnerId(callerUid);

        JamiahCycle cycle = new JamiahCycle();
        cycle.setId(88L);
        cycle.setJamiah(jamiah);
        cycle.setCycleNumber(1);
        UserProfile recipient = new UserProfile();
        recipient.setUid("recipient");
        cycle.setRecipient(recipient);

        Jamiah jamiahWithMembers = new Jamiah();
        jamiahWithMembers.setId(55L);
        jamiahWithMembers.setName("Test Jamiah");
        jamiahWithMembers.setRateAmount(new BigDecimal("10"));
        jamiahWithMembers.setOwnerId(callerUid);
        UserProfile member = new UserProfile();
        member.setUid(callerUid);
        jamiahWithMembers.getMembers().add(member);

        when(cycleRepository.findById(88L)).thenReturn(Optional.of(cycle));
        when(jamiahRepository.findById(55L)).thenReturn(Optional.of(jamiah));
        when(jamiahRepository.findWithMembersById(55L)).thenReturn(Optional.of(jamiahWithMembers));
        lenient().when(paymentRepository.findAllByJamiahIdAndCycleId(55L, 88L)).thenReturn(List.of(payment));

        PaymentIntent createdIntent = mock(PaymentIntent.class);
        when(createdIntent.getId()).thenReturn("pi_new");
        when(createdIntent.getClientSecret()).thenReturn("secret");
        when(stripePaymentProvider.createPaymentIntent(anyMap())).thenReturn(createdIntent);

        UserProfile payerProfile = new UserProfile();
        payerProfile.setUid(callerUid);
        when(userRepository.findByUid(callerUid)).thenReturn(Optional.of(payerProfile));

        paymentService.initiatePayment(paymentId, callerUid);

        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(stripePaymentProvider).createPaymentIntent(paramsCaptor.capture());
        assertEquals(List.of("card"), paramsCaptor.getValue().get("payment_method_types"));
    }

    @Test
    void initiatePaymentUpdatesIntentWithCardPaymentMethodType() throws Exception {
        Long paymentId = 8L;
        String callerUid = "payer-uid";

        JamiahPayment payment = new JamiahPayment();
        payment.setId(paymentId);
        payment.setPayerUid(callerUid);
        payment.setCycleId(90L);
        payment.setJamiahId(60L);
        payment.setStripePaymentIntentId("pi_existing");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(JamiahPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Jamiah jamiah = new Jamiah();
        jamiah.setId(60L);
        jamiah.setName("Test Jamiah");
        jamiah.setRateAmount(new BigDecimal("10"));
        jamiah.setOwnerId(callerUid);

        JamiahCycle cycle = new JamiahCycle();
        cycle.setId(90L);
        cycle.setJamiah(jamiah);
        cycle.setCycleNumber(2);
        UserProfile recipient = new UserProfile();
        recipient.setUid("recipient");
        cycle.setRecipient(recipient);

        Jamiah jamiahWithMembers = new Jamiah();
        jamiahWithMembers.setId(60L);
        jamiahWithMembers.setName("Test Jamiah");
        jamiahWithMembers.setRateAmount(new BigDecimal("10"));
        jamiahWithMembers.setOwnerId(callerUid);
        UserProfile member = new UserProfile();
        member.setUid(callerUid);
        jamiahWithMembers.getMembers().add(member);

        when(cycleRepository.findById(90L)).thenReturn(Optional.of(cycle));
        when(jamiahRepository.findById(60L)).thenReturn(Optional.of(jamiah));
        when(jamiahRepository.findWithMembersById(60L)).thenReturn(Optional.of(jamiahWithMembers));
        lenient().when(paymentRepository.findAllByJamiahIdAndCycleId(60L, 90L)).thenReturn(List.of(payment));

        PaymentIntent retrievedIntent = mock(PaymentIntent.class);
        when(retrievedIntent.getAmount()).thenReturn(900L);
        when(stripePaymentProvider.retrievePaymentIntent("pi_existing")).thenReturn(retrievedIntent);

        PaymentIntent updatedIntent = mock(PaymentIntent.class);
        when(updatedIntent.getId()).thenReturn("pi_existing");
        when(updatedIntent.getClientSecret()).thenReturn("updated_secret");
        when(stripePaymentProvider.updatePaymentIntent(eq("pi_existing"), anyMap())).thenReturn(updatedIntent);

        UserProfile payerProfile = new UserProfile();
        payerProfile.setUid(callerUid);
        when(userRepository.findByUid(callerUid)).thenReturn(Optional.of(payerProfile));

        paymentService.initiatePayment(paymentId, callerUid);

        ArgumentCaptor<Map<String, Object>> paramsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(stripePaymentProvider).updatePaymentIntent(eq("pi_existing"), paramsCaptor.capture());
        assertEquals(List.of("card"), paramsCaptor.getValue().get("payment_method_types"));
    }

    @Test
    void confirmPaymentSucceedsWhenIntentCompleted() throws Exception {
        Long paymentId = 43L;
        String callerUid = "payer-uid";

        JamiahPayment payment = new JamiahPayment();
        payment.setId(paymentId);
        payment.setPayerUid(callerUid);
        payment.setCycleId(102L);
        payment.setJamiahId(12L);
        payment.setStripePaymentIntentId("pi_test");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(JamiahPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Jamiah jamiah = new Jamiah();
        jamiah.setId(12L);
        jamiah.setName("Jamiah");
        jamiah.setRateAmount(new BigDecimal("10"));
        jamiah.setOwnerId(callerUid);

        Jamiah jamiahWithMembers = new Jamiah();
        jamiahWithMembers.setId(12L);
        jamiahWithMembers.setName("Jamiah");
        jamiahWithMembers.setRateAmount(new BigDecimal("10"));
        jamiahWithMembers.setOwnerId(callerUid);
        UserProfile member = new UserProfile();
        member.setUid(callerUid);
        jamiahWithMembers.getMembers().add(member);

        JamiahCycle cycle = new JamiahCycle();
        cycle.setId(102L);
        cycle.setJamiah(jamiah);
        cycle.setCycleNumber(1);
        UserProfile recipient = new UserProfile();
        recipient.setUid("recipient");
        cycle.setRecipient(recipient);

        when(cycleRepository.findById(102L)).thenReturn(Optional.of(cycle));
        when(jamiahRepository.findById(12L)).thenReturn(Optional.of(jamiah));
        when(jamiahRepository.findWithMembersById(12L)).thenReturn(Optional.of(jamiahWithMembers));

        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(paymentIntent.getStatus()).thenReturn("succeeded");
        when(paymentIntent.getAmount()).thenReturn(1000L);
        when(paymentIntent.getCurrency()).thenReturn("eur");
        when(stripePaymentProvider.retrievePaymentIntent("pi_test")).thenReturn(paymentIntent);

        UserProfile payerProfile = new UserProfile();
        payerProfile.setUid(callerUid);
        setUserProfileId(payerProfile, 99L);
        when(userRepository.findByUid(callerUid)).thenReturn(Optional.of(payerProfile));

        when(walletRepository.findById(99L)).thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentConfirmationDto confirmation = paymentService.confirmPayment(paymentId, callerUid);

        assertEquals(PaymentDto.PaymentStatus.PAID_SELF_CONFIRMED, confirmation.getPayment().getStatus());
        assertEquals(new BigDecimal("10"), confirmation.getWallet().getBalance());
    }

    private void setUserProfileId(UserProfile profile, Long id) throws Exception {
        Field field = UserProfile.class.getDeclaredField("id");
        field.setAccessible(true);
        field.set(profile, id);
    }
}
