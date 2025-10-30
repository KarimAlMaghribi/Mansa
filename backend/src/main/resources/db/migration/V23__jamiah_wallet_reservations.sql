ALTER TABLE jamiah_wallets ADD COLUMN reserved_balance NUMERIC(19, 2) NOT NULL DEFAULT 0;
ALTER TABLE jamiah_wallets ADD COLUMN locked_for_payments BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE jamiah_wallets ADD COLUMN locked_for_payouts BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE jamiah_wallets
SET reserved_balance = COALESCE(reserved_balance, 0),
    locked_for_payments = COALESCE(locked_for_payments, FALSE),
    locked_for_payouts = COALESCE(locked_for_payouts, FALSE);
