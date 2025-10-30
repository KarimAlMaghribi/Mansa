package com.example.backend.wallet;

import com.example.backend.jamiah.Jamiah;
import com.example.backend.jamiah.JamiahRepository;
import com.stripe.model.Account;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Component
public class StripeAccountStatusUpdater {

    private final JamiahRepository jamiahRepository;
    private final JamiahWalletRepository walletRepository;

    public StripeAccountStatusUpdater(JamiahRepository jamiahRepository,
                                      JamiahWalletRepository walletRepository) {
        this.jamiahRepository = jamiahRepository;
        this.walletRepository = walletRepository;
    }

    public void applyAccountState(Jamiah jamiah, Account account, Collection<JamiahWallet> wallets) {
        if (jamiah == null || account == null) {
            return;
        }
        Collection<JamiahWallet> effectiveWallets = wallets != null ? wallets
                : walletRepository.findAllByJamiah_Id(jamiah.getId());

        boolean detailsSubmitted = Boolean.TRUE.equals(account.getDetailsSubmitted());
        String kycStatus = detailsSubmitted ? "verified" : "pending";

        Boolean payoutsEnabled = account.getPayoutsEnabled();
        boolean payoutsLocked = Boolean.FALSE.equals(payoutsEnabled);

        Account.Requirements requirements = account.getRequirements();
        String disabledReason = requirements != null ? requirements.getDisabledReason() : null;
        if (!payoutsLocked && requirements != null) {
            List<String> currentlyDue = requirements.getCurrentlyDue();
            if (currentlyDue != null && currentlyDue.stream().filter(Objects::nonNull).findAny().isPresent()) {
                payoutsLocked = true;
            }
        }
        if (!payoutsLocked && disabledReason != null && !disabledReason.isBlank()) {
            payoutsLocked = true;
        }

        jamiah.setStripeAccountKycStatus(kycStatus);
        jamiah.setStripeAccountChargesEnabled(account.getChargesEnabled());
        jamiah.setStripeAccountPayoutsEnabled(payoutsEnabled);
        jamiah.setStripeAccountPayoutsLocked(payoutsLocked);
        jamiah.setStripeAccountDisabledReason(disabledReason);

        for (JamiahWallet wallet : effectiveWallets) {
            wallet.setStripeAccountId(jamiah.getStripeAccountId());
            wallet.setKycStatus(kycStatus);
            walletRepository.save(wallet);
        }

        jamiahRepository.save(jamiah);
    }
}
