package com.example.backend.wallet;

import com.example.backend.UserProfile;
import com.example.backend.UserProfileRepository;
import com.example.backend.jamiah.JamiahService;
import com.example.backend.jamiah.RateInterval;
import com.example.backend.jamiah.dto.JamiahDto;
import com.example.backend.payment.StripePaymentProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WalletControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JamiahService jamiahService;

    @Autowired
    UserProfileRepository userRepository;

    @MockBean
    StripePaymentProvider stripePaymentProvider;

    @BeforeEach
    void setupStripe() throws Exception {
        Account account = mock(Account.class);
        when(account.getId()).thenReturn("acct_test");
        when(account.getDetailsSubmitted()).thenReturn(false);

        AccountLink accountLink = mock(AccountLink.class);
        when(accountLink.getUrl()).thenReturn("https://stripe.test/onboarding");

        when(stripePaymentProvider.isConfigured()).thenReturn(true);
        when(stripePaymentProvider.createAccount(org.mockito.Mockito.any())).thenReturn(account);
        when(stripePaymentProvider.retrieveAccount(org.mockito.Mockito.any())).thenReturn(account);
        when(stripePaymentProvider.createAccountLink(org.mockito.Mockito.any())).thenReturn(accountLink);
        when(stripePaymentProvider.getSandboxId()).thenReturn(null);
    }

    @Test
    void createWalletFailsWhenUrlsMissing() throws Exception {
        String ownerUid = newUid();
        createUser(ownerUid, "owner");
        JamiahDto jamiah = createJamiah(ownerUid);

        mockMvc.perform(post("/api/jamiahs/" + jamiah.getId() + "/wallets")
                        .param("uid", ownerUid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new WalletController.CreateWalletRequest())))
                .andExpect(status().isBadRequest())
                .andExpect(status().reason("Return and refresh URLs are required for Stripe onboarding"));
    }

    @Test
    void walletStatusFailsWhenUrlsMissing() throws Exception {
        String ownerUid = newUid();
        createUser(ownerUid, "owner");
        JamiahDto jamiah = createJamiah(ownerUid);

        mockMvc.perform(get("/api/jamiahs/" + jamiah.getId() + "/wallets/status")
                        .param("uid", ownerUid))
                .andExpect(status().isBadRequest())
                .andExpect(status().reason("Return and refresh URLs are required for Stripe onboarding"));
    }

    private String newUid() {
        return "u-" + UUID.randomUUID();
    }

    private void createUser(String uid, String username) {
        userRepository.findByUid(uid).orElseGet(() -> {
            UserProfile user = new UserProfile();
            user.setUid(uid);
            user.setUsername(username + "-" + uid);
            return userRepository.save(user);
        });
    }

    private JamiahDto createJamiah(String ownerUid) {
        JamiahDto dto = new JamiahDto();
        dto.setName("Wallet Test");
        dto.setIsPublic(true);
        dto.setMaxGroupSize(3);
        dto.setCycleCount(1);
        dto.setRateAmount(new BigDecimal("5"));
        dto.setRateInterval(RateInterval.MONTHLY);
        dto.setStartDate(LocalDate.now());
        return jamiahService.createJamiah(ownerUid, dto);
    }
}

