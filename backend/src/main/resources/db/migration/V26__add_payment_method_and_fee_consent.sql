ALTER TABLE jamiah ADD COLUMN payment_method VARCHAR(255);
ALTER TABLE jamiah ADD COLUMN stripe_fee_consent_accepted BOOLEAN;
ALTER TABLE jamiah ADD COLUMN stripe_fee_consent_accepted_at TIMESTAMP;
UPDATE jamiah
SET payment_method = COALESCE(payment_method, 'STRIPE'),
    stripe_fee_consent_accepted = COALESCE(stripe_fee_consent_accepted, TRUE),
    stripe_fee_consent_accepted_at = COALESCE(stripe_fee_consent_accepted_at, CURRENT_TIMESTAMP);
