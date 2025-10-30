package com.example.backend.jamiah;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.payment.StripePaymentProvider;
import com.example.backend.wallet.WalletRepository;
import com.stripe.model.PaymentIntent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
}
