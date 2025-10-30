ALTER TABLE jamiah ADD COLUMN stripe_account_id VARCHAR(255);
ALTER TABLE jamiah ADD COLUMN stripe_account_kyc_status VARCHAR(64);
ALTER TABLE jamiah ADD COLUMN stripe_account_charges_enabled BOOLEAN;
ALTER TABLE jamiah ADD COLUMN stripe_account_payouts_enabled BOOLEAN;
ALTER TABLE jamiah ADD COLUMN stripe_account_payouts_locked BOOLEAN;
ALTER TABLE jamiah ADD COLUMN stripe_account_disabled_reason VARCHAR(255);
