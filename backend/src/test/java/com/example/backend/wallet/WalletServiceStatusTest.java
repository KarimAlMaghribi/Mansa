package com.example.backend.wallet;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.Jamiah;
import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.payment.StripePaymentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceStatusTest {

    @Mock
    private JamiahRepository jamiahRepository;
    @Mock
    private JamiahWalletRepository walletRepository;
    @Mock
    private UserProfileRepository userRepository;
    @Mock
    private WalletTopUpRepository walletTopUpRepository;
    @Mock
    private StripePaymentProvider stripePaymentProvider;
    @Mock
    private StripeAccountStatusUpdater stripeAccountStatusUpdater;

    @InjectMocks
    private WalletService walletService;

    @BeforeEach
    void setUp() {
        walletService = new WalletService(
                jamiahRepository,
                walletRepository,
                userRepository,
                walletTopUpRepository,
                stripePaymentProvider,
                stripeAccountStatusUpdater,
                "",
                "",
                ""
        );
    }

    @Test
    void returnsStatusMessageWhenStripeNotConfigured() {
        UUID publicId = UUID.randomUUID();
        Jamiah jamiah = new Jamiah();
        jamiah.setId(1L);
        jamiah.setPublicId(publicId);
        jamiah.setOwnerId("member-1");

        Jamiah jamiahWithMembers = new Jamiah();
        jamiahWithMembers.setId(1L);
        jamiahWithMembers.setPublicId(publicId);
        jamiahWithMembers.setOwnerId("member-1");

        UserProfile member = new UserProfile();
        member.setUid("member-1");
        setUserProfileId(member, 11L);
        jamiahWithMembers.getMembers().add(member);

        JamiahWallet wallet = new JamiahWallet();
        wallet.setJamiah(jamiahWithMembers);
        wallet.setMember(member);
        wallet.setBalance(BigDecimal.TEN);
        wallet.setReservedBalance(BigDecimal.ZERO);

        when(jamiahRepository.findByPublicId(publicId)).thenReturn(Optional.of(jamiah));
        when(jamiahRepository.findWithMembersById(1L)).thenReturn(Optional.of(jamiahWithMembers));
        when(userRepository.findByUid("member-1")).thenReturn(Optional.of(member));
        when(walletRepository.findByJamiah_IdAndMember_Id(anyLong(), anyLong())).thenReturn(Optional.of(wallet));
        when(walletTopUpRepository.findAllByJamiahIdAndMemberIdAndAppliedFalse(anyLong(), anyLong()))
                .thenReturn(java.util.List.of());
        when(stripePaymentProvider.isConfigured()).thenReturn(false);

        WalletStatusResponse response = walletService.getStatus(publicId.toString(), "member-1", null, null, false);

        assertNotNull(response);
        assertFalse(response.isRequiresOnboarding());
        assertFalse(response.isStripeConfigured());
        assertEquals("Stripe ist nicht konfiguriert. Bitte kontaktiere die Administration für die Einrichtung.",
                response.getStatusMessage());
    }

    private void setUserProfileId(UserProfile profile, long id) {
        try {
            java.lang.reflect.Field field = UserProfile.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(profile, id);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
