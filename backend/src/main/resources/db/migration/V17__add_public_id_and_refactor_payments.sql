CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE jamiah
    ADD COLUMN public_id UUID;

-- generate identifiers for existing rows using PostgreSQL's pgcrypto extension
-- (gen_random_uuid). For other databases adjust accordingly.
UPDATE jamiah SET public_id = gen_random_uuid() WHERE public_id IS NULL;

ALTER TABLE jamiah
    ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE jamiah
    ADD CONSTRAINT uk_jamiah_public_id UNIQUE (public_id);

ALTER TABLE jamiah_payments
    ADD COLUMN jamiah_id BIGINT,
    ADD COLUMN payer_uid VARCHAR(255);

UPDATE jamiah_payments jp
SET jamiah_id = (SELECT jc.jamiah_id FROM jamiah_cycles jc WHERE jc.id = jp.cycle_id),
    payer_uid = (SELECT up.uid FROM user_profiles up WHERE up.id = jp.user_profile_id);

ALTER TABLE jamiah_payments
    ALTER COLUMN jamiah_id SET NOT NULL;
ALTER TABLE jamiah_payments
    ALTER COLUMN payer_uid SET NOT NULL;

ALTER TABLE jamiah_payments DROP CONSTRAINT IF EXISTS fk_payment_user;
ALTER TABLE jamiah_payments DROP CONSTRAINT IF EXISTS jamiah_payments_user_profile_id_fkey;
ALTER TABLE jamiah_payments DROP COLUMN user_profile_id;
ALTER TABLE jamiah_payments
    ADD CONSTRAINT fk_payment_jamiah FOREIGN KEY (jamiah_id) REFERENCES jamiah(id);

CREATE INDEX idx_payment_jamiah_cycle ON jamiah_payments(jamiah_id, cycle_id);
CREATE INDEX idx_payment_payer ON jamiah_payments(payer_uid);

ALTER TABLE jamiah_payments
    ADD CONSTRAINT uk_payment UNIQUE (jamiah_id, cycle_id, payer_uid);
