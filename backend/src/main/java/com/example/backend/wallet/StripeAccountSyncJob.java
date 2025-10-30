package com.example.backend.wallet;

import com.example.backend.jamiah.Jamiah;
import com.example.backend.jamiah.JamiahRepository;
import com.example.backend.payment.StripePaymentProvider;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class StripeAccountSyncJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(StripeAccountSyncJob.class);

    private final JamiahRepository jamiahRepository;
    private final StripePaymentProvider stripePaymentProvider;
    private final StripeAccountStatusUpdater statusUpdater;

    public StripeAccountSyncJob(JamiahRepository jamiahRepository,
                                StripePaymentProvider stripePaymentProvider,
                                StripeAccountStatusUpdater statusUpdater) {
        this.jamiahRepository = jamiahRepository;
        this.stripePaymentProvider = stripePaymentProvider;
        this.statusUpdater = statusUpdater;
    }

    @Scheduled(cron = "${stripe.sync.cron:0 0/30 * * * *}")
    @Transactional
    public void synchronizeAccounts() {
        if (!stripePaymentProvider.isConfigured()) {
            return;
        }
        List<Jamiah> jamiahs = jamiahRepository.findByStripeAccountIdIsNotNull();
        for (Jamiah jamiah : jamiahs) {
            String accountId = jamiah.getStripeAccountId();
            if (accountId == null || accountId.isBlank()) {
                continue;
            }
            try {
                Account account = stripePaymentProvider.retrieveAccount(accountId);
                statusUpdater.applyAccountState(jamiah, account, null);
            } catch (StripeException ex) {
                LOGGER.warn("Failed to synchronize Stripe account {} for Jamiah {}: {}", accountId, jamiah.getId(), ex.getMessage());
            }
        }
    }
}
